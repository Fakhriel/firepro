# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard.

> **Status:** 🚧 Under active development. The core authentication flow is now working end-to-end (login → JWT → protected routes), and a role-based access structure (Owner / Supervisor / Karyawan Teknisi) has been scaffolded on top of it. Some role-specific modules are still incomplete, and the app has not yet been fully tested end-to-end.

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

### Completed

The backend follows a modular architecture where each feature has its own routes, controller, service, and model.

Core modules (shared/base implementation):
- Admin Authentication
- Clients
- Projects
- Quotations
- Invoices
- Maintenance
- Inventory
- Reports

Implemented so far:
- Sequelize ORM
- Password hashing with bcrypt
- **JWT-based authentication — login (`POST /api/admin-auth/login`) and session check (`GET /api/admin-auth/me`) are now fully wired and working**
- Helmet security middleware
- Restricted CORS configuration
- Global API rate limiting (with a dedicated stricter limiter on the login endpoint)
- Global error handling
- Database migrations using Sequelize CLI, with a working `sequelize-cli` config (`.sequelizerc` + `config/config.js`)
- Input validation in several modules (e.g. Clients, Invoices)
- **Role-based account model**: the `admins` table now supports an extended role set (`admin`, `superadmin`, `owner`, `supervisor`, `karyawan`) instead of a flat admin/superadmin split
- **Superadmin-only guard** on the core admin management endpoints (`/api/admins`) — only superadmin accounts can create, list, update, or delete other admin accounts
- **Owner module scaffolded** (`modules-owner/`): dashboard, user management, clients, projects, quotations, invoices, maintenance, inventory, and reports routes for the Owner role, reusing the existing core controllers/services under a single `requireRole('owner')` guard

---

### In Progress

The current focus is finishing the role-based structure and stabilizing the app before production use.

Remaining tasks:
- **Mount `/api/owner` routes in `app.js`** — the Owner module is built but not yet registered on the Express app, so it isn't reachable yet. This is the next fix.
- **Supervisor module** (`modules-supervisor/`) — not yet implemented on the backend. Frontend pages exist (`pages/supervisor/`) but aren't connected to any API yet.
- **Karyawan Teknisi (field/technical) module** (`modules-technical/`) — not yet implemented on the backend. Frontend UI exists (`pages/employee-technical/`: My Tasks, Daily Report, Attendance, Inventory Request, Profile) as static mockups only, with no API calls wired up.
  - This module needs new data models that don't exist yet: task assignment linked to a technician's account (current `maintenance_schedules.technician` is a free-text field, not a relation), attendance records, daily reports, and inventory request/approval records.
- Finish remaining RBAC guards for Supervisor and Karyawan Teknisi roles (per-module, not just per-role grouping)
- Manual end-to-end testing of the dashboard, across all three role types
- Add automated tests

---

## Roadmap

- [x] Complete core authentication flow (login/me)
- [x] Finish core admin management module (CRUD + superadmin guard)
- [x] Design extended role structure (Owner / Supervisor / Karyawan Teknisi)
- [x] Scaffold Owner module (backend routes + frontend pages)
- [ ] Mount Owner routes in `app.js`
- [ ] Implement Supervisor module (backend + wire up existing frontend pages)
- [ ] Implement Karyawan Teknisi module (new tables: tasks, attendance, daily reports, inventory requests + wire up existing frontend pages)
- [ ] Apply per-module RBAC guards consistently across all roles
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

> Login is now functional: after `npm run seed:admin`, the seeded account can be used against `POST /api/admin-auth/login` to obtain a JWT token.

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
├── modules/            # Core/shared modules (reused across roles)
│   ├── admin-auth/
│   ├── clients/
│   ├── inventory/
│   ├── invoices/
│   ├── maintenance/
│   ├── projects/
│   ├── quotations/
│   └── reports/
├── modules-owner/       # Owner-role routes (reuse core controllers, built, not yet mounted)
├── modules-supervisor/  # Supervisor-role routes (not yet implemented)
├── modules-technical/   # Karyawan Teknisi-role routes (not yet implemented)
├── middleware/
├── config/
├── migrations/
└── scripts/

dashboard/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   └── pages/
│       ├── owner/
│       ├── supervisor/
│       └── employee-technical/
```

---

## Notes

This project is still under active development. The repository reflects the current implementation and development progress. Some features are incomplete and will be improved gradually before being used in a production environment.

---

## Author

Developed by **Fakhriel Yusmana Shiddiq**
