# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for **Owner, Admin, Supervisor, and Technical Employee (field technician)**.

> **Status:** 🚧 Under active development. A role-model decision was just made that changes the shape of the whole permission system: **`superadmin` is being removed entirely** (it turned out to be a leftover developer-login role, not a real business role), and **Admin is being redefined as a zero-account-control operational role** — Admin gets full CRUD on business data (clients, projects, quotations, invoices, inventory, etc.) but **cannot create, edit, or delete any user account, cannot touch any role, and cannot change any password — not even its own.** Owner becomes the sole holder of account control. **This decision has not been executed or verified yet** — it's documented here so the next pass can check it was implemented cleanly. Separately, the first real manual click-through QA pass (not API testing) found a hard blocker (`export.ts` fails to compile) plus a batch of role-boundary and UI issues across all four roles.

---

## 🔑 Role model — decision made, not yet executed

**Old model (5 roles, source of ongoing confusion):** `superadmin`, `admin`, `owner`, `supervisor`, `karyawan`.

**New model (4 roles, decided):**
| Role | Scope |
|---|---|
| **Owner** | Full system control. Sole owner of account management — create/edit/deactivate/delete Admin, Supervisor, and Karyawan Teknisi accounts. |
| **Admin** | Full operational control (Clients, Projects, Quotations, Invoices, Inventory, Maintenance, etc.) — **zero account control**. Cannot create accounts, cannot edit any role, cannot change any password (including its own). |
| **Supervisor** | Field supervision — scoped to relevant projects/tasks. |
| **Karyawan Teknisi** | Field worker — scoped to assigned tasks. |

