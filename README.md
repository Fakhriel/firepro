# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for Admin, Owner, Supervisor, and Karyawan Teknisi (field technician).

> **Status:** 🚧 Under active development. Backend is functionally complete for all role tiers. Phase 1 and Phase 1.5 have been through repeated automated testing and are in good shape overall, but this pass surfaced a handful of real bugs that need attention before Phase 1 can be called done. **Phase 2 (notifications, announcements, GPS attendance, etc.) has now been tested live for the first time — and turned out to be significantly less complete than reported.**

---

> ## ⚠️ Testing methodology — read this before trusting any ✅ below
>
> Everything marked ✅ in this document was verified by **Claude AI running automated tests** — booting the real backend against a real MySQL database (fresh install, full migration chain, seeded accounts) and firing live HTTP requests at every endpoint (create/read/update/delete, cross-role access attempts, malformed input, edge cases like missing bodies/overpayment/double-submission). This is thorough at the **API level**, but it is **not** the same as manual testing:
>
> - It doesn't click through the actual UI in a browser — a page can call the right API correctly and still be confusing, broken-looking, or unusable for a real person.
> - It doesn't catch layout/responsive/visual issues, browser-specific quirks, or real-world usage patterns.
> - It's only as good as the scenarios that were thought to test — a human doing exploratory manual testing will find things an API-level test script won't think to try.
>
> **Manual end-to-end testing by Ariel has not happened yet.** Treat every ✅ here as "the backend logic behind this is sound," not as "this is production-ready and user-tested."

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Backend | Node.js, Express 5 |
| Database | MySQL, Sequelize |
| Authentication | JWT, bcryptjs |
| Frontend | Astro, Tailwind CSS, GSAP |
| Security | Helmet, CORS, express-rate-limit |

---

## 🔴 New critical findings — this pass

These were found by actually booting the backend, running live requests, and reading the source behind unexpected results. Ordered by impact.

### 1. Owner literally cannot convert an accepted Quotation into an Invoice — 403, not just "not mirrored"
Previously logged as "not mirrored to Owner routes." Live testing shows it's worse: calling the **legacy** endpoint (`POST /api/invoices/from-quotation/:quotationId`) with a real Owner JWT returns a flat `403 — "Hanya role (admin, superadmin) yang boleh mengakses fitur ini."` The route-level role guard blocks Owner outright, and `POST /api/owner/invoices/from-quotation/:id` doesn't exist (`404`). Owner has **no path at all** to this feature today, despite the spec requiring full Owner CRUD everywhere.

### 2. Same bug, same shape, on invoice payments
`POST /api/invoices/:id/payments` (record a payment) and its `DELETE` counterpart only exist under the legacy `/api/invoices` routes, guarded to `admin`/`superadmin` only. Live-tested: Owner token → `403`. `owner-invoices.routes.js` has no payment endpoints at all. This is the exact same "new endpoint lands on legacy routes, never mirrored to Owner" pattern as BOQ/Documents/from-quotation — now confirmed a third time, on money-handling functionality.

### 3. Quotation still doesn't auto-sum from BOQ — and it now visibly produces a wrong invoice amount
Confirmed live end-to-end: created a quotation with `amount = Rp1.000.000`, attached a BOQ item worth `Rp5.000.000` (`qty 10 × unitPrice 500.000`, linked via `quotationId`), then converted that quotation to an invoice — the resulting invoice came out at `Rp1.000.000`, silently ignoring the actual BOQ total. This is no longer just a "completeness gap"; it's a live path to **an invoice with the wrong amount** whenever the BOQ-first workflow is used.

