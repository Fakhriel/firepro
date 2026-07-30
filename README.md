# FIREPRO

An internal dashboard for managing fire protection service operations.

This project is being built to manage clients, projects, quotations, invoices, maintenance schedules, inventory, and basic business reports from a single dashboard — with role-based access for Admin, Owner, Supervisor, and Karyawan Teknisi (field technician).

> **Status:** 🚧 Under active development, mid-QA pass. Backend is functionally complete for all role tiers, and has now also been through a **deep security/logic testing pass** (live, against a real database — not just code review). Frontend wiring has progressed significantly — Owner, Supervisor, and Karyawan Teknisi are now mostly wired. **Current focus: fix the project-creation blocker (backend bug, confirmed root cause of the Invoices gap too), then close the remaining CRUD gaps (Owner `projects`/`reports`/`invoices`), then wire the notification system.**

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

Real, page-by-page status verified against the current codebase — both by manual click-through and by a live backend deep-dive (real MySQL instance, real HTTP requests, all 5 roles seeded and tested). This supersedes any older completion claims below.

### 🔴 Critical bugs — open

- **Project creation is broken at the backend, independent of any UI gap.** `backend/src/modules/projects/projects.service.js` generates a temporary `code` before the real one is assigned: `` `TMP-${Date.now()}-${random}` `` — this is 24 characters, but the `code` column is `VARCHAR(20)`. **Every single project creation fails** with `Data too long for column 'code'`, reproduced live against a real database. This is the confirmed root cause of the Invoices gap below — Invoices require a valid `projectId`, so even once a Create form exists for Projects, it won't work until this is fixed. **Fix:** shorten the temp code, e.g. `Date.now().toString(36)` instead of the raw decimal timestamp.
- **Projects have no create/edit form anywhere in the UI.** Confirmed empty (no `POST`/`PATCH`, no "Tambah Project" button) in both `owner/projects.astro` and the legacy `projects.astro`. Both are view/export-only today.
- **Invoices have no create form anywhere in the UI.** `owner/invoices.astro` has Read, Delete, and a partial Update (mark-as-paid) — but no "Tambah Invoice". The legacy `invoices.astro` is view-only (a single `GET /api/invoices/admin` call, nothing else). **Clarified:** Invoice is not auto-generated from the Client form — it's its own entity referencing an existing `clientId` **and** `projectId`, so it needs its own dedicated form once Projects can actually be created.
- **`technicianId` not validated on project/task assignment.** `backend/src/modules/project-assignments/project-assignments.service.js`, `create()` — no check that the given `technicianId` belongs to an account with role `karyawan`. Verified live: a Supervisor successfully assigned a task to the **Owner's own account**. Assigning to a non-existent ID also isn't caught early — falls through to a raw DB error (`500`) instead of a clean `400`.
- **File upload accepts arbitrary file types/content.** `backend/src/utils/uploadStorage.js` trusts the client-supplied `mimetype` header (fully attacker-controlled) and doesn't restrict the stored extension to known-safe image types. Verified live: a file containing raw PHP code, renamed with a spoofed `Content-Type: image/jpeg`, was accepted and stored with its `.php` extension intact, publicly served via `/uploads`. Not currently exploitable as remote code execution (this is a Node/Express stack with no PHP interpreter attached), and Helmet's CSP mitigates inline-script execution if an `.html` file were uploaded instead — but it's still a real input-validation gap that should be closed before this handles real user-uploaded content in production.
- **Migration `20260101000015-add-technician-id-to-maintenance.js` has a syntax error** (a JSDoc comment lost its `/** */` delimiters, leaving a bare `@type {...}` statement — invalid JS). This breaks `npm run db:migrate` for anyone running the full chain from a fresh database; migrations 001–014 apply fine, but 015 (which links Maintenance to a real technician account — see the "maintenance was a dead end" fix below) throws `Invalid or unexpected token` and stops the whole run.

### 🔴 Critical bugs — fixed this pass

