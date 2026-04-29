# Frontend Feature Map

For each module, the page that owns the surface and the endpoints it consumes
in mock right now. The backend developer can use this as a checklist while
implementing the matching APIs in `docs/BACKEND_API.md`.

## Public marketing site

- Landing: `frontend/src/App.tsx` mounted at `/`.
- Components live at `frontend/components/*` (Header, Hero, BlurInHeadline,
  Problem, FeaturesBento, Stats, HowItWorks, Pricing, FAQ, Footer, Theme
  switch, etc.). Smooth scrolling via `lenis` + reduced-motion provider in
  `frontend/lib/motion.tsx`.
- Header CTAs link to `/login` (`User` icon) and `/auth/register` (the latter
  currently shows a `FeatureMissing` placeholder until backend exposes a
  public registration endpoint).

## Auth + public sign

- `frontend/src/app/auth/LoginPage.tsx` — user login (`POST /auth/user/login`).
- `frontend/src/app/auth/RegisterPage.tsx` — placeholder until backend ready.
- `frontend/src/app/auth/AdminLoginPage.tsx` — admin console login at
  `/admin/login` (`POST /auth/admin/login`).
- `frontend/src/public/SignPage.tsx` + `SignSuccessPage.tsx` — public contract
  signing flow (`GET/POST /public/sign/:token`).
- `frontend/src/public/ClientPortalPage.tsx` — public token-based client
  portal (`GET /portal/:token/overview`).

## Shell

- `frontend/src/app/shell/AppShell.tsx`
- `frontend/src/app/shell/Sidebar.tsx` (renders `ExtensionLock` for inactive extensions)
- `frontend/src/app/shell/Topbar.tsx`
- `frontend/src/app/shell/CommandPalette.tsx`

## Extension gating (cross-cutting)

- Registry: `frontend/src/lib/extensions.ts`
- Hook: `frontend/src/hooks/useExtensions.ts`
- Page wrapper: `frontend/src/components/ui/RequireExtension.tsx`
- Sidebar lock: `frontend/src/components/ui/ExtensionLock.tsx`
- Endpoints:
  - `GET /organisations/me/extensions`
  - `PUT /organisations/me/extensions` (body: `{ key, enabled }`)
  - `GET /organisations/me/subscription`

Extension keys: `contracts_pro`, `ticketing_pro`, `hr_pro`, `internal_chat`,
`legislation_monitor`, `ai_assistant`, `multi_site_teams`.

## Dashboard

- Page: `frontend/src/app/pages/DashboardPage.tsx`
- Endpoints: `GET /dashboard/overview`

## Clients (Contracts Pro)

- Page: `frontend/src/app/pages/clients/ClientsPage.tsx`
  - Supports both `client_type = "person"` (first/last name + CNP) and
    `client_type = "company"` (company_name + CUI). The list and detail
    pages render the appropriate label.
- Detail: `frontend/src/app/pages/clients/ClientDetailPage.tsx` (tabs: Contracts, Dossier, Notes, **Tickets**, Activity)
- Endpoints: `GET /clients`, `POST /clients`

## Contracts (Contracts Pro)

- Templates: `frontend/src/app/pages/contracts/TemplatesPage.tsx`
  - `GET /contracts/templates`, `POST /contracts/templates`
- Editor: `frontend/src/app/pages/contracts/TemplateEditorPage.tsx`
  - `GET /contracts/templates/:id`, `POST /contracts/template-fields`
- Invites: `frontend/src/app/pages/contracts/InvitesPage.tsx`
  - `GET /contracts/invites`, `POST /contracts/invites`
- Submissions: `frontend/src/app/pages/contracts/SubmissionsPage.tsx`
  - `GET /contracts/submissions`, `POST /contracts/submissions`
- Public sign: `frontend/src/public/SignPage.tsx`, `frontend/src/public/SignSuccessPage.tsx`
  - `GET /public/sign/:token`, `POST /public/sign/:token`

## Ticketing (Ticketing Pro)

- Page: `frontend/src/app/pages/ticketing/TicketingPage.tsx`
- Endpoints (renamed from `/ticketing/tasks*`):
  - `GET /ticketing/tickets` (supports `?status=`, `?assignee_id=`, `?client_id=`)
  - `POST /ticketing/tickets`
  - `PUT /ticketing/tickets/:id`
  - `POST /ticketing/tickets/:id/claim`
  - `POST /ticketing/tickets/:id/complete`
  - `POST /ticketing/tickets/:id/refuse`
- Per-client view: `frontend/src/app/pages/clients/tabs/TicketsTab.tsx` (uses `?client_id=`).

## Chat + AI bot (Internal Chat / AI Assistant)

- Page: `frontend/src/app/pages/chat/ChatPage.tsx`
- Endpoints:
  - `GET /chat/conversations`
  - `GET /chat/conversations/:id/messages`
  - `POST /chat/conversations/:id/messages`
  - `POST /chat/derive-ticket` (renamed from `/chat/derive-task`) — gated on `ai_assistant`
- AI streaming utilities: `frontend/src/lib/mockAI.ts` (exports `deriveTicket`; legacy alias `deriveTask`)
- AI components used: everything under `frontend/src/components/ai/`