### 4. Attendance GPS + photo capture: the DB column exists, nothing else does
Migration `20260101000027-add-gps-photo-to-attendance.js` adds `check_in_lat`, `check_in_lng`, `check_in_photo`, `check_out_lat`, `check_out_lng`, `check_out_photo` to the `attendance` table. Live test: sent `lat`, `lng`, `photo` on check-in → **all six columns stayed `NULL`** in the database, and the response only ever echoes the old `location` string field. Root cause, read directly from source:
- `attendance.model.js` doesn't declare these 6 columns at all.
- `attendance.service.js` (`checkIn`/`checkOut`) only accepts a `location` string parameter — no `lat`/`lng`/`photo` in the function signature.
- `technical-attendance.controller.js` only forwards `req.body.location` — no multer/file-upload wiring for a photo.

This isn't "implemented but untested" — it's an unfinished feature. The migration ran ahead of the model/service/controller work.

### 5. Task-assignment and purchase-request-review notifications are never sent
Live test: Supervisor assigns a new project task to a technician → technician's `/api/notifications` stays empty (only pre-existing announcements show up). Same for purchase-request approve/reject — the requester gets no notification. Confirmed via source: **zero** calls to `notifyUser`/`notifyRole` anywhere in `project-assignments.service.js` or `purchase-requests.service.js`. The comment inside `notifications.service.js` says it's "called from project-assignments, purchase-requests, etc." — that wiring was never actually written. (The Announcement→Notification path itself works correctly — see ✅ section below.)

### 6. Any POST/PATCH sent with no request body (or wrong `Content-Type`) crashes with a raw 500
Live test: `POST /api/admin-auth/login` with no body at all →
```
TypeError: Cannot destructure property 'username' of 'req.body' as it is undefined.
```
returned as an unhandled `500`, not a graceful `400`. This isn't login-specific — `express.json()` only populates `req.body` when `Content-Type: application/json` is present; otherwise `req.body` is `undefined` in Express 5, and controllers destructure it directly with no fallback. Reproduced the same crash on `POST /api/owner/clients` and `POST /api/owner/projects`. A grep shows **22 controller files** across `modules/`, `modules-owner/`, `modules-supervisor/`, and `modules-technical/` use `req.body` without a `|| {}` fallback — this is a systemic gap, not an isolated bug. Low severity (needs a malformed/no-body request, not a data leak), but worth a global fix: either default `req.body = {}` in middleware, or add `express.json()` strictness handling.

### 7. Document upload whitelist accepts arbitrary files via `application/octet-stream`
Live test: uploaded a `.sh` shell script (not a real office document) as a Document, with `Content-Type: application/octet-stream` → accepted, `201`, stored without complaint. `application/octet-stream` is in `DOCUMENT_MIME_WHITELIST` inside `uploadStorage.js`, and since the MIME type is client-supplied, effectively **any file type can be uploaded** by claiming that generic MIME. Needs an extension-based whitelist alongside the MIME check, not MIME alone.

---

## 🟢 Confirmed correct — this pass (some previously "open" items turned out to already be fixed)

Good news mixed in with the above — a few Phase 1 checklist items marked "still open" were live-tested and are actually already solid:

| Item | Result |
|---|---|
| `technicianId` role validation on assignment creation | ✅ Assigning to a non-`karyawan` account → `400`; assigning to a real `karyawan` → `201`. This is implemented and correct now. |
| Status-transition guard on Task status update | ✅ `assigned → done` allowed; `done → assigned` rejected `400` ("Tidak bisa mengubah status dari 'done' ke 'assigned'."). `done` is correctly treated as final. |
| Status-transition guard on Purchase Request review | ✅ Approve a request, then try to reject the same one → `400`. Re-reviewing an already-decided request is blocked. |
| `createFromQuotation`'s draft-rejection guard | ✅ **Now confirmed live** (previously "unverified" — the earlier test run got cut short). Converting a still-`draft` quotation → `400`. Converting an `accepted` one → `201`. Converting the same quotation twice → `400` on the second attempt (no duplicate invoices). |
| Announcement → Notification delivery | ✅ Owner posts an announcement targeting `supervisor` + `karyawan` → both roles receive a real notification row via `GET /api/notifications`, correctly scoped per recipient. Role-restricted to `admin`/`superadmin`/`owner` (`403` for others), and rejects invalid `targetRoles` (`400`). |
| Notification list — no IDOR | ✅ Tried to read another user's notifications by passing `?adminId=<other id>` as a technician — ignored, still scoped to the caller's own token. |
| Invoice payment ledger — overpayment guard | ✅ Partially pay an invoice, then try to pay more than the remaining balance → `400` ("Total pembayaran melebihi nilai invoice... Sisa yang bisa dibayarkan: X"), with the exact correct remaining amount quoted back. |
| Invoice payment ledger — draft-invoice guard | ✅ Can't record a payment against a `draft` invoice until it's moved to `issued`/`unpaid` — correctly blocked with a clear message. |
| Cross-role route leakage | ✅ Karyawan Teknisi token against `/api/owner/users` → `403`, correctly scoped. |
| Migration chain (25 files, incl. duplicate `000016`×3 / `000017`×2 / `000018`×2 prefixes) | ✅ Runs clean end-to-end on a fresh database, no collisions in practice — still cosmetically worth renumbering. |
| Error-handling — stack traces | ✅ Confirmed gated behind `NODE_ENV === 'development'` in `errorHandler.js`; won't leak in production **as long as `NODE_ENV=production` is actually set at deploy time.** |

---

## Phase 1 — Automated Testing Results (carried over, still holding)

### ✅ Admin/Owner architecture consolidation
Verified live across multiple passes: `admin` role can create `supervisor`/`karyawan` accounts (`201`) but is blocked (`403`) from creating `admin`/`owner` accounts or deleting any account, with clear Indonesian error messages. Implementation reuses the `owner-users` controller at two mount paths with role-specific guards.

### ✅ Three app-wide-impact bugs (found + fixed earlier, still holding)
- `isActive` missing from `admin.model.js` — was breaking every authenticated request app-wide
- BOQ role guard excluding `owner`
- `purchase_price` left `NOT NULL` after a column rename, breaking all inventory creation

### ✅ BOQ & Document Management — full CRUD verified live
BOQ update (recalculates `total` correctly), delete + confirm gone, Documents download (byte-for-byte correct), Documents delete — all verified. Legacy Admin pages (`boq.astro`, `documents.astro`) confirmed wired.

### ✅ Reports/ROI formula
`(Contract Value − Cost) / Cost × 100` — matches spec, verified by reading `reports.service.js`.

---

## Phase 1 — Still Open