- **Admin login loop** — root cause confirmed (was a stale/mismatched session-state read on `/login` racing against `guardAuth()`'s redirect); fixed.
- **Owner logout loop** — root cause confirmed and fixed; `clearAdminAuth()` now completes before the redirect fires.
- **CORS fallback default mismatch** — `backend/src/config/env.js` fell back to port `4321` when `CORS_ORIGIN` wasn't set, but the dashboard dev server runs on `4322`. Fixed at the source (fallback default corrected, not just the `.env.example` value).
- **IDOR on Daily Report submission** — a technician could submit a report against another technician's `assignmentId` with no ownership check. Fixed: `technical-daily-report.controller.js` now verifies `assignment.technicianId === req.admin.id` before accepting the report.
- **Maintenance assignment was a dead end** — `maintenance_schedules.technician` used to be a free-text field with no link to a real account, and there was no way for a technician to ever see a maintenance job assigned to them. A `technician_id` FK column and a `modules-technical/technical-maintenance/` module have been added to address this — **but see the migration syntax-error bug above, which currently blocks this fix from actually applying to a fresh database.**

### 🟡 Notification bell — confirmed not built (not a bug)

`Topbar.astro`, `OwnerTopbar.astro`, `SupervisorTopbar.astro`, `EmployeeTopbar.astro` all render a bell icon with zero click handlers, and there is no backend notification module at all (`find` for anything notification-related returns nothing). The one related UI, a toggle panel in `owner/settings.astro`, is honestly self-labeled in its own markup: *"Belum tersambung ke backend — toggle di bawah belum tersimpan permanen."* This isn't a hidden bug, it's an unstarted feature — see Phase 2 below.

### 🟢 Not a bug — user/account confusion

**Role dropdown "only shows Admin/Superadmin."** There are two separate user-management pages: `/admins` (legacy, reachable via an `admin`/`superadmin` account, intentionally only offers those two roles — it predates the 5-tier system) vs. `/owner/users` (reachable via the `owner` account, already has all 4 relevant roles: `owner`, `admin`, `supervisor`, `karyawan`). Verified by reading both files — the second one is already complete. Likely explanation: testing was done while logged in as the legacy `admin`/`superadmin` seed account instead of `owner`.
**Worth discussing:** now that Owner-based user management is more complete, is the legacy `/admins` page (and the `admin`/`superadmin` roles) still needed going forward, or should it eventually be retired/merged?

### 🟢 Owner role — mostly wired now

| Page | Status |
|---|---|
| `users` | ✅ Wired |
| `clients` | ✅ Wired (full CRUD — confirmed POST/PATCH/DELETE) |
| `inventory` | ✅ Wired (full CRUD — confirmed POST/PATCH/DELETE) |
| `settings` | ✅ Wired (PATCH confirmed) |
| `maintenance` | ✅ Wired (CRUD works), but UI is not fully responsive on smaller screens |
| `quotations` | ✅ Wired (full CRUD — confirmed POST/PATCH/DELETE) |
| `attendance` | ✅ Wired (read-only recap — this is expected, not a gap) |
| `index` (dashboard) | ✅ Wired (read-only summary — expected, not a gap) |
| `invoices` | ⚠️ Read/Delete/partial-Update wired — **no Create form** (see Critical Bugs above; blocked upstream by the Projects gap) |
| `projects` | ⚠️ Export-only (PDF) — **no Create/Update/Delete**, and the backend would reject creation even via direct API call (see `project.code` bug above) |
| `reports` | ⚠️ Export-only — no data view/CRUD |

**Open question from QA that needs a product decision, not just code:** for `reports` and general invoice-generation flow — is export/view-only intended for reports, and should Invoices ever be auto-generated from an approved Quotation/Project, or is everything meant to be entered manually per page? This needs to be settled before building the remaining forms, so the interaction model matches how the business actually works.

### 🟢 Supervisor role — fully wired

All pages (`index`, `projects`, `assignments`/`technicians`, `documentation`, `inventory`, `maintenance`, `attendance`, `daily-report`) are wired to `/api/supervisor/*`, including confirmed write actions. Also verified this pass: approving/rejecting a Purchase Request has **no status guard** — an already-`approved` request can be approved (or rejected) again, silently overwriting `reviewedAt`/`reviewedBy` with no audit trail of the original decision. Low security impact (still requires the Supervisor role) but a real data-integrity gap worth closing.

### 🟢 Karyawan Teknisi role — fully wired

All 6 pages are wired to `/api/technical/*`, including confirmed write actions (task status update, task photo upload, check-in/out, daily report submit, inventory request submit, profile + password update).

- `my-tasks` still has no notification/alert when new work is assigned — real gap, tracked under Phase 2.
- `attendance` — see the **Attendance / Absensi** section below (GPS + photo capture not implemented yet).
- Verified this pass: a task's status can be moved backward freely (`done` → `assigned`, no valid-transition guard) — same pattern as the Purchase Request issue above, low security impact but worth a consistent fix across both.

### Cross-cutting / product questions raised during QA

- **Role authorization is unclear to the tester.** Needs a short internal doc (or section in this README) laying out exactly what each role (`admin`, `superadmin`, `owner`, `supervisor`, `karyawan`) can see and do.
- **Announcement / pengumuman feature** requested — broadcast-style messages visible to multiple roles.
- **Attendance (absensi) system** — currently check-in/check-out only. Requested: GPS location + photo capture per check-in/check-out. Applies to Admin/Supervisor/Karyawan Teknisi; **not** Owner.
- **Database schema — considered, not recommended for now.** Splitting the single `admins` table into separate tables per role was raised and reviewed. Not recommended: 5 other tables (`Attendance`, `ProjectDocumentation`, `ProjectAssignment`, `PurchaseRequest`, `DailyReport`) all FK into `admins`, and the single-table-plus-`role`-enum design is what makes the unified login possible. If role-specific fields pile up later, the recommended pattern is a **1:1 profile table** (e.g. `technician_profiles.adminId → admins.id`), not splitting identity itself.
- **HTTP client: stick with `fetch`, not axios.** Raised during this pass — no technical need to switch. The existing `adminApiFetch` wrapper in `lib/auth.ts` already centralizes auth-header injection and 401 handling across every page; migrating to axios would mean touching every already-wired page's response-handling code for no functional gain right now.

---

## Roadmap

### Phase 1 — Close remaining gaps (in priority order)

- [x] Admin login loop
- [x] Owner logout loop
- [x] CORS fallback default (`4321` → `4322`)
- [x] IDOR on Daily Report submission
- [ ] **Fix `project.code` length bug** — highest priority; unblocks Projects and, downstream, Invoices
- [ ] **Fix migration `015` syntax error** — blocks the maintenance-technician-link fix from ever applying to a fresh database
- [ ] Validate `technicianId` role on assignment creation (reject non-`karyawan` targets, return clean `400` for a non-existent ID)
- [ ] Harden `uploadStorage.js` — verify actual file content (magic bytes), restrict stored extension to a fixed image whitelist
- [ ] Build Projects Create/Update/Delete form (Owner UI first)
- [ ] Build Invoices Create form (Owner UI), once Projects work
- [ ] Add a status guard to Purchase Request review and Task status update (reject/flag re-approving or backward transitions)
- [x] Owner `maintenance` — responsive/mobile layout pass
- [x] Frontend polish pass on Supervisor & Karyawan Teknisi pages

### Phase 2 — Backend / feature work

- [ ] Notification system (bell icon currently non-functional on every role) — decide push vs polling, then wire icon + notification center
- [ ] Task-assignment notifications for Karyawan Teknisi (`my-tasks`)
- [ ] Announcement / pengumuman module
- [ ] Attendance upgrade: GPS + photo capture, scoped to Admin/Supervisor/Karyawan Teknisi
- [ ] Written RBAC reference (`docs/roles.md` or a README table)
- [ ] Automated tests
- [ ] Full manual end-to-end re-test across all five roles once the above is done

---

## Tech Status (backend)

### Completed — Backend

Core/shared modules (`backend/src/modules/`):
- Admin Authentication (login, session check, superadmin-guarded admin management)
- Clients, Projects, Quotations, Invoices, Maintenance, Inventory, Reports
- Attendance, Daily Reports, Project Assignments, Project Documentation, Purchase Requests

Role-scoped route groups, all mounted and reachable:
- `modules-owner/` → `/api/owner/*`
- `modules-supervisor/` → `/api/supervisor/*` — all 9 sub-modules, now consumed by the frontend
- `modules-technical/` → `/api/technical/*` — all 6 sub-modules, now consumed by the frontend, self-scoped to the logged-in technician

Also implemented:
- Sequelize ORM, password hashing with bcrypt
- JWT-based authentication — reviewed again this pass with live attack testing: token expiry is correctly enforced even with a validly-signed-but-expired token; signature tampering, `alg: none`, and mixed payload/signature tokens are all correctly rejected
- Single-table identity model (`admins`, `role` enum) — reviewed against a request to split it per role; **kept as-is**, see schema note above
- Route-level role guards (`requireRole`) verified against every frontend call this pass — no cross-role leakage found (Karyawan/Supervisor/Owner endpoints correctly reject each other with `403`)
- SQL injection: safe — zero raw `sequelize.query()` usage in application logic (only in migrations); login and search inputs verified live with injection payloads, correctly parameterized
- Stored XSS: safe — verified a `<script>` payload in a client name is escaped on render via `escapeHtml()`
- User enumeration: safe — login returns an identical error for "wrong password" and "username doesn't exist"
- Helmet, CORS (see fallback bug above, now fixed), global + login-specific rate limiting (verified live — kicks in after repeated failed attempts), global error handling
- Working `sequelize-cli` setup (`.sequelizerc` + `config/config.js`) and a migration chain (currently broken at `015` — see Critical Bugs above)
- File upload utility (`utils/uploadStorage.js`) — see the content-validation gap noted above
- Input validation in several modules (Clients, Invoices, Admin Auth); weak-password rejection (minimum 6 characters) confirmed enforced server-side, not just in the UI

### Completed — Frontend

**Legacy Admin UI** (`dashboard/src/pages/*.astro`): wired to the backend API; the login-loop bug that used to block this role is now fixed.

Role-based login redirect and client-side layout guards (`OwnerLayout`, `SupervisorLayout`, `EmployeeLayout`) are in place for all roles.

**Owner, Supervisor, and Karyawan Teknisi are now largely wired** — see **Manual QA Findings** above for exact per-page status.

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

> ⚠️ `npm run db:migrate` currently fails partway through on a fresh database due to the syntax error in migration `015` (see Critical Bugs above). Fix that file before running migrations end to end.

Update the `.env` file with your database credentials and a secure `JWT_SECRET` (generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Double-check `CORS_ORIGIN` matches the dashboard's dev port (`4322` by default).

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
├── modules/             # Core/shared modules (reused across roles), fully wired
├── modules-owner/        # Owner-role routes, backend complete
├── modules-supervisor/   # Supervisor-role routes, backend complete
├── modules-technical/    # Karyawan Teknisi-role routes, backend complete
├── middleware/
├── config/
├── migrations/           # currently broken at 015 — see Critical Bugs
├── utils/
└── scripts/

dashboard/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   └── pages/
│       ├── *.astro              # legacy Admin UI — wired
│       ├── owner/                # mostly wired, see QA table above for exact gaps
│       ├── supervisor/           # wired, needs UX/edge-case pass
│       └── employee-technical/   # wired, needs UX/edge-case pass
```

---

## Notes

This project is still under active development. The repository reflects the current implementation and development progress, including known bugs and gaps found during manual QA and a deep backend security/logic testing pass. Some features are incomplete and will be improved gradually before being used in a production environment.

---

## Author

Developed by **ByFakhriel**
