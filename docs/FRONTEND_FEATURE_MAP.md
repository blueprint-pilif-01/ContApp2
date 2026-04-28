# Frontend Feature Map

For each module, the page that owns the surface and the endpoints it consumes
in mock right now. The backend developer can use this as a checklist while
implementing the matching APIs in `docs/BACKEND_API.md`.

## Shell

- `frontend/src/app/shell/AppShell.tsx`
- `frontend/src/app/shell/Sidebar.tsx`
- `frontend/src/app/shell/Topbar.tsx`
- `frontend/src/app/shell/CommandPalette.tsx`

## Dashboard

- Page: `frontend/src/app/pages/DashboardPage.tsx`
- Endpoints: `GET /dashboard/overview`

## Clients

- Page: `frontend/src/app/pages/clients/ClientsPage.tsx`
- Endpoints: `GET /clients`, `POST /clients`

## Contracts

- Templates: `frontend/src/app/pages/contracts/TemplatesPage.tsx`
  - `GET /contracts/templates`, `POST /contracts/templates`
- Editor: `frontend/src/app/pages/contracts/TemplateEditorPage.tsx`
  - `GET /contracts/templates/:id`, `PUT /contracts/templates/:id`
- Invites: `frontend/src/app/pages/contracts/InvitesPage.tsx`
  - `GET /contracts/invites`, `POST /contracts/invites`
- Submissions: `frontend/src/app/pages/contracts/SubmissionsPage.tsx`
  - `GET /contracts/submissions`, `POST /contracts/submissions`
- Public sign: `frontend/src/public/SignPage.tsx`, `frontend/src/public/SignSuccessPage.tsx`
  - `GET /public/sign/:token`, `POST /public/sign/:token`

## Ticketing

- Page: `frontend/src/app/pages/ticketing/TicketingPage.tsx`
- Endpoints:
  - `GET /ticketing/tasks`
  - `POST /ticketing/tasks`
  - `PUT /ticketing/tasks/:id`
  - `POST /ticketing/tasks/:id/claim`
  - `POST /ticketing/tasks/:id/complete`
  - `POST /ticketing/tasks/:id/refuse`

## Chat + AI bot

- Page: `frontend/src/app/pages/chat/ChatPage.tsx`
- Endpoints:
  - `GET /chat/conversations`
  - `GET /chat/conversations/:id/messages`
  - `POST /chat/conversations/:id/messages`
  - `POST /chat/derive-task`
- AI streaming utilities: `frontend/src/lib/mockAI.ts`
- AI components used: everything under `frontend/src/components/ai/`

## Calendar

- Page: `frontend/src/app/pages/calendar/CalendarPage.tsx`
- Endpoints: `GET /planner/events`

## Planner Smart

- Page: `frontend/src/app/pages/planner/PlannerSmartPage.tsx`
- Endpoints: `GET /planner/smart`

## Notes

- Pages:
  - `frontend/src/app/pages/notes/NotesPage.tsx`
  - `frontend/src/app/pages/notes/WorkspaceNotesPage.tsx`
- Database table: `workspace_notes`
- Endpoints:
  - `GET /notes`
  - `POST /notes`
  - `GET /notes/:id`
  - `PUT /notes/:id`
  - `DELETE /notes/:id`

Use `visibility = personal | shared` instead of separate personal/shared note
tables.

## Notebook

- Page: `frontend/src/app/pages/notebook/NotebookPage.tsx`
- Endpoints:
  - `GET /notebook/documents`
  - `POST /notebook/documents`
  - `PUT /notebook/documents/:id`

## HR

- Page: `frontend/src/app/pages/hr/HrPage.tsx`
- Endpoints:
  - `GET/POST /hr/hours`
  - `GET/POST /hr/leaves`
  - `GET/POST /hr/reviews`
  - `POST /hr/certificates`

## Legislation

- Page: `frontend/src/app/pages/legislation/LegislationPage.tsx`
- Endpoints:
  - `GET /legislation/updates`
  - `GET /legislation/preferences`
  - `PUT /legislation/preferences`
  - `POST /ai/summarize`
  - `POST /ai/topic-digest`

## Settings

- Account/billing: `frontend/src/app/pages/settings/SettingsPage.tsx`
- Users + Roles + Permissions: `frontend/src/app/pages/settings/UsersRolesPage.tsx`
  - `GET/POST /settings/users`, `PUT /settings/users/:id`
  - `GET/POST /settings/roles`, `PUT /settings/roles/:id`

## Dev / Kitchen sink

- AI components preview: `frontend/src/app/pages/dev/AiKitchenSinkPage.tsx` at `/app/_kitchen-sink`
