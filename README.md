# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard.

> **Status:** 🚧 Under active development. Some modules are already implemented, but the authentication flow is still being fixed, so the application is not yet ready for end-to-end testing.

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

Current modules:

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
- JWT-based authentication
- Helmet security middleware
- Restricted CORS configuration
- Global API rate limiting
- Global error handling
- Database migrations using Sequelize CLI
- Input validation in several modules (e.g. Clients)

---

### In Progress

The current priority is completing the authentication module.

At the moment:

- The frontend login flow is not working because the required authentication endpoints are not fully connected.
- Admin CRUD operations are still incomplete.
- A dedicated login rate limiter has been prepared but is not yet applied.
- Role-based authorization (`admin` and `superadmin`) has not been implemented.
- Since authentication is incomplete, the dashboard cannot be fully tested end-to-end.

---

## Roadmap

- [ ] Complete authentication flow
- [ ] Finish admin management module
- [ ] Implement Role-Based Access Control (RBAC)
- [ ] Manual end-to-end testing
- [ ] Add automated tests

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

Update the `.env` file with your database credentials and a secure `JWT_SECRET`.

> At the time this README was written, the seeded admin account cannot be used through the API because the login flow is still under development.

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
├── modules/
│   ├── admin-auth/
│   ├── clients/
│   ├── inventory/
│   ├── invoices/
│   ├── maintenance/
│   ├── projects/
│   ├── quotations/
│   └── reports/
├── middlewares/
├── config/
├── migrations/
└── scripts/

dashboard/
├── src/
├── components/
├── layouts/
├── lib/
└── pages/
```

---

## Notes

This project is still under active development.

The repository reflects the current implementation and development progress. Some features are incomplete and will be improved gradually before being used in a production environment.

---

## Author

Developed by **Fakhriel Yusmana Shiddiq**
