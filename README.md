# FIREPRO

An internal dashboard for managing fire protection service operations.

This project manages clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for **Owner, Admin, Supervisor, and Technical Employee (Field Technician)**.

> **Status:** Role model executed and live-tested. The `export.ts` blocker, the full Manual QA Round 1 list, and Phase 1 backend gaps are all fixed and verified end-to-end against a real database — not just read from source. Two more bugs surfaced only during that live testing (`invoices.project_id` NOT NULL mismatch, and a security-verification middleware that was defined but never wired in) and are fixed too.
>
> A subsequent **Frontend Consistency & Hardening Pass** (see below) fixed a round of type-check regressions introduced by a frontend rewrite, closed an Owner-role responsive-layout bug, and added session hardening, a modernized dropdown treatment, and Tier 1 PWA installability — all frontend-only, no backend/database changes. Remaining open items are scoped below under Roadmap.
>
> An **Automated Testing pass** (see below) has since been started on the backend: unit tests mocking Sequelize models, plus integration tests against a real MySQL database. This surfaced several confirmed, not-yet-fixed bugs — including a real race condition in inventory stock movements — listed under Roadmap.

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
| ------------------- | --------------------------------------------------------------- | ------------------------------------ |
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
  ├─ quotations             (projectId)
  ├─ boq_items              (projectId)
  ├─ cost_entries           (projectId)
  ├─ documents              (projectId)
  └─ project_assignments    (projectId)

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
| ------------------------------------- | -------------------- |
| Person performing technical work      | `technicianId`      |
| Person uploading a file               | `uploadedBy`         |
| Person submitting a request           | `requestedBy`        |
| Person creating a record/announcement | `createdBy`          |
| Person recording a payment            | `recordedByAdminId`  |

The goal is not to make every FK column literally identical, but to keep the naming **semantically meaningful and predictable within its domain**.

---

## 🛠 Tech Stack

| Layer          | Technology                       |
| -------------- | --------------------------------- |
| Backend        | Node.js, Express 5               |
| Database       | MySQL, Sequelize                 |
| Authentication | JWT, bcryptjs                    |
| Frontend       | Astro, Tailwind CSS, GSAP        |
| Security       | Helmet, CORS, express-rate-limit |
| Testing        | Jest, Supertest                  |

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

## ✅ Frontend Consistency & Hardening Pass — All Fixed and Verified

A frontend-only pass (no backend or database changes) following a UI consistency rewrite that had introduced a round of type-check regressions.

### Type-check regressions (introduced by the consistency rewrite)

* `AdminUser` (`dashboard/src/lib/auth.ts`) was missing `email`/`phone`, even though the backend has returned both for some time — broke `employee-technical/profile.astro` and `owner/settings.astro`.
* `ProjectRow` (`dashboard/src/pages/projects.astro`, `owner/projects.astro`) was missing `clientId`, used when prefilling the edit form — the backend already returns it.
* `owner/invoices.astro` referenced a non-existent `OwnerInvoice.statusLabel`; replaced with the existing `STATUS_LABELS[status]` lookup instead of widening the type with a field the API never sends.
* `quotations.astro` was missing the `confirmDialog` import and the `clientSearchDebounce` declaration — both dropped during the rewrite, present in the sibling `owner/quotations.astro`.
* Tailwind arbitrary value `sm:w-[420px]` → canonical `sm:w-105` across the four drawer components that used it.
* `tsconfig.json`: added `ignoreDeprecations: "6.0"` to silence the TS 7.0 `baseUrl` deprecation warning.

### Owner-role responsive bug

* The "Jadwalkan" (schedule) modal on `owner/maintenance.astro` had no `max-h`/`overflow-y-auto`, unlike the Admin-role equivalent — tall viewports were fine, but the form overflowed off-screen on shorter ones (the Save/Cancel buttons became unreachable). Fixed, and ported the same treatment (capped height, sticky header, 2-column field layout on `sm+`) to bring it to parity with Admin.
* The same missing cap was present on four other Owner modals without an explicit report — fixed for consistency: `clients.astro`, `documents.astro`, `invoices.astro`, `users.astro`.

### Session hardening

