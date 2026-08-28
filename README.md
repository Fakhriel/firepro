# FIREPRO

An internal dashboard for managing fire protection service operations.

This project manages clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for **Owner, Admin, Supervisor, and Technical Employee (Field Technician)**.

> **Status:** Role model executed and live-tested. The `export.ts` blocker, the full Manual QA Round 1 list, and Phase 1 backend gaps are all fixed and verified end-to-end against a real database — not just read from source. Two more bugs surfaced only during that live testing (`invoices.project_id` NOT NULL mismatch, and a security-verification middleware that was defined but never wired in) and are fixed too. Remaining open items are scoped below under Roadmap.

---

## 🔑 Role Model — Executed & Verified

### Old Model

**5 roles:** `superadmin`, `admin`, `owner`, `supervisor`, `employee`.

### Current Model

**4 roles:**

| Role                   | Scope                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**              | Full system control. Sole owner of account management — create/edit/deactivate/delete Admin, Supervisor, and Technical Employee accounts.                                                                      |
| **Admin**              | Full operational control (Clients, Projects, Quotations, Invoices, Inventory, Maintenance, etc.) — **zero account control**. Cannot create accounts, edit any role, or change any password, including its own. |
| **Supervisor**         | Field supervision — scoped to relevant projects/tasks.                                                                                                                                                         |
| **Technical Employee** | Field worker — scoped to assigned tasks.                                                                                                                                                                       |

### What Was Done