**What "removing `superadmin`" requires** (from the earlier design note, still the checklist to verify once a build lands):
- Migrate any existing `superadmin` accounts to `owner` (or remove them)
- Retire the legacy `/admins` page entirely — it only existed to manage `admin`/`superadmin` accounts, and that whole page's reason to exist goes away once Owner is the only account manager
- Remove every `requireRole(..., 'superadmin')` guard across the backend
- Update `scripts/seedAdmin.js`, which currently creates a `superadmin` account by default — needs to either seed an `owner` or be reconsidered entirely, since Admin can no longer bootstrap itself
- Audit every page/endpoint that currently lets `admin` view or touch a role dropdown or password-reset control — those need to come out of the UI, not just get blocked server-side (a control that 403s when clicked is worse than a control that isn't there)

**Not yet verified:** none of this has been checked against actual code yet — the decision was made, but the next zip upload needs a full pass to confirm it was executed cleanly and didn't leave partial state (e.g. a guard removed from one route but not its Owner-mirrored counterpart, a pattern that has bitten this project before).

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

## 🔴 Manual QA Round 1 — found by Ariel clicking through the app (new, not yet fixed)

This is the first pass that actually used the UI in a browser rather than hitting the API directly — it found problems automated testing structurally can't see.

### Blocker — fix before anything else
**`dashboard/src/lib/export.ts` fails to compile** — Vite error: *"Multiple exports with the same name"* for `exportTableToPDF`, `formatIDR`, and `formatPct`, each declared twice in the same file. **Any page importing this file fails to load entirely.** Delete the duplicate declarations.

### Owner
- **Two overlapping account-management pages** — `/owner/users` (new, correct) and the legacy `/admins` page (only offers `Admin`/`Superadmin`, has editable role dropdowns and a password-reset action on every row). This is the direct mechanism by which accounts have ended up in the wrong role before. **Resolved by the role-model decision above** — legacy `/admins` is being retired, and per the new model there should be no password-reset action exposed to Owner at all (each person manages their own password).
- **Overview dashboard has hardcoded stale text** — card headers say *"5 proyek/invoice terakhir dibuat"* but only 3 rows ever render.
- **No pagination, no time-range filter, no search** on the Recent Projects / Recent Invoices cards — fine today with 3 rows, won't hold up with real data. Requested: pagination, a time filter (24 hours / this week / this month / this year), and a search box on both cards.
- **Item Categories page gets stuck on its loading skeleton** after adding a new category — the 3 summary cards never resolve to real numbers even though the table below updates correctly.

### Admin
- **Currently behaves like a second Owner rather than a scoped operational role** — this is now directly addressed by the role-model decision above (zero account control).
- **No Announcement page** for the plain Admin UI — exists for Owner, missing here.

### Supervisor
- **Maintenance "Assign Teknisi" only allows a single technician** — worth deciding whether real maintenance crews need multi-assignment.
- **Only two actions on a maintenance job: "Simpan Teknisi" and "Tandai Selesai"** — no intermediate status (e.g. "in progress"), it's either not-done or done.
- The modal's own UI copy admits: *"Catatan & upload dokumentasi belum tersedia — backend belum punya endpoint untuk itu di modul maintenance."* — consistent with the earlier finding that Maintenance is relationally isolated from the rest of the data model.

### Karyawan Teknisi
- **Every page routes to 404** — the role is currently completely unusable from the UI. Needs investigation into role-specific routing/redirect logic.
- **Attendance GPS + photo still not implemented** — re-confirmed manually, consistent with the automated finding below. Scope reminder: attendance applies to every role **except Owner**.

**Suggested fix order:** `export.ts` blocker → execute + verify the role-model decision (this unblocks most of the Owner/Admin findings above) → Owner's remaining UI issues (Overview, Item Categories) → Admin's Announcement page → Supervisor's Maintenance status model → Karyawan Teknisi's 404 regression.

---

## Phase 1/2 — Automated Testing Results (prior pass, API-level)

### 🔴 Still open
- **Owner blocked from Quotation→Invoice conversion** — legacy endpoint returns `403` for an Owner token; no Owner-scoped equivalent exists (`404`).
- **Owner has no access to invoice payment recording/deletion at all** — same "lands on legacy routes only" pattern, now confirmed on money-handling functionality.
- **Quotation doesn't auto-sum from linked BOQ items**, with a confirmed downstream effect: an invoice generated from a BOQ-backed quotation carries the wrong, stale manually-entered amount.
- **Document upload whitelist accepts arbitrary files via bare `application/octet-stream`** — needs an extension-based whitelist alongside the MIME check.
- **No global fallback for a missing/malformed request body** — 22 controller files destructure `req.body` directly with no `|| {}` guard, causing a raw `500` instead of a graceful `400`.
- **Duplicate migration number prefixes** (`016`×3, `017`×2, `018`×2) — cosmetic, migration chain still runs clean, still worth renumbering.
- **Task-assignment and purchase-request-review notifications are never sent** — zero calls to the notification service from either `project-assignments.service.js` or `purchase-requests.service.js`, despite a comment claiming this wiring exists.
- **Attendance GPS + photo capture is unfinished** — the migration added the DB columns, but the model doesn't declare them, the service doesn't accept the parameters, and the controller doesn't forward them. Confirmed both via live API testing and now via manual UI testing above.

### ✅ Confirmed working (verified live against a real database)
- Admin/Owner architecture split (before this pass's role-model change): admin-role callers correctly blocked from creating admin/owner accounts or deleting any account
- `isActive` field, BOQ owner-role guard, `purchase_price` nullable fix — the three app-wide-impact bugs from earlier passes, still holding
- BOQ & Document Management full CRUD (create/read/update/delete/download) — verified live
- Reports/ROI formula matches spec exactly
- `technicianId` role validation on assignment creation — now correctly rejects non-`karyawan` targets
- Status-transition guards on Task status update and Purchase Request review — both correctly block invalid/backward transitions
- `createFromQuotation`'s draft-rejection guard — correctly blocks converting a still-`draft` quotation, and blocks double-conversion
- Announcement → Notification delivery, with correct role-targeting and no IDOR on the notification list
- Invoice payment ledger overpayment guard and draft-invoice guard — both correctly enforced with clear messages
- JWT auth (expiry, tampering, `alg:none`), SQL injection safety, stored XSS escaping, user-enumeration protection, rate limiting, error responses that don't leak stack traces outside development mode

---

## Roadmap

### Immediate — role model & UI blocker
- [ ] Fix `export.ts` duplicate exports (blocks pages app-wide)
- [ ] Execute the `superadmin` removal (migrate accounts, retire `/admins`, strip `requireRole('superadmin')` guards, fix `seedAdmin.js`, remove role/password controls from Admin's reachable UI)
- [ ] Verify the above didn't leave partial state — check every route that previously referenced `superadmin`

### Phase 1 — remaining backend gaps
- [ ] Give Owner working access to `from-quotation` invoice conversion and to payment recording/deletion
- [ ] Quotation auto-sum from linked BOQ items (now has a confirmed downstream wrong-invoice-amount bug)
- [ ] Harden `uploadStorage.js` document whitelist (drop bare `application/octet-stream`)
- [ ] Global fallback for missing/malformed request bodies
- [ ] Renumber duplicate migration prefixes

### Phase 2 — feature completion
- [ ] Wire task-assignment and purchase-request-review notifications
- [ ] Finish attendance GPS + photo capture (model → service → controller → upload wiring, not just the migration)
- [ ] Written RBAC reference
- [ ] Automated test suite (checked-in, not ad-hoc)

### UI — from Manual QA Round 1
- [ ] Owner Overview: fix hardcoded "5" text, add pagination + time-range filter + search to Recent Projects/Invoices
- [ ] Owner Item Categories: fix stuck-loading summary cards after create
- [ ] Admin: add Announcement page
- [ ] Supervisor: decide single vs. multi-technician Maintenance assignment; add intermediate status states beyond just done/not-done
- [ ] Karyawan Teknisi: fix all-pages-404 routing regression

### Still the real milestone
- [ ] **Full manual end-to-end testing across all four roles** — this pass covered some of it (Owner, Admin, Supervisor, Karyawan Teknisi surface-level), but a thorough pass is still ahead, especially once the role-model change lands

---

## Tech Status (backend)

Core/shared modules (`backend/src/modules/`): Admin Authentication, Clients, Projects, Quotations, Invoices, Maintenance, Inventory, Reports, BOQ, Documents, Attendance, Daily Reports, Project Assignments, Project Documentation, Purchase Requests, Notifications, Announcements.

Role-scoped route groups: `modules-owner/` → `/api/owner/*`, `modules-supervisor/` → `/api/supervisor/*`, `modules-technical/` → `/api/technical/*`. Note: `modules-owner` is still missing invoice-from-quotation conversion and payment recording (see Phase 1 above).

Also implemented, verified across passes: JWT auth with correct expiry/tampering/`alg:none` rejection, route-level role guards with no cross-role leakage, SQL injection safety, stored XSS escaping, user-enumeration protection, rate limiting, Helmet + CORS, a migration chain that runs cleanly end to end, error responses gated correctly behind `NODE_ENV`.

### Frontend
Legacy Admin UI, Owner, Supervisor, and Karyawan Teknisi pages are all present and were largely API-verified in earlier passes — but this pass's manual click-through found the `export.ts` blocker (breaks any page using it) and the Karyawan Teknisi all-404 regression, both of which likely mean some of the earlier "wired and working" claims need re-checking once those are fixed.

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

> ⚠️ `seed:admin` currently creates a `superadmin`-role account — this is expected to change once the role-model decision above is executed (see Roadmap). Until then, use it as-is; afterward this section needs updating to reflect whatever the new bootstrap process is (likely a `seed:owner`-first flow, since Admin can no longer self-bootstrap under the new zero-account-control model).

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
├── modules-owner/        # Owner-role routes; missing from-quotation + payment endpoints
├── modules-supervisor/   # Supervisor-role routes
├── modules-technical/    # Karyawan Teknisi-role routes; frontend currently 404s on every page
├── middleware/
├── config/
├── migrations/           # runs cleanly end-to-end; duplicate number prefixes still need renumbering
├── utils/                # uploadStorage.js document whitelist still too permissive
└── scripts/              # seedAdmin.js needs revisiting once superadmin is removed

dashboard/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/               # export.ts currently fails to compile — see blocker above
│   └── pages/
│       ├── *.astro         # legacy Admin UI — /admins slated for retirement
│       ├── owner/           # user management, Projects/Invoices, BOQ, Documents; Overview + Item Categories have known UI bugs
│       ├── supervisor/      # wired; Maintenance assignment model needs a decision
│       └── employee-technical/  # currently 404s on every route
```

---

## Notes

Two things are true at once right now: the backend logic has been through a genuinely thorough automated testing pass (live database, live requests, cross-role attacks), and this project has never had a real manual click-through pass until now — and that pass immediately found a compile-breaking bug plus a batch of role-boundary problems that no amount of API testing could have caught, because API tests don't render a page or know what UI a role *shouldn't* see. The role-model simplification (dropping `superadmin`, making Admin genuinely zero-control on accounts) is the right fix for the root confusion behind several of these findings, but it's a decision on paper right now, not verified code — the next priority is executing it cleanly and then re-running both kinds of testing against the result.

---

## Author

Developed by **ByFakhriel**
