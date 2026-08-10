# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for Admin, Owner, Supervisor, and Karyawan Teknisi (field technician).

> **Status:** 🚧 Under active development. Backend is functionally complete for all role tiers. Phase 1 (core bug fixes) and Phase 1.5 (BOQ + Document Management frontend) have both been through automated testing and are in good shape. **Phase 2 (notifications, announcements, GPS attendance, etc.) has been implemented but has not been tested at all yet — neither automated nor manual.**

---

> ## ⚠️ Testing methodology — read this before trusting any ✅ below
>
> Everything marked ✅ in this document was verified by **Claude AI running automated tests** — booting the real backend against a real MySQL database and firing live HTTP requests at every endpoint (create/read/update/delete, cross-role access attempts, malformed input, etc.). This is thorough at the **API level**, but it is **not** the same as manual testing:
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

## Phase 1 — Automated Testing Results

### ✅ Admin/Owner architecture consolidation — independently verified this pass

Previously reported fixed by the team but not yet re-checked by Claude. This pass verified it directly: created a genuine `admin`-role account (not the legacy `superadmin` seed account, which is a different role and was initially a false alarm in testing), then confirmed all four expected behaviors live —

| Action as `admin` role | Result |
|---|---|
| Create a `supervisor` account | ✅ `201` allowed |
| Create an `admin` account | ✅ `403` blocked — *"Admin hanya boleh membuat/mengubah akun dengan role Supervisor atau Karyawan."* |
| Create an `owner` account | ✅ `403` blocked, same message |
| Delete any account | ✅ `403` blocked — *"Admin tidak diizinkan menghapus akun user. Hubungi Owner."* |

The implementation reuses the same `owner-users` controller mounted at two paths (`/api/owner/users` for `owner`, `/api/admin/users` for `admin`), with the role split enforced at the app-level mount guard plus fine-grained per-action checks (`blockElevatedRoleForAdminCaller`, `blockAdminCallerFromDelete`, etc.) inside the controller. Clean design, works as intended.

### ✅ Three app-wide-impact bugs (found + fixed a couple passes ago, still holding)
- `isActive` missing from `admin.model.js` — was breaking every authenticated request app-wide
- BOQ role guard excluding `owner`
- `purchase_price` left `NOT NULL` after a column rename, breaking all inventory creation

### ✅ BOQ & Document Management — full CRUD verified live this pass

Not just create/list (verified previously) — this pass covered the remaining surface:

| Check | Result |
|---|---|
| BOQ Update (`PATCH /api/boq/:id`) | ✅ `200`, `total` correctly recalculated |
| BOQ Delete + confirm gone (`GET` after delete) | ✅ `200` then `404` |
| Documents Download (`GET /api/documents/:id/download`) | ✅ `200`, byte-for-byte correct file content returned |
| Documents Delete | ✅ `200` |
| Legacy Admin pages (`pages/boq.astro`, `pages/documents.astro`) | ✅ Already fully wired — earlier assumption that these might be unbuilt was wrong |

### ✅ Reports/ROI formula

`(Contract Value − Cost) / Cost × 100` — matches the spec exactly, verified by reading `reports.service.js`.

---

## Phase 1 — Still Open

- **`uploadStorage.js` upload validation is weak** — trusts client-supplied `mimetype`, extension whitelist too loose. Now more relevant since Documents is live and handles non-image files — needs a **separate** document-appropriate whitelist (PDF/DOCX/XLSX/etc.), not the same narrow image-only rule used for task/inventory photos.
- **No technician-role validation on assignment creation** — `project-assignments.service.js` doesn't check the target account actually has role `karyawan`.
- **No status-transition guard** on Purchase Request review or Task status update (e.g. re-approving an already-rejected request).
- **Duplicate migration numbers** (`016`×3, `017`×2, `018`×2) — cosmetic, doesn't break execution, still a future collision risk.
- **Quotation doesn't auto-sum from linked BOQ items** — BOQ items can reference a `quotationId`, but `quotations.service.js` never reads them back; the quotation's `amount` is still entered manually even when its BOQ is fully itemized. Not a crash, a completeness gap vs. the intended `BOQ → Quotation` flow.
- **`createFromQuotation` (Invoice from an Accepted Quotation) isn't mirrored to the Owner routes** — the feature exists and is wired at `POST /api/invoices/from-quotation/:quotationId`, but only under the legacy `/api/invoices` routes (admin/superadmin). `owner-invoices.routes.js` has no equivalent, so the Owner role can't use this convenience feature at all, despite the spec requiring full Owner CRUD access everywhere. Same recurring pattern as the BOQ/Documents owner-exclusion bugs — a new endpoint lands on the legacy routes and doesn't get mirrored to the Owner wrapper.
- **`createFromQuotation`'s status guard is unverified** — reads correctly in the code (should reject converting a still-`draft` quotation), but the live test got cut short by an environment issue before confirming. Needs a re-check.

