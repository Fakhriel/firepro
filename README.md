# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for Admin, Owner, Supervisor, and Karyawan Teknisi (field technician).

> **Status:** 🚧 Under active development, mid-QA pass. Backend is functionally complete for all role tiers. Frontend is a mix of fully-wired pages and static prototypes — see **Manual QA Findings** below for the exact per-page status after the first end-to-end pass. **Current focus: finish frontend wiring role-by-role (Owner → Supervisor → Karyawan Teknisi), then circle back to backend/feature work.**

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

## Manual QA Findings (latest end-to-end pass)

This is the real, page-by-page status found during manual testing — more accurate right now than the "Completed" claims further down, which describe backend readiness, not frontend behavior.

### 🔴 Critical bugs

- **Admin login loop** — logging in as `admin`/`superadmin` redirects back to the login form instead of landing on the dashboard. Root cause not fully confirmed yet (previous fixes addressed duplicate-submit and stale-session bounce issues, but the loop is still reported in testing — needs a fresh repro with Network tab open + Preserve log, checking the actual status codes of `POST /api/admin-auth/login` and `GET /api/admin-auth/me`).
- **Owner logout loop** — logging out from the Owner dashboard redirects back into the dashboard instead of the login page. Logout is not actually clearing the session before/consistently with the redirect.
- **Notification bell icon does nothing, on every role.** Not wired to any backend or UI state.

### 🟡 Owner role

| Page | Status |
|---|---|
| `users` | ✅ Wired |
| `invoices` | ⚠️ Wired, but only Create + Read work — no Update/Delete |
| `maintenance` | ✅ Wired (CRUD works), but UI is not fully responsive on smaller screens |
| `quotations` | ⚠️ Wired, but no CRUD — only PDF export |
| `projects` | ⚠️ Wired, but no CRUD — only PDF export |
| `reports` | ⚠️ Wired, but export-only, no data view/CRUD |
| `clients` | 🔴 Static prototype, not wired |
| `inventory` | 🔴 Static prototype, not wired |
| `settings` | 🔴 Static prototype, not wired |
| `attendance` | 🔴 Static prototype, not wired |
| `index` (dashboard) | 🔴 Static prototype, not wired |

**Open question from QA that needs a product decision, not just code:** for pages that are currently "export-only" (`projects`, `invoices`, `quotations`, `reports`) — is export-only actually intended for some of these, or should all of them get full CRUD? And is there supposed to be any cross-page linkage (e.g. does creating a report pull in existing project/invoice data automatically, or is everything entered manually per page)? This needs to be settled before wiring continues, so we don't build the wrong interaction model.

### 🟡 Supervisor role

All 6 pages (`index`, `projects`, `assignments`/`technicians`, `documentation`, `inventory`, `maintenance`, `attendance`, `daily-report` — per the module list) are **static prototypes**, not wired. Backend (`/api/supervisor/*`) is ready and untouched by frontend.

### 🟡 Karyawan Teknisi role

All 6 pages are **static prototypes**, not wired. Backend (`/api/technical/*`) is ready and untouched by frontend.

- `my-tasks` should eventually show task assignments/notifications coming from Supervisor or Owner (e.g. "you've been assigned to Project X") — this doesn't exist yet, neither backend event nor frontend page.
- `attendance` — see **Attendance / Absensi** section below for the open design questions.

### Cross-cutting / product questions raised during QA

- **Role authorization is unclear to the tester.** Needs a short internal doc (or section in this README) laying out exactly what each role (`admin`, `superadmin`, `owner`, `supervisor`, `karyawan`) can see and do, so QA and stakeholders aren't guessing.
- **Announcement / pengumuman feature** requested — broadcast-style messages visible to multiple roles (e.g. Owner → all staff, Supervisor → their team).
- **Attendance (absensi) system** — currently check-in/check-out only. Requested improvements: GPS location tracking per check-in/check-out, and a photo captured at check-in/check-out. Also needs confirming: attendance should apply to **all roles except Owner** (Admin/Supervisor/Karyawan Teknisi check in/out; Owner does not).

---

## Roadmap

Frontend wiring is the current priority, role by role. New features are queued for **after** wiring is done, not in parallel.

### Phase 1 — Frontend wiring (in priority order)