* Added `startIdleWatcher()` in `lib/auth.ts` — auto-logout after 30 minutes of no interaction (mouse/keyboard/touch/scroll), wired into all four role layouts (`DashboardLayout`, `OwnerLayout`, `SupervisorLayout`, `EmployeeLayout`). Login page shows a "session ended due to inactivity" message on the resulting redirect. Frontend-only; `sessionStorage` remains the storage mechanism, still backed by the existing 8h JWT expiry.

### UI polish

* `select.field-input` restyled globally in `global.css` — every dropdown across every role now uses a custom chevron instead of the native browser affordance, since every `<select>` in the codebase already shares the `field-input` class.
* `login.astro` — added leading icons to both fields, friendlier placeholder copy, and per-field inline validation (red border + inline message) instead of only a top-level alert box.

### PWA — Tier 1 (installable shell)

* Added `public/manifest.webmanifest`, `public/sw.js`, and real brand icons (`public/icons/icon-192.png`, `icon-512.png`, replacing a leftover template favicon that was never customized) wired through `layouts/Base.astro`.
* Service worker deliberately caches **static assets only** (script/style/font/image, same-origin). API calls and HTML navigations are always network-only — project/invoice/inventory data is never served stale, and auth state is never cached.
* This covers installability and shell-load speed only. Offline data entry (Tier 2 — relevant for Supervisor/Technical Employee in the field) is not implemented yet; it needs the auth token moved off `sessionStorage` into something a service worker can read (see Roadmap).

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

The Frontend Consistency & Hardening Pass above was verified by direct source comparison against the pre-rewrite version and manual inspection of the affected pages; it has not yet had a full in-browser click-through (see Roadmap).

### Automated Testing (new)

A checked-in automated test suite now exists on the backend, covering both mocked unit tests and real-database integration tests. Full setup instructions, coverage breakdown, and the list of bugs each test confirms live in **[`backend/TESTING.md`](./backend/TESTING.md)**.

Summary:

* **Unit tests (Jest, mocked models):** 8 modules covered, 34 tests passing — `attendance`, `daily-reports`, `maintenance`, `quotations`, `invoices`, `inventory`, `purchase-requests`, `clients`.
* **Integration tests (Jest + Supertest, real MySQL):** login flow, anti user-enumeration, RBAC enforcement on a real protected route, immediate token invalidation on account deactivation, and a concurrency test against the inventory stock-movement endpoint.
* This pass **found bugs, it did not fix them.** Several tests are intentionally named `BUG:`/`GAP:` and currently pass because they pin the *current, incorrect* behavior as a documented baseline — see Roadmap below for the fix list, and `TESTING.md` for details on this convention.

**Still to do:** unit/integration coverage for the remaining backend modules, fixing the bugs this pass confirmed, wiring the suite into CI, and a full manual click-through across all four roles in the actual browser UI.

---

## 🗺 Roadmap — Remaining Open Items

### Phase 2 — Feature Completion

* [ ] Wire task-assignment and purchase-request-review notifications (`project-assignments.service.js` / `purchase-requests.service.js` currently make zero calls to the notification service despite a comment claiming otherwise)
* [ ] Finish attendance GPS + photo capture — the migration added the DB columns, but the model doesn't declare them and the service/controller don't forward them
* [x] Automated test suite (checked in to the repo — see [`backend/TESTING.md`](./backend/TESTING.md)). Coverage is partial (8 of ~16 core modules); extending it to the rest is tracked below.

### Phase 2b — Bugs Confirmed by Automated Testing (not yet fixed)

Found and confirmed via the automated test suite above — see `backend/TESTING.md` for full detail and reproduction. Listed roughly in order of impact:

