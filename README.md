# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for Owner, Supervisor, and Karyawan Teknisi (field technician).

> **Status:** 🚧 Under active development. Authentication and the backend are functionally complete for all three role tiers (Owner / Supervisor / Karyawan Teknisi). The **Owner frontend is partially wired** (4 of 11 pages call the API), while the **Supervisor and Karyawan Teknisi frontends are still static prototype UI** — built visually, but not yet connected to the backend. The app is not ready for full end-to-end testing until that wiring is finished.

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

## Current Progress

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
- JWT-based authentication, fully wired login (`POST /api/admin-auth/login`) and session check (`GET /api/admin-auth/me`)
- Extended role model: `admin`, `superadmin`, `owner`, `supervisor`, `karyawan`, each with the correct route-level guard (`requireRole`)
- Helmet, restricted CORS, global + login-specific rate limiting, global error handling
- Working `sequelize-cli` setup (`.sequelizerc` + `config/config.js`) and a complete migration chain
- File upload utility (`utils/uploadStorage.js`) with extension/mimetype whitelisting, used for task documentation photos
- Input validation in several modules (e.g. Clients, Invoices, Admin Auth — including email format validation, `phone`/`email` fields on admin accounts)

---

### Completed — Frontend

**Legacy Admin UI** (`dashboard/src/pages/*.astro` — clients, invoices, projects, quotations, maintenance, inventory, reports, `admins.astro`): fully wired to the backend API, manually tested.

**Owner UI** (`dashboard/src/pages/owner/`): 4 of 11 pages wired to `/api/owner/*` —
- ✅ `users.astro`, `invoices.astro`, `maintenance.astro`, `quotations.astro`

Role-based login redirect and client-side layout guards (`OwnerLayout`, `SupervisorLayout`, `EmployeeLayout`) are in place for all roles.

---

### In Progress

**Owner UI — 7 of 11 pages still static, not yet wired:**
```
attendance, clients, index (dashboard), inventory, projects, reports, settings
```

**Supervisor UI — 0 of 6 pages wired.** Backend (`/api/supervisor/*`) is ready; none of the frontend pages call it yet:
```
attendance, daily-report, index (dashboard), inventory, maintenance, projects
```

**Karyawan Teknisi UI — 0 of 6 pages wired.** Backend (`/api/technical/*`) is ready; none of the frontend pages call it yet:
```
attendance, daily-report, index (dashboard), inventory-request, my-tasks, profile
```

All corresponding backend endpoints already exist and are ready — remaining work here is purely frontend wiring (fetch on load, real form submission, real error/success handling), following the same `adminApiFetch` pattern already used in the legacy Admin pages and the 4 completed Owner pages.

Remaining tasks:
- Wire up the remaining 7 Owner pages
- Wire up all 6 Supervisor pages
- Wire up all 6 Karyawan Teknisi pages
- Manual end-to-end testing of the dashboard, across all five roles (admin/superadmin, owner, supervisor, karyawan)
- Add automated tests

---

## Roadmap

- [x] Complete core authentication flow (login/me)
- [x] Finish core admin management module (CRUD + superadmin guard)
- [x] Design extended role structure (Owner / Supervisor / Karyawan Teknisi)
- [x] Build & mount Owner backend routes
- [x] Build Supervisor backend (all 9 sub-modules)
- [x] Build Karyawan Teknisi backend (all 6 sub-modules + supporting data modules)
- [x] Apply per-module RBAC guards across all roles
- [x] Role-based login redirect + client-side layout guards
- [ ] **Wire up remaining Owner pages (7 of 11 left)**
- [ ] **Wire up Supervisor pages (6 of 6 left)**
- [ ] **Wire up Karyawan Teknisi pages (6 of 6 left)**
- [ ] Manual end-to-end testing *(kept intentionally — every flow above still needs to be walked through by hand before it's trusted)*
- [ ] Add automated tests *(kept intentionally — still not started)*

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

> Login is fully functional for all roles via `POST /api/admin-auth/login`. The legacy Admin dashboard (`/`) and 4 Owner pages are usable end-to-end today. The rest of the Owner UI, plus all Supervisor and Karyawan Teknisi UI, are not yet usable — see **In Progress** above.

---

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
│       ├── *.astro              # legacy Admin UI — wired ✅
│       ├── owner/                # 4/11 wired ✅ ⚠️
│       ├── supervisor/           # 0/6 wired ⚠️
│       └── employee-technical/   # 0/6 wired ⚠️
```

---

## Notes

This project is still under active development. The repository reflects the current implementation and development progress. Some features are incomplete and will be improved gradually before being used in a production environment.

---

## Author

Developed by **ByFakhriel**
