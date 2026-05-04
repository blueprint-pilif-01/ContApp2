# Backend Misalignments Review

Date: 2026-05-02

This review compares the current backend code against the project docs and
current frontend expectations. Backend compilation currently passes with
`make test-backend`, but the suite has no real backend test coverage yet.

## Highest Risk

### Organisation isolation is weak at relationship boundaries

Many tables carry `organisation_id`, but related IDs are plain foreign keys
instead of organisation-scoped relationships.

Examples:

- `contract_invites.organisation_id` can point to one organisation while
  `template_id` or `client_id` points to another.
- `contract_submissions` can reference an invite/template/client combination
  that is not enforced as belonging to the same organisation.
- Document, signature, ticket, note, and planner relationships have similar
  risks when handlers accept related IDs directly.

Relevant files:

- `backend/migrations/00001_initial_schema.sql`
- `backend/internal/repository/dbrepo/postgres/contracts_repo.go`
- `backend/internal/repository/dbrepo/postgres/ticketing_repo.go`

Recommended direction:

- Add service/repository validation before inserts and updates.
- Consider composite unique keys and composite foreign keys where appropriate,
  such as `(organisation_id, id)` references.
- Add tests for cross-organisation reference rejection.

### Public signing tokens are stored and exposed as raw tokens

The architecture says public signing tokens should be stored only as hashes.
Current code stores the raw token in `contract_invites.token_hash` and returns
it as `public_token`.

Relevant files:

- `backend/internal/app/contracts_handlers.go`
- `backend/internal/app/contract_signing_handlers.go`
- `backend/migrations/00001_initial_schema.sql`

Recommended direction:

- Generate a raw public token once.
- Store only a hash in the database.
- Return the raw token only at creation/send time.
- Resolve public sign requests by hashing the provided token and comparing
  against the stored hash.

### Admin and user refresh sessions still conflict

Account/admin access cookies and refresh cookies are now split. Admin login and
workspace login can coexist in the same browser profile without sharing the same
refresh cookie.

Relevant files:

- `backend/internal/app/auth_handlers.go`
- `backend/.env.example`
- `docs/possible_issues.txt`
- `docs/platform_admin_todo.md`

Remaining direction:

- Add scoped platform-admin permissions for `/admin/*`.
- Add audit coverage for platform-admin write actions and impersonation.
- Keep customer-private data behind explicit elevated support scopes.

## Frontend And API Drift

### Missing workspace extension update endpoint

Frontend settings expects:

- `PUT /organisations/me/extensions`

Backend currently exposes only:

- `GET /organisations/me/extensions`
- admin-level extension updates

Relevant files:

- `backend/internal/app/routes.go`
- `backend/internal/app/current_organisation_handlers.go`
- `frontend/src/hooks/useExtensions.ts`

Decision needed:

- Either add a dev-only/self-service toggle endpoint, or remove the frontend
  workspace toggle and require admin management only.

### Missing admin console endpoints

Frontend admin pages expect endpoints that are not mounted in backend routes:

- `GET /admin/subscription-plans`
- `POST /admin/subscription-plans`
- `PUT /admin/subscription-plans/:id`
- `DELETE /admin/subscription-plans/:id`
- `GET /admin/billing`
- `GET /admin/billing/events`
- `GET /admin/files`
- `GET /admin/contracts`
- `GET /admin/notifications`
- `POST /admin/notifications/broadcast`
- `GET /admin/jobs`
- `POST /admin/jobs/:name/trigger`
- `GET /admin/audit`

Relevant files:

- `backend/internal/app/routes.go`
- `frontend/src/app/admin/pages/`
- `docs/FRONTEND_FEATURE_MAP.md`

Recommended direction:

- Add placeholder/read-only backend endpoints for the admin pages that already
  exist in the frontend.
- Or hide/remove admin pages until backend support exists.

### Missing user-facing feature endpoints

Frontend or docs reference these endpoints, but backend does not expose them:

- `GET /legislation/updates`
- `GET /legislation/preferences`
- `PUT /legislation/preferences`
- `POST /ai/summarize`
- `POST /ai/topic-digest`
- `GET /portal/:token/overview`
- `GET /signatures`
- `POST /signatures`
- `DELETE /signatures/:id`
- `POST /contracts/template-fields`
- `GET /contracts/template-fields/:id`
- `DELETE /contracts/template-fields/:id`

Relevant files:

- `backend/internal/app/routes.go`
- `frontend/src/app/pages/legislation/LegislationPage.tsx`
- `frontend/src/lib/ai.ts`
- `frontend/src/public/ClientPortalPage.tsx`
- `frontend/src/hooks/useSignatures.ts`
- `frontend/src/hooks/useTemplateFields.ts`
- `docs/template_editor_deviation.md`

Recommended direction:

- Decide which are demo-critical.
- Add compatibility endpoints only where the frontend still depends on them.
- For template fields, keep the adapter mapping to
  `contract_templates.content_json`; do not add a real `template_fields` table.

### Chat derive-ticket is not gated on AI Assistant

Docs describe `POST /chat/derive-ticket` as AI-related, but backend gates it on
Internal Chat and Ticketing only.

Relevant file:

- `backend/internal/app/routes.go`

Recommended direction:

- Add an AI Assistant feature definition and route guard if this endpoint is
  considered AI-powered.
- Otherwise update docs/frontend copy to say it is deterministic/non-AI.

### Ticket list filters are ignored

Docs and frontend map mention:

- `GET /ticketing/tickets?status=`
- `GET /ticketing/tickets?assignee_id=`
- `GET /ticketing/tickets?client_id=`

Backend currently lists all tickets for the organisation and ignores query
filters.

Relevant files:

- `backend/internal/app/ticketing_handlers.go`
- `backend/internal/repository/dbrepo/postgres/ticketing_repo.go`

Recommended direction:

- Add a filter struct at handler/repository level.
- Apply status, assignee, and client filters in SQL.

## Architecture Drift

### Notebook table exists but is not used

The schema contains `notebook_documents`, but notebook handlers read and write
`workspace_notes`.

Relevant files:

- `backend/migrations/00001_initial_schema.sql`
- `backend/internal/app/workspace_handlers.go`

Decision needed:

- If Notebook is intentionally backed by `workspace_notes`, remove or defer the
  `notebook_documents` table.
- If Notebook should be separate, implement repository/handlers against
  `notebook_documents`.

### Error response shape differs from API docs

Docs specify:

```json
{
  "error": true,
  "message": "human-readable error",
  "code": "optional_machine_code"
}
```

Backend currently returns:

```json
{
  "error": "message"
}
```

Relevant files:

- `backend/internal/platform/httpx/json.go`
- `docs/BACKEND_API.md`

Recommended direction:

- Update `httpx.Error` to match the documented shape.
- Confirm frontend error parsing still works.

### `GET /auth/me` returns raw JWT claims

The API docs describe `/auth/me` as the current actor profile with
organisation, roles, permissions, and enabled features. Backend currently
returns raw token claims.

Relevant files:

- `backend/internal/app/auth_handlers.go`
- `docs/BACKEND_API.md`

Recommended direction:

- Return a normalized account/admin profile.
- For account tokens, include active organisation, membership, roles,
  permissions, and enabled extensions.

## Verification

Command run:

```bash
make test-backend
```

Result:

- Passed.
- Packages report `[no test files]`, so this only confirms compilation.