- [ ] **Owner** — finish remaining pages: `clients`, `inventory`, `settings`, `attendance`, `index`; add full CRUD to `projects`, `invoices`, `quotations`, `reports` (currently export/read-only where noted above) — pending the product decision on which of these are meant to be export-only vs full CRUD
- [ ] **Owner logout bug** — fix session not clearing on logout (redirects back into dashboard instead of `/login`)
- [ ] **Supervisor** — wire all 6 pages to `/api/supervisor/*`
- [ ] **Karyawan Teknisi** — wire all 6 pages to `/api/technical/*`
- [ ] **Admin login loop** — reproduce with Network tab (Preserve log on) to confirm actual status codes of `/login` and `/me`, then fix

### Phase 2 — Backend / feature work (after wiring is done)

- [ ] Notification system (bell icon currently non-functional on every role) — decide on push vs polling, then wire icon + a notification center
- [ ] Task-assignment notifications for Karyawan Teknisi (`my-tasks`) when a Supervisor/Owner assigns work
- [ ] Announcement / pengumuman module (broadcast messages scoped by role/team)
- [ ] Attendance upgrade: GPS location capture + photo capture on check-in/check-out, scoped to Admin/Supervisor/Karyawan Teknisi (not Owner)
- [ ] Written RBAC reference (what each role can see/do) — likely a `docs/roles.md` or a table in this README
- [ ] Automated tests
- [ ] Full manual end-to-end re-test across all five roles once the above is done

---

## Tech Status (backend — unchanged, still accurate)

### Completed — Backend

The backend follows a modular architecture where each feature has its own routes, controller, service, and model.

Core/shared modules (`backend/src/modules/`):
- Admin Authentication (login, session check, superadmin-guarded admin management)
- Clients, Projects, Quotations, Invoices, Maintenance, Inventory, Reports
- Attendance, Daily Reports, Project Assignments, Project Documentation, Purchase Requests

Role-scoped route groups, all mounted and reachable:
- `modules-owner/` → `/api/owner/*` — dashboard, users, clients, projects, quotations, invoices, maintenance, inventory (incl. purchase-request approve/reject), reports, attendance recap
- `modules-supervisor/` → `/api/supervisor/*` — all 9 sub-modules built (dashboard, projects, assignments, technicians, documentation, inventory, maintenance, attendance, daily reports)
- `modules-technical/` → `/api/technical/*` — all 6 sub-modules built (my tasks, daily report, attendance, inventory request, profile, dashboard), self-scoped to the logged-in technician

Also implemented:
- Sequelize ORM, password hashing with bcrypt
- JWT-based authentication, fully wired login (`POST /api/admin-auth/login`) and session check (`GET /api/admin-auth/me`) — **note:** backend is confirmed working, the login-loop bug reported in QA appears to be frontend session-handling, see Critical Bugs above
- Extended role model: `admin`, `superadmin`, `owner`, `supervisor`, `karyawan`, each with the correct route-level guard (`requireRole`)
- Helmet, restricted CORS, global + login-specific rate limiting, global error handling
- Working `sequelize-cli` setup (`.sequelizerc` + `config/config.js`) and a complete migration chain
- File upload utility (`utils/uploadStorage.js`) with extension/mimetype whitelisting, used for task documentation photos
- Input validation in several modules (e.g. Clients, Invoices, Admin Auth — including email format validation, `phone`/`email` fields on admin accounts)

### Completed — Frontend

**Legacy Admin UI** (`dashboard/src/pages/*.astro` — clients, invoices, projects, quotations, maintenance, inventory, reports, `admins.astro`): wired to the backend API. Login flow for this role is currently the one blocked by the login-loop bug above.

Role-based login redirect and client-side layout guards (`OwnerLayout`, `SupervisorLayout`, `EmployeeLayout`) are in place for all roles.

See **Manual QA Findings** above for the real per-page wiring status of Owner/Supervisor/Karyawan Teknisi — it supersedes any older completion claims.

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
│       ├── owner/                # partially wired, see QA table above
│       ├── supervisor/           # static prototype, not wired
│       └── employee-technical/   # static prototype, not wired
```

---

## Notes

This project is still under active development. The repository reflects the current implementation and development progress, including known bugs and gaps found during manual QA. Some features are incomplete and will be improved gradually before being used in a production environment.

---

## Author

Developed by **ByFakhriel**