* [ ] **Inventory stock-out has no transaction/row locking** — confirmed via integration test against a real database: two concurrent stock-out requests on the same item both succeeded, driving stock negative. Needs `sequelize.transaction()` with row locking in `inventory.service.js#recordMovement` before this is safe with more than one concurrent user.
* [ ] **Invoice `amount` is not validated against `paidAmount`** — lowering an invoice's amount below what's already been paid leaves `outstandingAmount: 0` while `status` stays stuck at `partially_paid`.
* [ ] **Quotation status is not locked once `accepted`** — can still be reverted to `draft`/other statuses, and `syncAmountFromBoq()` silently overwrites `amount` post-acceptance with no check against an already-issued invoice.
* [ ] **Attendance / daily reports timezone bug** — `workDate`/`reportDate` use `toISOString()` (UTC); any check-in or report before 07:00 local time (WIB) is recorded under the previous calendar day.
* [ ] **Maintenance status (`due_soon`/`overdue`) is not derived automatically** from `nextService`, unlike the equivalent `deriveDisplayStatus` pattern already used for invoices.
* [ ] **Daily report `create()` doesn't validate `projectId` against the database** — a technician can submit a report against a non-existent project.
* [ ] **Daily report `markReviewed()` has no state-machine guard** — an already-reviewed report can be reviewed again, silently overwriting `reviewedBy`/`reviewNote` with no audit trail.
* [ ] **Purchase request approval never triggers a stock movement** — needs a product decision on whether approval should auto-create stock-in, or whether that's intentionally manual (and if so, document it).
* [ ] **Client email format is not validated** — any non-empty string is accepted.
* [ ] **Admin role changes only take effect after the JWT expires (8h) or re-login** — `requireAdminAuth` re-checks `isActive` live against the database on every request, but reads `role` only from the token payload. Confirmed by code review; not yet covered by a runnable test.

### Phase 3 — Frontend / Product Polish (post-consistency-pass)

* [ ] **Dark/light mode** — not a simple CSS-variable swap: `--color-ink`/`--color-paper` are used both as semantic text/background tokens (should invert) and as literal brand-panel colors (e.g. the login page's dark left panel, hazard stripes — should not invert). Needs a separate dark-specific token set, not a naive override.
* [ ] **i18n (ID/EN) switcher** — infrastructure is cheap; the actual work is extracting and translating the hardcoded Indonesian strings across every page, including domain-specific terms (BOQ, Jadwalkan, etc.) that need correct technical translation, not literal.
* [ ] **Excel export** for report-related roles — frontend-only, same pattern as the existing `exportTableToPDF` in `lib/export.ts`; blocked on column/format spec per role.
* [ ] **Profile photo upload**, all roles — **not frontend-only**: needs a backend upload endpoint, a new column on the admin model, and file storage.
* [ ] **PWA Tier 2 — offline data entry** for Supervisor/Technical Employee (daily reports, attendance): requires moving the auth token off `sessionStorage` into IndexedDB (or similar) so the service worker can read it, plus an offline write-queue with retry/sync and conflict handling.

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

Type-check regressions from the most recent UI consistency rewrite are fixed (see Frontend Consistency & Hardening Pass above). The app is now Tier-1 PWA-installable (static-asset caching only, no offline data yet), has a 30-minute idle auto-logout, and every dropdown across every role shares one modernized style.

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

### Running Tests

```bash
cd backend
npm test                  # unit tests (mocked, no database needed)
npm run test:integration  # integration tests (needs a running local MySQL — see backend/TESTING.md)
```

See **[`backend/TESTING.md`](./backend/TESTING.md)** for full setup instructions, coverage breakdown, and known issues confirmed by these tests.

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
├── scripts/                 # seedOwner.js is the only seed script
├── tests/integration/       # Supertest integration tests (real MySQL)
└── TESTING.md                # Test setup, coverage, and known issues

dashboard/
├── public/
│   ├── manifest.webmanifest # PWA manifest (Tier 1)
│   ├── sw.js                # Service worker — static assets only, no API/HTML caching
│   ├── favicon.svg          # Brand flame icon (replaces old template placeholder)
│   └── icons/                # icon-192.png, icon-512.png, icon-source.svg
├── src/
│   ├── components/
│   ├── layouts/               # startIdleWatcher() wired into all four role layouts
│   ├── lib/                   # export.ts, auth.ts (AdminUser, startIdleWatcher)
│   ├── styles/                 # global.css — modernized select.field-input
│   └── pages/
│       ├── login.astro         # idle-timeout message, per-field validation
│       ├── announcements.astro
│       ├── item-categories.astro
│       ├── owner/
│       ├── supervisor/
│       └── employee-technical/
```

---

## 👤 Author

Developed by **ByFakhriel**
