# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for Admin, Owner, Supervisor, and Technial Employee (field technician).

> **Status:** 🚧 Under active development, mid-QA pass. Backend is functionally complete for all role tiers. Frontend wiring has progressed significantly since the last QA pass — Owner, Supervisor, and Karyawan Teknisi are now mostly wired (see **Manual QA Findings** below for exact per-page status). **Current focus: close the remaining CRUD gaps (Owner `projects`/`reports`/`invoices`), fix the two reported auth-loop bugs, then wire the notification system.**

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

## Manual QA Findings (latest pass)

Real, page-by-page status verified against the current codebase. This supersedes any older completion claims below.

### 🔴 Critical bugs

- **Admin login loop** — reported: logging in as `admin`/`superadmin` redirects back to the login form instead of landing on the dashboard. Reviewed `login.astro` (`doLogin`) and `DashboardLayout.astro` (`guardAuth`) line by line — the logic itself is correct (redirect-by-role, session check via `/api/admin-auth/me`, no premature session clear on network errors). **Root cause not found via static review; needs a runtime repro** (Network tab open + Preserve log, check actual status codes of `POST /api/admin-auth/login` and `GET /api/admin-auth/me`).
- **Owner logout loop** — reported: logging out from the Owner dashboard redirects back into the dashboard instead of the login page. Reviewed the logout handler in `OwnerSidebar.astro` (`clearAdminAuth()` → `window.location.replace("/login")`) — logic looks correct and session clearing is synchronous. **Root cause not found via static review; needs a runtime repro** the same way as the login loop above.
- **Notification bell icon does nothing, on every role.** Confirmed: `Topbar.astro`, `OwnerTopbar.astro`, `SupervisorTopbar.astro`, `EmployeeTopbar.astro` all render the bell icon with zero click handlers. Not wired to any backend or UI state.
- **New finding — CORS fallback default mismatch.** `backend/src/config/env.js` falls back to `CORS_ORIGIN=http://localhost:4321` when the env var isn't set, but the dashboard's dev server runs on port **4322** (`dashboard/package.json` → `astro dev --port 4322`). `.env.example` itself already has the correct value (`4322`), so this only bites if `.env` is missing or that line gets deleted — but it's a footgun worth fixing at the source (change the fallback default, not just the example file).

### 🟢 Owner role — mostly wired now