## Calendar

- Page: `frontend/src/app/pages/calendar/CalendarPage.tsx`
- Endpoints: `GET /planner/events`

## Planner Smart (AI Assistant)

- Page: `frontend/src/app/pages/planner/PlannerSmartPage.tsx`
- Endpoints: `GET /planner/smart`, `GET /ticketing/tickets`, `GET /planner/events`, `GET /contracts/invites`

## Notebook (free base)

- Page: `frontend/src/app/pages/notebook/NotebookPage.tsx`
- Replaces the old separate `NotesPage` / `WorkspaceNotesPage`. Switch via `?view=private|shared`.
- Legacy redirects (in `frontend/src/router.tsx`): `/app/notes`, `/app/workspace-notes`, `/app/tasks` → ticketing.
- Endpoints:
  - `GET /notebook/documents`
  - `POST /notebook/documents`
  - `PUT /notebook/documents/:id`
  - `GET /workspace/notes`, `POST /workspace/notes`, `PUT /workspace/notes/:id`

## HR (HR Pro)

- Page: `frontend/src/app/pages/hr/HrPage.tsx`
- Endpoints:
  - `GET/POST /hr/hours`
  - `GET/POST /hr/leaves`
  - `GET/POST /hr/reviews`
  - `POST /hr/certificates`

## Legislation (Legislation Monitor + optional AI)

- Page: `frontend/src/app/pages/legislation/LegislationPage.tsx`
- Endpoints:
  - `GET /legislation/updates`
  - `GET /legislation/preferences`
  - `PUT /legislation/preferences`
  - `POST /ai/summarize` (gated on `ai_assistant`)
  - `POST /ai/topic-digest` (gated on `ai_assistant`)

## Settings

- Account/security/subscription: `frontend/src/app/pages/settings/SettingsPage.tsx`
  - Subscription tab includes a dev-mode toggle for each extension via
    `PUT /organisations/me/extensions`.
- Users + Roles + Permissions + Employee Categories:
  `frontend/src/app/pages/settings/UsersRolesPage.tsx`
  - `GET/POST /settings/users`, `PUT /settings/users/:id`
  - `GET/POST /settings/roles`, `PUT /settings/roles/:id`
  - `GET/POST /settings/employee-categories`,
    `PUT/DELETE /settings/employee-categories/:id`

## Admin Console (Phase 13)

Mounted at `/admin/*`, guarded by `frontend/src/app/admin/RequireAdmin.tsx`.

- Login: `frontend/src/app/auth/AdminLoginPage.tsx` → `POST /auth/admin/login`
- Shell: `frontend/src/app/admin/AdminShell.tsx`
- Sidebar: `frontend/src/app/admin/AdminSidebar.tsx` (grouped: Conturi & acces,
  Monetizare, Operațional)
- Pages (all under `frontend/src/app/admin/pages/`):
  - `AdminDashboardPage.tsx` — `GET /admin/dashboard` + grouped quick-link
    cards across modules.
  - `OrganisationsPage.tsx` — full CRUD: `GET/POST /admin/organisations`,
    `PUT/DELETE /admin/organisations/:id`,
    `POST /admin/organisations/:id/{suspend,restore}`. Drawer-based create +
    edit form (name/slug/cui/address/contact_email/plan/status/employees/country).
  - `AdminUsersPage.tsx` — full CRUD: `GET/POST /admin/users`,
    `PUT/DELETE /admin/users/:id`, `POST /admin/users/:id/impersonate`.
    Drawer create with first/last name + email + password + type + status +
    organisation picker.
  - `ExtensionsPage.tsx` — `GET/PUT /admin/organisations/:id/extensions`
    (per-org extension toggle matrix).
  - `AdminPlansPage.tsx` — `GET/POST /admin/subscription-plans`,
    `PUT/DELETE /admin/subscription-plans/:id`. Visual editor with per-plan
    limits (users / clients / templates / signings / storage) and extension
    feature picker.
  - `AdminBillingPage.tsx` — `GET /admin/billing`, `GET /admin/billing/events`
  - `AdminFilesPage.tsx` — `GET /admin/files`
  - `AdminContractsPage.tsx` — `GET /admin/contracts`
  - `AdminNotificationsPage.tsx` — `GET /admin/notifications`, `POST /admin/notifications/broadcast`
  - `AdminJobsPage.tsx` — `GET /admin/jobs`, `POST /admin/jobs/:name/trigger`
  - `AdminAuditPage.tsx` — `GET /admin/audit`

## Dev / Kitchen sink

- AI components preview: `frontend/src/app/pages/dev/AiKitchenSinkPage.tsx` at `/app/_kitchen-sink`

## Smoke tests

- Folder: `frontend/tests/smoke/`
- Files:
  - `ticketing.test.ts` — lifecycle for `/ticketing/tickets`
  - `chatDeriveTicket.test.ts` — `/chat/derive-ticket` flow
  - `extensions.test.ts` — toggle persistence for `/organisations/me/extensions`
  - `admin.test.ts` — admin dashboard / suspend / extension toggle / job trigger
