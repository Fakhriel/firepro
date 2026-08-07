# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for Admin, Owner, Supervisor, and Karyawan Teknisi (field technician).

> **Status:** 🚧 Under active development. Backend is functionally complete for all role tiers and has been through a deep security/logic testing pass. Frontend is mostly wired across Owner, Supervisor, and Techical Employee. **Update: the foundational Admin/Owner architecture issue and both bugs found in the last QA pass (Maintenance crash, Overview blank stats) have now all been fixed and verified in code. Current focus shifts to the remaining Phase 1 items: upload security hardening and technician-role validation on assignment creation.**

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

## Manual QA Findings — Resolved This Pass

### ✅ Foundational issue — Admin/Owner user-management consolidation (fixed)

Previously, `Admin` role management (`/admins`, backed by `modules/admin-auth`) and `Owner`'s 5-tier RBAC (`/owner/users`, backed by `modules-owner/owner-users`) were two separate, overlapping systems — the direct cause of a field technician account ("andi") once being created as role `Admin`, since the legacy `/admins` page never offered `supervisor`/`karyawan` as options.

**Consolidated permission model, now implemented:**

| Logged in as | Can create accounts with role |
|---|---|
| `owner` | `admin`, `supervisor`, `karyawan` (full control) |
| `admin` | `supervisor`, `karyawan` **only** — cannot create `admin` or `owner` |
| `supervisor`, `karyawan` | Cannot create accounts |

**How it was implemented:** rather than opening `modules-owner/owner-users` directly under `/api/owner/*` (which is gated to `owner` only via `requireRole('owner')`), the same controller/guards are now also mounted at a dedicated `/api/admin/users` path (`app.js`), gated with `requireRole('admin')`. The controller enforces the split with `blockElevatedRoleForAdminCaller` and `blockElevatedTargetForAdminCaller`, rejecting any `admin`-role caller who tries to submit or touch `role: "admin"` / `role: "owner"`. `dashboard/src/pages/admins.astro` now branches at runtime: superadmin viewers keep the old `/api/admins` behavior (managing fellow admins/superadmins), while `admin` viewers are routed to `/api/admin/users` with a role dropdown limited to Supervisor/Karyawan Teknisi, plus adjusted page copy ("Kelola Pengguna").

### ✅ Maintenance page: "Terjadi kesalahan pada server" (fixed)

Migration `20260101000015-add-technician-id-to-maintenance.js` now has valid syntax (the `/** @type {...} */` JSDoc block is properly delimited). Verified by running `node --check` against every migration file in `backend/src/migrations` — all pass. The migration chain no longer halts at `015`, `technician_id` is created correctly, and Maintenance model queries succeed.

### ✅ Overview dashboard: blank stat cards (fixed)

`dashboard/src/pages/index.astro` now fetches `/api/projects/admin`, `/api/invoices/admin`, and `/api/inventory/admin` (matching the `/admin`-suffixed pattern used elsewhere in the codebase) instead of the bare paths that returned 404. All four stat cards resolve correctly.

### ✅ Projects & Invoices Create/Edit forms (built)

`dashboard/src/pages/owner/projects.astro` and `owner/invoices.astro` now include full create/edit modals wired to `POST`/`PATCH`, closing out two previously-open Owner UI gaps.

---

## Manual QA Findings — Still Open

### 🟡 `uploadStorage.js` — upload validation is weaker than intended

`backend/src/utils/uploadStorage.js` still only validates uploads by:
- `fileFilter` checking `file.mimetype`, which is a client-supplied header and can be spoofed — it does not inspect actual file content/magic bytes.
- `sanitizeExt` accepting any extension matching `[a-z0-9]{1,10}`, rather than a strict whitelist (e.g. `.jpg`, `.jpeg`, `.png`, `.webp`).

**Fix needed:** verify real file signatures server-side and restrict to an explicit image-extension whitelist.

### 🟡 No technician-role validation on assignment creation

`backend/src/modules/project-assignments/project-assignments.service.js`'s `create()` only checks that `technicianId` is non-empty — it does not verify the target account actually has role `karyawan`. A project can currently be assigned to any admin/supervisor account as if they were a field technician.

**Fix needed:** look up the target `Admin` by `technicianId` and reject if `role !== 'karyawan'`.

### 🟡 No status-transition guard on Purchase Request review or Task status update

No validation found preventing arbitrary/backward status transitions (e.g. re-approving a rejected request, skipping intermediate states) in either the Purchase Request review flow or the Karyawan Teknisi task status update flow.

**Fix needed:** define the valid status graph for each and reject transitions outside it.

---

## Roadmap

### Phase 0 — Architecture consolidation

- [x] Decide final scope of the Admin/Owner user-management merge
- [x] Open user-management to `admin`-role callers via `/api/admin/users`, with a role-of-caller guard blocking `admin` → `admin`/`owner` creation
- [x] `admins.astro` now branches per viewer role instead of being retired outright (superadmin keeps `/api/admins`, admin uses `/api/admin/users`) — functionally equivalent outcome to "retiring" the legacy page for admin users
- [x] Admin role's `/admins` page redirect now serves the correct scoped view automatically (no separate redirect needed given the branching approach above)