---

## Phase 2 — Implemented, NOT Tested

Ariel has reported Phase 2 work as complete (notifications, announcements, GPS/photo attendance, etc.), but **none of it has been tested yet — not by Claude, not manually.** No code from this phase has been reviewed in this pass, so there's no findings list yet, just a flag that it exists and is untested. Once a build is shared, the same automated-testing pass (live boot, live requests, cross-role checks) should happen before it's trusted, followed by manual testing same as everything else.

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
- [ ] Validate `technicianId` role on assignment creation
- [ ] Harden `uploadStorage.js`
- [ ] Add a status guard to Purchase Request review and Task status update
- [ ] Renumber duplicate migration prefixes
- [ ] Mirror `from-quotation` invoice-conversion endpoint to `owner-invoices.routes.js`
- [ ] Quotation auto-sum from linked BOQ items (or explicitly decide this stays manual)
- [ ] Confirm `createFromQuotation` rejects non-`accepted` quotations live

### Phase 2 — Backend / feature work (implemented, untested)
- [ ] Notification system
- [ ] Task-assignment notifications for Karyawan Teknisi
- [ ] Announcement / pengumuman module
- [ ] Attendance upgrade: GPS + photo capture
- [ ] Written RBAC reference
- [ ] Automated tests
- [ ] **Manual end-to-end testing across all five roles — not started, this is the next real milestone**

---

## Tech Status (backend)

Core/shared modules (`backend/src/modules/`): Admin Authentication (split superadmin `/api/admins` + admin `/api/admin/users`, verified live), Clients, Projects, Quotations, Invoices, Maintenance, Inventory, Reports, BOQ, Documents, Attendance, Daily Reports, Project Assignments, Project Documentation, Purchase Requests.

Role-scoped route groups, all mounted and reachable: `modules-owner/` → `/api/owner/*`, `modules-supervisor/` → `/api/supervisor/*`, `modules-technical/` → `/api/technical/*`.

Also implemented (verified across passes, still holding): JWT auth with correct expiry/tampering/`alg:none` rejection, route-level role guards with no cross-role leakage found, SQL injection safety, stored XSS escaping, user-enumeration protection, IP + per-account rate limiting on login, Helmet + CORS, a full migration chain that runs cleanly end to end.

### Completed — Frontend

**Legacy Admin UI**: role-branching `admins.astro`, `boq.astro`, `documents.astro` all confirmed wired.

**Owner**: user management, Projects/Invoices, BOQ, Documents — all create/read/update/delete verified live.

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
├── modules/             # Core/shared modules, incl. boq/ and documents/ (backend + frontend both complete)
├── modules-owner/        # Owner-role routes; owner-users also reused at /api/admin/users
├── modules-supervisor/   # Supervisor-role routes, backend complete
├── modules-technical/    # Karyawan Teknisi-role routes, backend complete
├── middleware/
├── config/
├── migrations/           # runs cleanly end-to-end; duplicate number prefixes still need renumbering
├── utils/                # uploadStorage.js still needs hardening
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

This project is still under active development. Phase 1 and Phase 1.5 have been through a genuinely thorough automated testing pass — live database, live HTTP requests, cross-role attack attempts, not just reading the source. That's a meaningful bar cleared, but **it is not a substitute for manual testing**, which hasn't happened yet for any phase. Phase 2 is reported complete but entirely unverified. The realistic next milestones are: close out the remaining Phase 1 items (mostly small, well-scoped fixes at this point), run an automated pass over Phase 2 once it's available for review, and then — the one that actually matters most — a real manual end-to-end pass across all five roles.

---

## Author

Developed by **ByFakhriel**
