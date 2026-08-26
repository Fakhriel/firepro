# FIREPRO

An internal dashboard for managing fire protection service operations.

This project manages clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for **Owner, Admin, Supervisor, and Technical Employee (Field technician)**.

> **Status:** Role model executed and live-tested. The `export.ts` blocker, the full Manual QA Round 1 list, and Phase 1 backend gaps are all fixed and verified end-to-end against a real database — not just read from source. Two more bugs surfaced only during that live testing (an `invoices.project_id` NOT NULL mismatch, and a security-verification middleware that was defined but never wired in) and are fixed too. Remaining open items are scoped below under Roadmap.

---

## 🔑 Role model — executed & verified

**Old model (5 roles):** `superadmin`, `admin`, `owner`, `supervisor`, `karyawan`.

**Current model (4 roles):**
| Role | Scope |
|---|---|
| **Owner** | Full system control. Sole owner of account management — create/edit/deactivate/delete Admin, Supervisor, and Karyawan Teknisi accounts. |
| **Admin** | Full operational control (Clients, Projects, Quotations, Invoices, Inventory, Maintenance, etc.) — **zero account control**. Cannot create accounts, cannot edit any role, cannot change any password (including its own). |
| **Supervisor** | Field supervision — scoped to relevant projects/tasks. |
| **Karyawan Teknisi** | Field worker — scoped to assigned tasks. |