- **Owner can't convert Quotation → Invoice, at all** (see finding #1 above) — upgraded from "not mirrored" to "actively blocked."
- **Owner can't record or delete invoice payments, at all** (see finding #2 above) — newly discovered this pass.
- **Quotation doesn't auto-sum from linked BOQ items**, and this now has a confirmed downstream effect: invoices created from a BOQ-backed quotation carry the wrong (manually-entered, stale) amount (see finding #3).
- **`uploadStorage.js` document whitelist accepts arbitrary files via `application/octet-stream`** (see finding #7) — needs an extension-based whitelist in addition to the MIME check.
- **No global fallback for a missing/malformed request body** — 22 controller files destructure `req.body` directly with no `|| {}` guard, causing a raw `500` instead of a graceful `400` on requests sent without `Content-Type: application/json` (see finding #6).
- **Duplicate migration numbers** (`016`×3, `017`×2, `018`×2) — confirmed still cosmetic; migration chain runs clean end-to-end regardless. Still worth renumbering to avoid future collisions.

### Closed this pass (previously listed as open, now confirmed fixed)
- ~~No technician-role validation on assignment creation~~ — ✅ implemented and verified live.
- ~~No status-transition guard on Purchase Request review or Task status update~~ — ✅ both implemented and verified live.
- ~~`createFromQuotation`'s status guard is unverified~~ — ✅ confirmed live: draft quotations correctly rejected.

---

## Phase 2 — Tested live for the first time this pass

Ariel reported Phase 2 as complete. This pass booted the backend and hit every Phase 2 endpoint with real requests for the first time. Result: **notifications and announcements work correctly; GPS/photo attendance and the notification-triggers from other modules do not.**

| Feature | Status |
|---|---|
| Notification list, per-user scoping, no IDOR | ✅ Verified live |
| Announcement creation + role targeting + delivery | ✅ Verified live |
| Announcement → Notification fan-out | ✅ Verified live |
| Task-assignment → notify technician | ❌ Not implemented (no call to the notification service anywhere in `project-assignments.service.js`) |
| Purchase-request review → notify requester | ❌ Not implemented (same gap in `purchase-requests.service.js`) |
| Attendance GPS coordinates (check-in/check-out) | ❌ Not implemented — DB columns exist, nothing reads or writes them |
| Attendance photo capture | ❌ Not implemented — same as above, no upload wiring exists |

---

## Roadmap

### Phase 1 — Bug fixes & hardening
- [x] Migration `015` syntax error
- [x] `project.code` length handling
- [x] Overview stat-card endpoints
- [x] Projects Create/Update/Delete form (Owner UI)
- [x] Invoices Create form (Owner UI)
- [x] `isActive` missing from `admin.model.js`
- [x] BOQ excluding `owner` from its role guard
- [x] `purchase_price` NOT NULL after rename
- [x] BOQ full CRUD (create/read/update/delete) — verified live
- [x] Documents full CRUD + download — verified live
- [x] Admin/Owner architecture split — independently re-verified live
- [x] Validate `technicianId` role on assignment creation — verified live
- [x] Add a status guard to Purchase Request review and Task status update — verified live
- [x] Confirm `createFromQuotation` rejects non-`accepted` quotations live — verified
- [ ] **Give Owner access to `from-quotation` invoice conversion** (currently hard-blocked, `403`)
- [ ] **Give Owner access to invoice payment recording/deletion** (currently missing entirely)
- [ ] Quotation auto-sum from linked BOQ items — now has a confirmed downstream invoice-amount bug, higher priority than before
- [ ] Harden `uploadStorage.js` document whitelist (drop bare `application/octet-stream`, add extension check)
- [ ] Add a global fallback for missing/malformed request bodies (22 affected controller files)
- [ ] Renumber duplicate migration prefixes

### Phase 2 — Backend / feature work
- [x] Notification system (core delivery + scoping) — verified live
- [x] Announcement / pengumuman module — verified live
- [ ] **Wire task-assignment notifications for Karyawan Teknisi** (service-level integration missing)
- [ ] **Wire purchase-request-review notifications for the requester** (same gap)
- [ ] **Attendance GPS capture** — needs model, service, and controller changes; migration alone isn't enough
- [ ] **Attendance photo capture** — needs multer wiring + model/service changes
- [ ] Written RBAC reference
- [ ] Automated tests (as a checked-in test suite, not just ad-hoc passes)
- [ ] **Manual end-to-end testing across all five roles — not started, this is still the next real milestone**

---

## Tech Status (backend)

Core/shared modules (`backend/src/modules/`): Admin Authentication (split superadmin `/api/admins` + admin `/api/admin/users`, verified live), Clients, Projects, Quotations, Invoices, Maintenance, Inventory, Reports, BOQ, Documents, Attendance, Daily Reports, Project Assignments, Project Documentation, Purchase Requests, Notifications, Announcements.

Role-scoped route groups, all mounted and reachable: `modules-owner/` → `/api/owner/*`, `modules-supervisor/` → `/api/supervisor/*`, `modules-technical/` → `/api/technical/*`. Note: `modules-owner` is missing coverage for two money/workflow-critical actions — invoice-from-quotation conversion and payment recording — both of which currently only exist on the legacy `/api/invoices` routes and are role-locked away from Owner.

Also implemented (verified across passes, still holding): JWT auth with correct expiry/tampering/`alg:none` rejection, route-level role guards with no cross-role leakage found, SQL injection safety, stored XSS escaping, user-enumeration protection, IP + per-account rate limiting on login, Helmet + CORS, a full migration chain that runs cleanly end to end, error responses that don't leak stack traces outside development mode.

### Completed — Frontend

**Legacy Admin UI**: role-branching `admins.astro`, `boq.astro`, `documents.astro` all confirmed wired.

**Owner**: user management, Projects/Invoices, BOQ, Documents — CRUD verified live. (Invoice-from-quotation and payment recording are not reachable from the Owner UI either, since the backend doesn't expose them to this role yet.)

**Supervisor and Karyawan Teknisi**: wired, needs a UX/edge-case pass (and, like everything else, still needs manual testing).

---

## Running Locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run seed:admin
npm run dev
```

Update `.env` with your database credentials and a secure `JWT_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

Default seeded credentials come from `.env` (`SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD`, and `SEED_OWNER_USERNAME`/`SEED_OWNER_PASSWORD` via `npm run seed:owner`), unless overridden. Note: the `seed:admin` account is created with role `superadmin`, not `admin` — to test the `admin`-role restrictions, create a separate `admin`-role account through the Owner UI (or `POST /api/owner/users`).

**Reminder:** always run production deployments with `NODE_ENV=production` — the error handler only suppresses stack traces when this is set correctly.

### Dashboard

```bash
cd dashboard
npm install
cp .env.example .env
npm run dev
```

Configure `PUBLIC_API_URL` to point to your backend server.

---

## Project Structure

```
backend/
├── modules/             # Core/shared modules, incl. boq/, documents/, notifications/, announcements/
├── modules-owner/        # Owner-role routes; missing from-quotation + payment endpoints (see Phase 1 open items)
├── modules-supervisor/   # Supervisor-role routes, backend complete
├── modules-technical/    # Karyawan Teknisi-role routes; attendance GPS/photo not wired despite migration existing
├── middleware/
├── config/
├── migrations/           # runs cleanly end-to-end; duplicate number prefixes still need renumbering
├── utils/                # uploadStorage.js document whitelist still too permissive (octet-stream)
└── scripts/

dashboard/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   └── pages/
│       ├── *.astro              # legacy Admin UI — admins.astro role-branches, boq.astro/documents.astro wired
│       ├── owner/                # user management, Projects/Invoices, BOQ, Documents — all verified
│       ├── supervisor/           # wired, needs UX/edge-case pass
│       └── employee-technical/   # wired, needs UX/edge-case pass
```

---

## Notes

This pass moved from "is Phase 2 code present" to "does Phase 2 actually work when you hit it live" — and the honest answer is: partially. Notifications and announcements are solid. GPS/photo attendance is not implemented despite being reported as done — the migration shipped, the model/service/controller work didn't. Two Phase-1-era bugs (Owner blocked from invoice-from-quotation and from payment recording) turned out to be worse than previously documented — not "missing a convenience route" but "the role is completely locked out." On the upside, three previously-open Phase 1 items (technician role validation, status-transition guards, the from-quotation draft guard) are now confirmed fixed and working correctly.

Realistic next milestones, in priority order: (1) give Owner working access to quotation-to-invoice conversion and payment recording — this blocks real usage of the app for its primary role; (2) fix quotation auto-sum, since it's now demonstrated to produce wrong invoice amounts; (3) finish the GPS/photo attendance feature properly (model → service → controller → upload wiring); (4) wire the missing notification triggers; (5) tighten the document upload whitelist and add the global missing-body fallback; (6) then — the one that matters most — a real manual end-to-end pass across all five roles.

---

## Author

Developed by **ByFakhriel**