* Migrated existing `superadmin` accounts to `owner` via migration, then dropped `superadmin` from the DB enum and the `Admin` model.
* Retired the legacy `/admins` page and its backend routes entirely (`/api/admins` now correctly 404s).
* Removed every `requireRole(..., 'superadmin')` guard and the `requireSuperadmin` middleware across the backend.
* Fixed `/api/admin/users` (Owner's account-management endpoint), which was wrongly gated to `requireRole('admin')` instead of `requireRole('owner')`.
* Replaced `scripts/seedAdmin.js` with `scripts/seedOwner.js` (`npm run seed:owner` is now the only seed script).
* Removed the "Change Password" tab from Admin's Settings UI and all role/password controls from Admin's reachable pages.

### Live-Tested

* Owner login → correct role in JWT.
* Owner creates Admin/Supervisor/Technical Employee accounts → succeeds.
* Admin attempts to create another account → **403**.
* Admin attempts to change its own password → **403**.
* `GET /api/admins` → **404**.

---

## 🧩 Data Relationship Map

This document is intended to reduce complexity and confusion when tracing relationships between models, especially relationships that reference the `admins` table.

The `admins` table is shared by four roles: **Owner, Admin, Supervisor, and Technical Employee**.

### Why This Can Be Confusing

The `admins` table is used for two purposes:

1. As the **login account** for all roles.
2. As a representation of a **person** referenced by other modules — for example, who uploaded a document, which technician was assigned to a project, who created an announcement, and so on.

Because the second purpose is used across multiple modules, there are **8 different foreign key column names** that all reference `admins.id`:

| FK Column           | Table                                                           | Meaning                             |
| ------------------- | --------------------------------------------------------------- | ----------------------------------- |
| `adminId`           | `attendance`                                                    | Who performed the attendance action |
| `technicianId`      | `daily_reports`, `maintenance_schedules`, `project_assignments` | Assigned/relevant technician        |
| `uploadedBy`        | `documents`, `project_documentation`                            | Who uploaded the file               |
| `requestedBy`       | `purchase_requests`                                             | Who submitted the request           |
| `createdBy`         | `announcements`                                                 | Who created the announcement        |
| `recordedByAdminId` | `invoice_payments`                                              | Who recorded the payment            |

Conceptually, these columns all represent the same thing: **a person/action actor**, but they use different names because each module was designed independently without a shared naming convention.

This is **not a data integrity issue or a bug**. The relationships are valid. However, the inconsistent naming is the main source of confusion when navigating the backend across different modules.

---

### Identity & Accounts

```text
admins (single table, roles: owner | admin | supervisor | technical employee)
  ├─ attendance              (adminId)
  ├─ documents               (uploadedBy)
  ├─ project_documentation   (uploadedBy)
  ├─ purchase_requests       (requestedBy)
  ├─ announcements           (createdBy)
  ├─ invoice_payments        (recordedByAdminId)
  ├─ daily_reports           (technicianId)
  ├─ maintenance_schedules   (technicianId)
  └─ project_assignments     (technicianId)
```

---

### Core Business Domain — Client → Project → Finance

```text
clients
  ├─ projects              (clientId)
  ├─ invoices              (clientId)
  └─ quotations            (clientId)

projects
  ├─ invoices              (projectId)
  ├─ quotations            (projectId)
  ├─ boq_items             (projectId)
  ├─ cost_entries          (projectId)
  ├─ documents             (projectId)
  └─ project_assignments   (projectId)

quotations
  ├─ invoices              (quotationId — one quotation can generate one invoice)
  └─ boq_items             (quotationId)

invoices
  └─ invoice_payments      (invoiceId)
```

Relationships within this domain are already **clean and consistent**, using `clientId` and `projectId` throughout.

**No changes are required here.**

---

### Inventory

```text
inventory_items
  ├─ inventory_images
  │    └─ (inventoryItemId, CASCADE)
  │
  ├─ inventory_stock_movements
  │    └─ (inventoryItemId, CASCADE)
  │
  └─ purchase_requests
       └─ (inventoryItemId)
```

---

### Relationship Guidelines

A database migration to rename the existing foreign key columns is **not recommended**.

The potential risk and migration complexity are not worth the relatively small benefit.

Instead:

1. **Use this document as the primary relationship reference.**
2. **Normalize foreign keys in the service/serialization layer** where appropriate.
3. **Follow existing naming patterns when creating new relationships.**
4. Avoid introducing unnecessary FK naming variations.

For example, instead of returning:

```js
{
  technicianId: 4
}
```

the service layer can expose a more meaningful representation:

```js
{
  performedBy: {
    id: 4,
    name: "John Doe",
    role: "technical_employee"
  }
}
```

This keeps database-specific naming inside the backend while providing a more meaningful and consistent API response to the frontend.

This approach has already been partially implemented. For example, `invoices.service.js` converts `clientId` into `clientName`.

### Existing Naming Patterns

| Relationship Meaning                  | Preferred FK        |
| ------------------------------------- | ------------------- |
| Person performing technical work      | `technicianId`      |
| Person uploading a file               | `uploadedBy`        |
| Person submitting a request           | `requestedBy`       |
| Person creating a record/announcement | `createdBy`         |
| Person recording a payment            | `recordedByAdminId` |

The goal is not to make every FK column literally identical, but to keep the naming **semantically meaningful and predictable within its domain**.

---

## 🛠 Tech Stack

| Layer          | Technology                       |
| -------------- | -------------------------------- |
| Backend        | Node.js, Express 5               |
| Database       | MySQL, Sequelize                 |
| Authentication | JWT, bcryptjs                    |
| Frontend       | Astro, Tailwind CSS, GSAP        |
| Security       | Helmet, CORS, express-rate-limit |

---

## ✅ Manual QA Round 1 — All Fixed

### Blocker

**`dashboard/src/lib/export.ts` compile failure** — fixed. The file had every export (`ExportOptions`, `exportTableToPDF`, `formatIDR`, `formatPct`) duplicated in full; the duplicate block was removed, leaving one clean definition per export.

### Owner

* Legacy `/admins` retired; `/owner/users` is now the only account-management page, with no password-reset control exposed.
* Overview dashboard: removed the hardcoded "5 terakhir" text; the Recent Projects card now has a live search box, a time-range filter (24h / this week / this month / this year), and client-side pagination.
* Item Categories page: the old page was a static mockup. Rewrote it as a real read-only view computed live from `/api/inventory/admin`, showing per-category item counts and usage status.

### Admin

* Added a working Announcement page (`/announcements`), mirroring Owner's — Admin can compose and send announcements to Supervisor/Technical Employee and see send history.

### Supervisor

* Added an intermediate `in_progress` maintenance status.
* Fixed technician assignment: the frontend previously sent `{ technician: <name string> }` while the backend expected `{ technicianId: <numeric id> }`. Now consistent and verified live.
* Multi-technician assignment remains single-technician. No decision to change this has been made.

### Technical Employee

* **Fixed the all-pages-404 bug.** Rewired the sidebar navigation to the actual routes: `my-tasks`, `attendance`, `daily-report`, `inventory-request`, and `profile`.
* Attendance GPS + photo capture is still unfinished — see Roadmap.

---

## ✅ Phase 1 — Backend Gaps, All Fixed and Live-Tested

* **Quotation → Invoice conversion and payment recording** — frontend UI was missing. Rewrote `owner/invoices.astro`, fixed the status enum mismatch, and added payment recording/history UI.
* Added a "Create Invoice" button on `owner/quotations.astro` for `accepted` quotations.
* Fixed `invoices.project_id` being incorrectly `NOT NULL`. Migration `20260101000030` now makes the column nullable.
* **Quotation auto-sum from linked BOQ items** — verified end-to-end.
* **Document upload whitelist hardened** — file-content magic-byte verification is now enforced.
* Fixed the previously unwired `verifyUploadedDocument` middleware in `documents.routes.js`.
* Plain-text files or EXEs renamed as documents are now rejected.
* **Global fallback for missing/malformed request bodies** — now handles both `undefined` and literal JSON `null`.
* **Duplicate migration number prefixes** (`016`×3, `017`×2, `018`×2) were renumbered into sequential unique prefixes (`016`–`024`) while preserving the original execution order.

---

## 🧪 Testing Performed

This pass went beyond static code reading: a real MySQL instance was provisioned, the full migration chain was run against an empty database, an Owner account was seeded, and the backend was exercised with live HTTP requests for every fix above.

Tested areas include:

* Role boundaries
* Quotation → Invoice conversion
* Payment recording/removal
* Maintenance assignment
* Maintenance status transitions
* File upload rejection/acceptance
* Database-level verification where relevant

**Still to do:** a full manual click-through across all four roles in the actual browser UI and a checked-in automated test suite.

---

## 🗺 Roadmap — Remaining Open Items

### Phase 2 — Feature Completion

* [ ] Wire task-assignment and purchase-request-review notifications (`project-assignments.service.js` / `purchase-requests.service.js` currently make zero calls to the notification service despite a comment claiming otherwise)
* [ ] Finish attendance GPS + photo capture — the migration added the DB columns, but the model doesn't declare them and the service/controller don't forward them
* [ ] Automated test suite (checked in to the repo, not ad-hoc scripts)

### Final Milestone

* [ ] Full manual end-to-end click-through testing across all four roles, in-browser

---

## 📊 Tech Status — Backend

Core/shared modules (`backend/src/modules/`):

* Admin Authentication
* Clients
* Projects
* Quotations
* Invoices
* Maintenance
* Inventory
* Reports
* BOQ
* Documents
* Attendance
* Daily Reports
* Project Assignments
* Project Documentation
* Purchase Requests
* Notifications
* Announcements

Role-scoped route groups:

```text
modules-owner/      → /api/owner/*
modules-supervisor/ → /api/supervisor/*
modules-technical/  → /api/technical/*
```

Verified across passes:

* JWT authentication with correct expiry/tampering/`alg:none` rejection
* Route-level role guards with no cross-role leakage
* SQL injection safety
* Stored XSS escaping
* User-enumeration protection
* Rate limiting
* Helmet + CORS
* Migration chain runs cleanly end-to-end from an empty database
* 30 migrations verified live
* Error responses gated correctly behind `NODE_ENV`

### Frontend

Owner, Supervisor, and Technical Employee pages are present and wired.

The `export.ts` blocker and the Technical Employee all-404 regression are both fixed and verified.

---

## 🚀 Running Locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run seed:owner
npm run dev
```

Update `.env` with your database credentials and a secure `JWT_SECRET`.

Generate a secure secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> **Reminder:** Always run production deployments with `NODE_ENV=production`. The error handler only suppresses stack traces when this is set correctly.

### Dashboard

```bash
cd dashboard
npm install
cp .env.example .env
npm run dev
```

Configure `PUBLIC_API_URL` to point to your backend server.

---

## 📁 Project Structure

```text
backend/
├── modules/                 # Core/shared modules
├── modules-owner/           # Owner-role routes
├── modules-supervisor/      # Supervisor-role routes
├── modules-technical/       # Technical Employee-role routes
├── middleware/
├── config/
├── migrations/              # Clean end-to-end migration chain
├── utils/                   # Upload/storage utilities
└── scripts/                 # seedOwner.js is the only seed script

dashboard/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/                 # export.ts
│   └── pages/
│       ├── announcements.astro
│       ├── item-categories.astro
│       ├── owner/
│       ├── supervisor/
│       └── employee-technical/
```

---

## 👤 Author

Developed by **ByFakhriel**