| Page | Status |
|---|---|
| `users` | ✅ Wired |
| `clients` | ✅ Wired (full CRUD — confirmed POST/PATCH/DELETE) |
| `inventory` | ✅ Wired (full CRUD — confirmed POST/PATCH/DELETE) |
| `settings` | ✅ Wired (PATCH confirmed) |
| `maintenance` | ✅ Wired (CRUD works), but UI is not fully responsive on smaller screens |
| `quotations` | ✅ Wired (full CRUD — confirmed POST/PATCH/DELETE; previously reported as export-only, that's no longer accurate) |
| `attendance` | ✅ Wired (read-only recap — this is expected, not a gap) |
| `index` (dashboard) | ✅ Wired (read-only summary — expected, not a gap) |
| `invoices` | ⚠️ Wired — Read, Delete, and a partial Update (mark-as-paid / status only) all confirmed working. **No Create form found in the UI** — needs confirming whether invoices are meant to be created manually here or generated from another flow (e.g. from an approved quotation/project). |
| `projects` | ⚠️ Wired, but still export-only (PDF) — no Create/Update/Delete in the UI |
| `reports` | ⚠️ Wired, but still export-only — no data view/CRUD |

**Open question from QA that needs a product decision, not just code:** for `projects`, `reports`, and `invoices` (create specifically) — is export/view-only actually intended, or should these get full CRUD? And is there supposed to be any cross-page linkage (e.g. does an invoice get generated automatically from an approved quotation/project, or is everything entered manually per page)? This needs to be settled before continuing, so we don't build the wrong interaction model.

### 🟢 Supervisor role — now fully wired

All 6 pages (`index`, `projects`, `assignments`/`technicians`, `documentation`, `inventory`, `maintenance`, `attendance`, `daily-report`) are wired to `/api/supervisor/*`, including confirmed write actions (assign technician, update progress, approve/reject requests, check-in/out, submit daily report). Previously reported as fully static — that's no longer accurate. Needs a UI/UX pass and edge-case testing, but the wiring itself is done.

### 🟢 Karyawan Teknisi role — now fully wired

All 6 pages are wired to `/api/technical/*`, including confirmed write actions (task status update, task photo upload, check-in/out, daily report submit, inventory request submit, profile + password update). Previously reported as fully static — that's no longer accurate.

- `my-tasks` still doesn't have any notification/alert when a Supervisor or Owner assigns new work — this is a real gap (see Phase 2 below), separate from the wiring itself.
- `attendance` — see **Attendance / Absensi** section below for the open design questions (GPS + photo capture still not implemented).

### Cross-cutting / product questions raised during QA

- **Role authorization is unclear to the tester.** Needs a short internal doc (or section in this README) laying out exactly what each role (`admin`, `superadmin`, `owner`, `supervisor`, `karyawan`) can see and do, so QA and stakeholders aren't guessing.
- **Announcement / pengumuman feature** requested — broadcast-style messages visible to multiple roles (e.g. Owner → all staff, Supervisor → their team).
- **Attendance (absensi) system** — currently check-in/check-out only. Requested improvements: GPS location tracking per check-in/check-out, and a photo captured at check-in/check-out. Also needs confirming: attendance should apply to **all roles except Owner** (Admin/Supervisor/Technical Employee check in/out; Owner does not).
- **Database schema — considered, not recommended for now.** The idea of splitting the single `admins` table into separate tables per role was raised. After reviewing the schema, this isn't recommended: 5 other tables (`Attendance`, `ProjectDocumentation`, `ProjectAssignment`, `PurchaseRequest`, `DailyReport`) all hold a foreign key into `admins`, and the single-table-plus-`role`-enum design is what makes the unified login (one form, one endpoint, all 5 roles) possible in the first place. Splitting would mean either querying multiple tables on login or giving up the unified login, plus turning every role change into a data migration instead of a field update. If role-specific fields start piling up later (e.g. technician certification, vehicle plate), the recommended pattern is a **1:1 profile table** (e.g. `technician_profiles.adminId → admins.id`), not splitting the identity table itself.

---

## Roadmap

### Phase 1 — Close remaining gaps (in priority order)

- [ ] **Admin login loop** — reproduce with Network tab (Preserve log on) to confirm actual status codes of `/login` and `/me`, then fix. Static review found no cause — likely needs runtime debugging (check for double `DOMContentLoaded` firing, stale token in another tab, or a backend-side issue not visible from the frontend code).
- [ ] **Owner logout loop** — same approach: reproduce with Network tab, confirm whether `/login` is even reached or something redirects away from it after landing.
- [ ] **Fix CORS fallback default** in `backend/src/config/env.js` (`4321` → `4322`) so a missing `.env` fails safely instead of silently blocking all requests.
- [ ] **Owner** — decide (product decision, not code) whether `projects`, `reports`, and invoice-`Create` should get full CRUD or stay export/view-only; implement accordingly
- [ ] **Owner `maintenance`** — responsive/mobile layout pass
- [ ] Frontend polish pass on Supervisor & Karyawan Teknisi pages (now functionally wired, but not yet UX/edge-case tested)

### Phase 2 — Backend / feature work

- [ ] Notification system (bell icon currently non-functional on every role) — decide on push vs polling, then wire icon + a notification center
- [ ] Task-assignment notifications for Karyawan Teknisi (`my-tasks`) when a Supervisor/Owner assigns work
- [ ] Announcement / pengumuman module (broadcast messages scoped by role/team)
- [ ] Attendance upgrade: GPS location capture + photo capture on check-in/check-out, scoped to Admin/Supervisor/Karyawan Teknisi (not Owner)
- [ ] Written RBAC reference (what each role can see/do) — likely a `docs/roles.md` or a table in this README
- [ ] Automated tests
- [ ] Full manual end-to-end re-test across all five roles once the above is done

---

## Tech Status (backend)

### Completed — Backend

The backend follows a modular architecture where each feature has its own routes, controller, service, and model.

Core/shared modules (`backend/src/modules/`):
- Admin Authentication (login, session check, superadmin-guarded admin management)
- Clients, Projects, Quotations, Invoices, Maintenance, Inventory, Reports
- Attendance, Daily Reports, Project Assignments, Project Documentation, Purchase Requests

Role-scoped route groups, all mounted and reachable:
- `modules-owner/` → `/api/owner/*` — dashboard, users, clients, projects, quotations, invoices, maintenance, inventory (incl. purchase-request approve/reject), reports, attendance recap
- `modules-supervisor/` → `/api/supervisor/*` — all 9 sub-modules built and now consumed by the frontend (dashboard, projects, assignments, technicians, documentation, inventory, maintenance, attendance, daily reports)
- `modules-technical/` → `/api/technical/*` — all 6 sub-modules built and now consumed by the frontend (my tasks, daily report, attendance, inventory request, profile, dashboard), self-scoped to the logged-in technician

Also implemented:
- Sequelize ORM, password hashing with bcrypt
- JWT-based authentication, fully wired login (`POST /api/admin-auth/login`) and session check (`GET /api/admin-auth/me`) — backend logic reviewed again this pass, no bug found; the reported login/logout loops appear to be frontend/runtime issues, still unconfirmed (see Critical Bugs above)
- Single-table identity model (`admins`, with a `role` enum: `admin`, `superadmin`, `owner`, `supervisor`, `karyawan`) — reviewed this pass against a request to split it per role; **kept as-is**, see the schema note under Cross-cutting Questions above
- Extended role model, each with the correct route-level guard (`requireRole`) — verified every frontend call against its backend route this pass, no cross-role leakage found
- Helmet, restricted CORS (see CORS fallback bug above), global + login-specific rate limiting, global error handling
- Working `sequelize-cli` setup (`.sequelizerc` + `config/config.js`) and a complete migration chain
- File upload utility (`utils/uploadStorage.js`) with extension/mimetype whitelisting, used for task documentation photos
- Input validation in several modules (e.g. Clients, Invoices, Admin Auth — including email format validation, `phone`/`email` fields on admin accounts)

### Completed — Frontend

**Legacy Admin UI** (`dashboard/src/pages/*.astro` — clients, invoices, projects, quotations, maintenance, inventory, reports, `admins.astro`): wired to the backend API. Login flow for this role is currently the one blocked by the login-loop bug above.

Role-based login redirect and client-side layout guards (`OwnerLayout`, `SupervisorLayout`, `EmployeeLayout`) are in place for all roles.

**Owner, Supervisor, and Karyawan Teknisi are now largely wired** — see **Manual QA Findings** above for the exact per-page status; it supersedes older "static prototype" claims for these roles.

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

Update the `.env` file with your database credentials and a secure `JWT_SECRET` (generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Also double-check `CORS_ORIGIN` matches the dashboard's dev port (`4322` by default — see the CORS bug noted above if requests are silently failing).

Default seeded credentials (from `.env` → `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`), unless overridden.

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
├── modules/             # Core/shared modules (reused across roles), fully wired
├── modules-owner/        # Owner-role routes, backend complete
├── modules-supervisor/   # Supervisor-role routes, backend complete
├── modules-technical/    # Karyawan Teknisi-role routes, backend complete
├── middleware/
├── config/
├── migrations/
├── utils/
└── scripts/

dashboard/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   └── pages/
│       ├── *.astro              # legacy Admin UI — wired, login currently buggy
│       ├── owner/                # mostly wired, see QA table above for exact gaps
│       ├── supervisor/           # wired, needs UX/edge-case pass
│       └── employee-technical/   # wired, needs UX/edge-case pass
```

---

## Notes

This project is still under active development. The repository reflects the current implementation and development progress, including known bugs and gaps found during manual QA. Some features are incomplete and will be improved gradually before being used in a production environment.

---

## Author

Developed by **ByFakhriel**