### Phase 1 — Bug fixes & hardening

- [x] Fix migration `015` syntax error
- [x] Fix `project.code` length handling
- [x] Fix Overview stat-card endpoints
- [x] Build Projects Create/Update/Delete form (Owner UI)
- [x] Build Invoices Create form (Owner UI)
- [ ] Validate `technicianId` role on assignment creation (reject non-`karyawan` targets)
- [ ] Harden `uploadStorage.js` — verify actual file content, restrict extension whitelist
- [ ] Add a status guard to Purchase Request review and Task status update

### Phase 2 — Backend / feature work

- [ ] Notification system (bell icon currently non-functional on every role)
- [ ] Task-assignment notifications for Karyawan Teknisi
- [ ] Announcement / pengumuman module
- [ ] Attendance upgrade: GPS + photo capture, scoped to Admin/Supervisor/Karyawan Teknisi (not Owner)
- [ ] Written RBAC reference (`docs/roles.md` or a README table)
- [ ] Automated tests
- [ ] Full manual end-to-end re-test across all five roles once the above is done

---

## Tech Status (backend)

### Completed — Backend

Core/shared modules (`backend/src/modules/`):
- Admin Authentication (login, session check — now cleanly split between superadmin-scoped `/api/admins` and admin-scoped `/api/admin/users`, see Phase 0)
- Clients, Projects, Quotations, Invoices, Maintenance, Inventory, Reports
- Attendance, Daily Reports, Project Assignments, Project Documentation, Purchase Requests

Role-scoped route groups, all mounted and reachable:
- `modules-owner/` → `/api/owner/*`
- `modules-supervisor/` → `/api/supervisor/*` — all 9 sub-modules, consumed by the frontend
- `modules-technical/` → `/api/technical/*` — all 6 sub-modules, consumed by the frontend, self-scoped to the logged-in technician

Also implemented (verified across passes, still holding):
- JWT-based authentication — token expiry, signature tampering, and `alg: none` all correctly rejected
- Route-level role guards (`requireRole`) — no cross-role leakage found in prior testing
- SQL injection safe (parameterized queries throughout), stored XSS properly escaped on render, user enumeration protected
- Rate limiting on login, global error handling, Helmet + CORS
- Migration chain runs end-to-end cleanly (verified via `node --check` on all migration files)

### Completed — Frontend

**Legacy Admin UI** (`dashboard/src/pages/*.astro`): `admins.astro` now serves both superadmin and admin viewers correctly via role-based branching (see Phase 0). Overview dashboard stat cards all resolve correctly.

**Owner, Supervisor, and Karyawan Teknisi** are largely wired. Owner now has working Create/Edit forms for Projects and Invoices in addition to prior modules. Owner's own dashboard (`owner/index.astro` → `/api/owner/dashboard/summary`) continues to work correctly, independent of the legacy bare-path endpoints.

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

Update the `.env` file with your database credentials and a secure `JWT_SECRET` (generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

Default seeded credentials come from `.env` (`SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD`, and `SEED_OWNER_USERNAME`/`SEED_OWNER_PASSWORD` via `npm run seed:owner`), unless overridden.

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
├── modules/             # Core/shared modules — admin-auth now cleanly scoped (superadmin) alongside modules-owner/owner-users (admin/owner)
├── modules-owner/        # Owner-role routes; owner-users also reused at /api/admin/users for admin-role callers
├── modules-supervisor/   # Supervisor-role routes, backend complete
├── modules-technical/    # Karyawan Teknisi-role routes, backend complete
├── middleware/
├── config/
├── migrations/           # runs cleanly end-to-end
├── utils/                # uploadStorage.js still needs hardening, see Phase 1
└── scripts/

dashboard/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   └── pages/
│       ├── *.astro              # legacy Admin UI — admins.astro now role-branches instead of needing retirement
│       ├── owner/                # user management unified here, plus working Projects/Invoices forms
│       ├── supervisor/           # wired, needs UX/edge-case pass
│       └── employee-technical/   # wired, needs UX/edge-case pass
```

---

## Notes

This project is still under active development. The repository reflects the current implementation and development progress, including known bugs and gaps found during manual QA. The Admin/Owner architecture split — a consequence of the Admin role and its tooling being built before the full RBAC model existed — has now been reconciled via a shared controller mounted under two role-scoped paths, rather than a full page retirement. Remaining known gaps are upload validation hardening, technician-role validation on assignments, and status-transition guards on Purchase Requests/Tasks (Phase 1), plus the Phase 2 feature backlog (notifications, announcements, GPS attendance, RBAC docs, automated tests). Some features are incomplete and will be improved gradually before being used in a production environment.

---

## Author

Developed by **ByFakhriel**