What was done:
- Migrated existing `superadmin` accounts to `owner` via migration, then dropped `superadmin` from the DB enum and the `Admin` model.
- Retired the legacy `/admins` page and its backend routes entirely (`/api/admins` now correctly 404s).
- Removed every `requireRole(..., 'superadmin')` guard and the `requireSuperadmin` middleware across the backend.
- Fixed `/api/admin/users` (Owner's account-management endpoint), which was wrongly gated to `requireRole('admin')` instead of `requireRole('owner')` — Admin could previously reach it.
- Replaced `scripts/seedAdmin.js` with `scripts/seedOwner.js` (`npm run seed:owner` is now the only seed script).
- Removed the "Ganti Password" tab from Admin's Settings UI and all role/password controls from Admin's reachable pages, not just blocked server-side.

**Live-tested (real DB, real HTTP calls):**
- Owner login → correct role in JWT.
- Owner creates Admin/Supervisor/Karyawan accounts → succeeds.
- Admin attempts to create another account → **403**.
- Admin attempts to change its own password → **403**.
- `GET /api/admins` → **404** (route no longer exists).

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

## ✅ Manual QA Round 1 — all fixed

### Blocker
**`dashboard/src/lib/export.ts` compile failure** — fixed. The file had every export (`ExportOptions`, `exportTableToPDF`, `formatIDR`, `formatPct`) duplicated in full; the duplicate block was removed, leaving one clean definition per export.

### Owner
- Legacy `/admins` retired; `/owner/users` is now the only account-management page, with no password-reset control exposed (each person manages their own password, and Admin can't touch passwords at all under the new model).
- Overview dashboard: removed the hardcoded "5 terakhir" text; the Recent Projects card now has a live search box, a time-range filter (24h / this week / this month / this year), and client-side pagination.
- Item Categories page: the old page was a static mockup — the 3 summary cards never resolved because there was no real API call behind them, and the "Tambah Kategori" modal didn't call any endpoint either. Root cause: `category` on Inventory is a **fixed 8-value backend ENUM**, not a freely-editable entity. Rewrote the page as a real read-only view computed live from `/api/inventory/admin`, showing per-category item counts and usage status. Removed the fake add/edit-category modal since it never matched what the backend can actually do.

### Admin
- Added a working Announcement page (`/announcements`), mirroring Owner's — Admin can compose and send announcements to Supervisor/Karyawan Teknisi and see send history, matching the backend guard which already allowed `admin` + `owner`.

### Supervisor
- Added an intermediate `in_progress` maintenance status (new DB enum value + migration + `PATCH /api/supervisor/maintenance/:id/start` endpoint + a "Mulai Kerjakan" button in the UI), so a job is no longer just done/not-done.
- **Found and fixed a hidden bug while doing this**: technician assignment always failed silently, because the frontend sent `{ technician: <name string> }` while the backend expected `{ technicianId: <numeric id> }`. Now consistent — verified live: assigning a technician by ID returns the full technician object.
- Multi-technician assignment was left as single-technician; the README originally flagged this as "worth deciding," not a defect, and no decision to change it was made.

### Karyawan Teknisi
- **Fixed the all-pages-404 bug.** Root cause: `EmployeeSidebar.astro`'s nav pointed to slugs that were never built (`jadwal`, `checklist`, `upload-foto`, `riwayat-pekerjaan`, `profil`), while the real page files were `my-tasks`, `attendance`, `daily-report`, `inventory-request`, `profile`. Rewired the nav to the real routes — every page now returns 200 and `activeNav` highlighting is consistent.
- Attendance GPS + photo capture is still unfinished — see Roadmap.

---

## ✅ Phase 1 — backend gaps, all fixed and live-tested

- **Owner blocked from Quotation→Invoice conversion / payment recording** — the backend endpoints (`owner-invoices.routes.js`) already existed and were correctly mounted; what was actually missing was the frontend UI. Rewrote `owner/invoices.astro`: fixed a serious status-enum mismatch (the page used fictional statuses like `pending`/`failed`/`expired` that don't exist in the backend, instead of the real `draft/issued/unpaid/partially_paid/paid/overdue/cancelled`), and added full payment recording + history UI. Added a "Buat Invoice" button on `owner/quotations.astro` for `accepted` quotations.
  - **Bug found only via live testing**: `invoices.project_id` was `NOT NULL` in the database while every part of the app (manual invoice form, quotation conversion) treats project as optional — this caused a 500 on any invoice without a linked project. Fixed with migration `20260101000030` (column now nullable). Verified live: conversion and manual creation without a project both succeed now.
- **Quotation auto-sum from linked BOQ items** — was already correctly wired (`syncAmountFromBoq` fires on BOQ item create/update/delete). Live-verified end-to-end: adding two BOQ items updates the quotation's amount immediately, and converting that quotation to an invoice carries the correct summed amount through, not the stale manually-entered figure.
- **Document upload whitelist hardened** — the old filter let *any* file claiming `application/octet-stream` through as long as the extension matched, which is trivially spoofable. Now `octet-stream` is only tolerated for extensions that get verified against real file-content magic bytes after upload (`.pdf`, `.docx/.xlsx/.pptx/.zip`, and now also legacy `.doc/.xls/.ppt` via an added OLE-header signature).
  - **Bug found only via live testing**: the `verifyUploadedDocument` magic-byte-check middleware existed in `uploadStorage.js` but was **never actually wired into `documents.routes.js`** — the whole content-verification layer was inert. Fixed by adding it to the upload route. Verified live: a plain-text file renamed to `.pdf`/`.doc`, and an EXE renamed to `.pdf`, are now rejected (400); real files of the same extensions still upload fine (201).
- **Global fallback for missing/malformed request bodies** — a guard already existed but only checked `undefined`, not a literal JSON `null` body, which would still crash a destructure. Tightened to catch both.
- **Duplicate migration number prefixes** (`016`×3, `017`×2, `018`×2) — renumbered into sequential unique prefixes (`016`–`024`), carefully preserving the exact original execution order (a first attempt at this broke a real cross-migration dependency — `inventory-stock-management` adding a column that `fix-purchase-price-nullable` needs — and was caught and corrected by actually running the full migration chain against a fresh database rather than assuming reordering was safe).

---

## Testing performed

This pass went beyond static code reading: a real MySQL instance was provisioned, the full migration chain was run against an empty database, an Owner account was seeded, and the backend was exercised with live HTTP requests for every fix above — role boundaries, quotation→invoice conversion, payment recording/removal, maintenance assignment and status transitions, and file-upload rejection/acceptance — with results checked directly against the database where relevant, not just against API response codes.

**Still to do:** a full manual click-through across all four roles in the actual browser UI (this pass tested through direct API calls plus code-level frontend fixes, not a live browser session), and building this into a checked-in automated test suite (see Roadmap).

---

## Roadmap — remaining open items

### Phase 2 — feature completion (not yet started)
- [ ] Wire task-assignment and purchase-request-review notifications (`project-assignments.service.js` / `purchase-requests.service.js` currently make zero calls to the notification service despite a comment claiming otherwise)
- [ ] Finish attendance GPS + photo capture — the migration added the DB columns, but the model doesn't declare them and the service/controller don't forward them
- [ ] Written RBAC reference document
- [ ] Automated test suite (checked in to the repo, not ad-hoc scripts)

### Still the real milestone
- [ ] Full manual end-to-end click-through testing across all four roles, in-browser

---

## Tech Status (backend)

Core/shared modules (`backend/src/modules/`): Admin Authentication, Clients, Projects, Quotations, Invoices, Maintenance, Inventory, Reports, BOQ, Documents, Attendance, Daily Reports, Project Assignments, Project Documentation, Purchase Requests, Notifications, Announcements.

Role-scoped route groups: `modules-owner/` → `/api/owner/*`, `modules-supervisor/` → `/api/supervisor/*`, `modules-technical/` → `/api/technical/*`.

Verified across passes: JWT auth with correct expiry/tampering/`alg:none` rejection, route-level role guards with no cross-role leakage, SQL injection safety, stored XSS escaping, user-enumeration protection, rate limiting, Helmet + CORS, a migration chain that now runs cleanly end to end from an empty database (30 migrations, verified live), error responses gated correctly behind `NODE_ENV`.

### Frontend
Legacy Admin UI, Owner, Supervisor, and Karyawan Teknisi pages are all present and wired. The `export.ts` blocker and the Karyawan Teknisi all-404 regression are both fixed and verified.

---

## Running Locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run seed:owner
npm run dev
```

Update `.env` with your database credentials and a secure `JWT_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

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
├── modules-owner/        # Owner-role routes — invoices, payments, and BOQ (via core /api/boq) all working
├── modules-supervisor/   # Supervisor-role routes — maintenance now has in_progress status
├── modules-technical/    # Karyawan Teknisi-role routes
├── middleware/
├── config/
├── migrations/           # runs cleanly end-to-end from empty DB, 30 migrations, no duplicate prefixes
├── utils/                # uploadStorage.js — whitelist hardened, verifyUploadedDocument now wired in
└── scripts/              # seedOwner.js is the only seed script

dashboard/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/               # export.ts fixed
│   └── pages/
│       ├── announcements.astro  # new — Admin's announcement page
│       ├── item-categories.astro  # rewritten — real data, no fake CRUD
│       ├── owner/           # user management, Projects, Invoices (rewritten), Quotations (convert button added), BOQ, Documents
│       ├── supervisor/      # maintenance now supports in_progress + fixed technician-assign bug
│       └── employee-technical/  # all routes fixed, no more 404s
```

---

## Author

Developed by **ByFakhriel**
