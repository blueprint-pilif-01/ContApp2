# ContApp Backend API Contract

!!! did not double check might be rushed/wrong

This document is the source of truth for every endpoint the polished frontend
calls. The backend developer can implement these in any stack (Go, Node, etc.)
as long as the contracts match. The frontend currently runs entirely on the
mock layer in `frontend/src/lib/mock/`.

## Origin tags

- `[B]` borrowed/adapted from `D:/JSprojects/bisericavertical`
- `[E]` previously existed in the ContApp contract surface
- `[N]` new for this rework

## Feature coverage matrix

| Feature                           | Coverage notes                                   |
| --------------------------------- | ------------------------------------------------ |
| Gestionare contracte              | Existing ContApp surface + new list & public flow |
| Ticketing System                  | Borrowed from BV `social_media_tasks`, renamed to `/ticketing/tickets` `[B]` `[N]` |
| Internal Communication (chat)     | Borrowed from BV `messaging` `[B]`                |
| Chat bot derive ticket            | New on top of chat — `/chat/derive-ticket` `[N]`  |
| Users + Roles + Permissions       | Borrowed from BV `users` + `permissions` `[B]`    |
| HR (pontaj/concedii/review/cert.) | New `[N]`                                         |
| Notebook (long form docs)         | New `[N]`                                         |
| Personal/Shared notes             | New `[N]` + legacy `/notes` compatibility `[E]`   |
| Calendar / Planner                | New `[N]`                                         |
| Planner Smart (AI plan)           | New `[N]`                                         |
| Legislation news + AI             | New `[N]`                                         |
| Extension activation              | `/organisations/me/extensions` + admin toggles `[N]` |
| Admin console                     | Full CRUD under `/admin/*` (orgs, users, plans, jobs, audit) `[N]` |
| Subscription plans editor         | `/admin/subscription-plans` with limits + features `[N]` |
| Employee categories               | `/settings/employee-categories` (HR labels) `[N]`  |
| Public landing                    | Static React landing at `/` `[N]`                  |

## Auth

| Method | Path                  | Purpose            | Origin |
| ------ | --------------------- | ------------------ | ------ |
| POST   | `/auth/user/login`    | user login         | `[E]`  |
| POST   | `/auth/admin/login`   | admin login compat | `[E]`  |
| GET    | `/auth/refresh-token` | refresh access     | `[E]`  |
| POST   | `/auth/logout`        | end session        | `[E]`  |

Login response shape:

```json
{
  "token": { "access_token": "...", "refresh_token": "..." },
  "user": { "id": 1, "email": "...", "first_name": "...", "permissions": [] }
}
```

Admin login response shape:

```json
{
  "token": { "access_token": "...", "refresh_token": "..." },
  "admin": { "id": 1, "email": "...", "first_name": "...", "permissions": ["*"] }
}
```

## Dashboard

| Method | Path                  | Purpose                                | Origin |
| ------ | --------------------- | -------------------------------------- | ------ |
| GET    | `/dashboard/overview` | KPIs + recent activity + upcoming list | `[N]`  |
| GET    | `/health`             | app/mock health probe                  | `[N]`  |

Response shape:

```json
{
  "kpis": {
    "clients": 0,
    "clients_new_this_month": 0,
    "invites_active": 0,
    "invites_expiring_soon": 0,
    "submissions_total": 0,
    "submissions_this_month": 0,
    "tasks_open": 0,
    "tasks_overdue": 0,
    "tasks_due_today": 0
  },
  "contract_pipeline": {
    "draft": 0,
    "sent": 0,
    "viewed": 0,
    "signed": 0,
    "expired": 0
  },
  "urgent_items": [
    { "id": "exp-inv-1", "type": "expiring_invite", "title": "...", "detail": "...", "due": "ISO", "link": "/app/contracts/invites" }
  ],
  "recent_activity": [
    { "id": "submission-1", "label": "...", "at": "ISO", "type": "submission", "actor": "..." }
  ],
  "upcoming": [
    { "id": 1, "title": "...", "date": "ISO", "date_end": "ISO", "category": "contract" }
  ],
  "team_workload": [
    { "id": 1, "name": "...", "open": 0, "in_progress": 0, "done_this_week": 0 }
  ],
  "plan_usage": {
    "plan": "Growth",
    "templates": { "used": 0, "limit": 0 },
    "signings": { "used": 0, "limit": 0 },
    "clients": { "used": 0, "limit": 0 },
    "storage_mb": { "used": 0, "limit": 0 }
  }
}
```

## Clients

| Method | Path           | Purpose       | Origin |
| ------ | -------------- | ------------- | ------ |
| GET    | `/clients`     | list + search | `[N]`  |
| POST   | `/clients`     | create        | `[E]`  |
| GET    | `/clients/:id` | read          | `[E]`  |
| PUT    | `/clients/:id` | update        | `[E]`  |
| DELETE | `/clients/:id` | delete        | `[E]`  |

`GET` accepts `?q=` for free-text search.

Per the architecture (Sec.3 of `full_desc.txt` and the DBML), there is a
single `clients` table with `client_type ∈ "person" | "company"`. The frontend
form switches between two layouts:

- `client_type = "person"` → `first_name`, `last_name`, `cnp` (CNP)
- `client_type = "company"` → `company_name`, `cnp` (used as the CUI)

Both shapes share `email`, `phone`, `address`, `status`, `organisation_id`,
`signature_id`. Clients are gated on the `contracts_pro` extension.

## Contracts

### Templates / Fields / Invites / Submissions

| Method | Path                                | Purpose                  | Origin |
| ------ | ----------------------------------- | ------------------------ | ------ |
| GET    | `/contracts/templates`              | list templates           | `[N]`  |
| POST   | `/contracts/templates`              | create template          | `[E]`  |
| GET    | `/contracts/templates/:id`          | read template            | `[E]`  |
| PUT    | `/contracts/templates/:id`          | update template          | `[E]`  |
| DELETE | `/contracts/templates/:id`          | delete template          | `[E]`  |
| GET    | `/contracts/template-fields`        | list field snapshots     | `[N]`  |
| POST   | `/contracts/template-fields`        | save Tiptap snapshot     | `[E]`  |
| GET    | `/contracts/template-fields/:id`    | read snapshot            | `[E]`  |
| PUT    | `/contracts/template-fields/:id`    | update snapshot          | `[E]`  |
| DELETE | `/contracts/template-fields/:id`    | delete snapshot          | `[E]`  |
| GET    | `/contracts/invites`                | pipeline list            | `[N]`  |
| POST   | `/contracts/invites`                | create invite            | `[E]`  |
| GET    | `/contracts/invites/:id`            | read invite              | `[E]`  |
| PUT    | `/contracts/invites/:id`            | update invite            | `[E]`  |
| POST   | `/contracts/invites/:id/send`       | send/re-send invite      | `[N]`  |
| DELETE | `/contracts/invites/:id`            | delete invite            | `[E]`  |
| GET    | `/contracts/submissions`            | list submissions         | `[N]`  |
| POST   | `/contracts/submissions`            | create submission        | `[E]`  |
| GET    | `/contracts/submissions/:id`        | read submission          | `[E]`  |
| PUT    | `/contracts/submissions/:id`        | update submission        | `[E]`  |
| DELETE | `/contracts/submissions/:id`        | delete submission        | `[E]`  |

Submission shape (extended):

```json
{
  "id": 0, "invite_id": 0, "client_id": 0, "user_id": 0,
  "status": "signed",
  "filled_fields":   { "f_name": "Diana Pop", "f_cui": "RO12345678" },
  "signature_image": "data:image/png;base64,...",
  "signed_at":       "ISO",
  "pdf_file_id": 0, "remarks": "", "expiration_date": "ISO",
  "date_added": "ISO", "date_modified": "ISO"
}
```
| GET    | `/contracts/submissions/:id/pdf`       | final PDF download       | `[N]`  |
| GET    | `/contracts/submissions/:id/signature` | client signature PNG     | `[N]`  |

### Public sign flow (no auth)

| Method | Path                  | Purpose                                | Origin |
| ------ | --------------------- | -------------------------------------- | ------ |
| GET    | `/public/sign/:token` | resolve invite → template + fields     | `[N]`  |
| POST   | `/public/sign/:token` | submit filled fields + signature image | `[N]`  |

`GET` response shape:

```json
{
  "invite":   { "id": 0, "public_token": "...", "status": "viewed", "expiration_date": "ISO", "remarks": "" },
  "template": { "id": 0, "name": "...", "contract_type": "..." },
  "content":  { "type": "doc", "content": [/* Tiptap JSON with fieldNode atoms */] },
  "client_hint": { "first_name": "...", "last_name": "...", "email": "..." }
}
```

The frontend extracts `fieldNode` atoms from `content` to render the dynamic
form. Each atom carries `{ id, label, fieldType, required }` where
`fieldType ∈ "text" | "date" | "number" | "signature" | "signature_accountant"`.
Reading the link **side-effects** the invite from `sent`/`draft` → `viewed`,
and 410s if the invite is already `expired` or `revoked`.

`POST` body:

```json
{
  "filled_fields":   { "<field_id>": "value", ... },
  "signature_image": "data:image/png;base64,iVBORw0KGgo...",
  "accepted_at":     "ISO"
}
```

`signature_image` is required when the template contains at least one
`signature` / `signature_accountant` field. On success the server creates
a `submission` (status `signed`, persists `filled_fields` + `signature_image`),
flips the invite to `signed`, and returns:

```json
{ "message": "Contract semnat.", "submission_id": 0, "contract_number": "C-00601" }
```

`GET /contracts/submissions/:id/signature` returns the raw PNG with
`Content-Type: image/png` (auth required); used by the contract owner from
the SubmissionsPage drawer.

Invite status lifecycle: `draft → sent → viewed → signed`, with `expired`
and `revoked` terminal.

## Ticketing System

> **Renamed:** the public surface is `/ticketing/tickets*`. The previous name
> `/ticketing/tasks*` is retired — frontend no longer calls it.

| Method | Path                                  | Purpose                | Origin |
| ------ | ------------------------------------- | ---------------------- | ------ |
| GET    | `/ticketing/tickets`                  | list with filters      | `[B]`  |
| POST   | `/ticketing/tickets`                  | create                 | `[B]`  |
| PUT    | `/ticketing/tickets/:id`              | update fields/status   | `[B]`  |
| POST   | `/ticketing/tickets/:id/claim`        | claim/assign self      | `[B]`  |
| POST   | `/ticketing/tickets/:id/complete`     | mark done              | `[B]`  |
| POST   | `/ticketing/tickets/:id/refuse`       | release/refuse         | `[B]`  |

`GET` accepts `?status=todo|in_progress|blocked|done`, `?assignee_id=`, and
`?client_id=` (used by the per-client tab on `ClientDetailPage`).

Status lifecycle: `todo → in_progress → done` with `blocked` as a side state.

Tickets must require the `ticketing_pro` extension to be active on the
calling organisation (see "Extensions" below).

## Chat (internal)

| Method | Path                                          | Purpose                       | Origin |
| ------ | --------------------------------------------- | ----------------------------- | ------ |
| GET    | `/chat/conversations`                         | list conversations            | `[B]`  |
| GET    | `/chat/conversations/:id/messages`            | list messages in conversation | `[B]`  |
| POST   | `/chat/conversations/:id/messages`            | send message                  | `[B]`  |
| POST   | `/chat/derive-ticket`                         | bot derives a ticket          | `[N]`  |

> **Renamed:** the bot endpoint is `/chat/derive-ticket` (was `/chat/derive-task`).
> The legacy path is no longer mocked.

Conversation types: `direct | group | client`. For the first stage chat is
internal-only between organisation memberships; the `client` conversation type
is reserved for the future external-chat extension.

Chat itself requires `internal_chat`. The `derive-ticket` endpoint additionally
requires `ai_assistant`.

The bot endpoint accepts `{ message: string }` and returns:

```json
{
  "ticket": { "id": 0, "title": "..." },
  "confirmation": "Am creat ticketul #..."
}
```

## Settings: Users, Roles, Permissions, Employee Categories

| Method | Path                                       | Purpose                | Origin |
| ------ | ------------------------------------------ | ---------------------- | ------ |
| GET    | `/settings/users`                          | list users             | `[B]`  |
| POST   | `/settings/users`                          | create user            | `[B]`  |
| GET    | `/settings/users/:id`                      | read user              | `[B]`  |
| PUT    | `/settings/users/:id`                      | update user            | `[B]`  |
| DELETE | `/settings/users/:id`                      | delete user            | `[B]`  |
| POST   | `/settings/users/:id/invite`               | send invite email      | `[N]`  |
| POST   | `/settings/users/:id/reset-password`       | trigger password reset | `[N]`  |
| GET    | `/settings/roles`                          | list roles             | `[B]`  |
| POST   | `/settings/roles`                          | create role            | `[B]`  |
| PUT    | `/settings/roles/:id`                      | update role            | `[B]`  |
| DELETE | `/settings/roles/:id`                      | delete role            | `[B]`  |
| GET    | `/settings/permissions/effective/:userId` | effective permissions  | `[B]`  |
| GET    | `/settings/employee-categories`            | list categories        | `[N]`  |
| POST   | `/settings/employee-categories`            | create category        | `[N]`  |
| PUT    | `/settings/employee-categories/:id`        | update category        | `[N]`  |
| DELETE | `/settings/employee-categories/:id`        | delete category        | `[N]`  |

Employee category body shape: `{ name, description, color }`. Categories are
labels for HR/reporting per Sec.7 of `full_desc.txt` — they do **not**
control permissions. Permissions stay role-based.

The frontend currently treats roles + permissions as a flat matrix. The
backend may keep BV's department concept internally but should expose this
flattened view to the API consumer.

## Notifications + Signatures

| Method | Path                          | Purpose                           | Origin |
| ------ | ----------------------------- | --------------------------------- | ------ |
| GET    | `/notifications`              | inbox list                        | `[N]`  |
| POST   | `/notifications/read-all`     | mark all notifications as read    | `[N]`  |
| POST   | `/notifications/:id/read`     | mark one notification as read     | `[N]`  |
| GET    | `/signatures`                 | list saved signatures             | `[N]`  |
| POST   | `/signatures`                 | create saved signature (data URL) | `[N]`  |
| DELETE | `/signatures/:id`             | delete saved signature            | `[N]`  |

## HR

| Method | Path                | Purpose                            | Origin |
| ------ | ------------------- | ---------------------------------- | ------ |
| GET    | `/hr/hours`         | list timesheet rows                | `[N]`  |
| POST   | `/hr/hours`         | record hours                       | `[N]`  |
| GET    | `/hr/leaves`        | list leave requests                | `[N]`  |
| POST   | `/hr/leaves`        | create leave request               | `[N]`  |
| GET    | `/hr/reviews`       | list employee reviews              | `[N]`  |
| POST   | `/hr/reviews`       | create review                      | `[N]`  |
| POST   | `/hr/certificates`  | request certificate                | `[N]`  |

Leave types accepted by the UI: `odihna | medical | sabatic | maternal`.
Leave statuses: `pending | approved | rejected`.

Certificate request body includes `{ type: "employee_certificate" | "income_certificate", user_id }`.

## Notebook + Notes

| Method | Path                            | Purpose                  | Origin |
| ------ | ------------------------------- | ------------------------ | ------ |
| GET    | `/notebook/documents`           | list documents           | `[N]`  |
| POST   | `/notebook/documents`           | create document          | `[N]`  |
| PUT    | `/notebook/documents/:id`       | update document          | `[N]`  |
| DELETE | `/notebook/documents/:id`       | delete document          | `[N]`  |
| GET    | `/workspace/notes`              | list shared/personal notes | `[N]` |
| POST   | `/workspace/notes`              | create note              | `[N]`  |
| PUT    | `/workspace/notes/:id`          | update note              | `[N]`  |

Note visibility values: `private | shared` for notebook, `personal | shared`
for workspace notes.

## Ops + Extensions (currently used by frontend pages)

| Method | Path                      | Purpose                                 | Origin |
| ------ | ------------------------- | --------------------------------------- | ------ |
| GET    | `/activity-log`           | activity feed list                      | `[N]`  |
| GET    | `/reports/overview`       | dashboard/report aggregates             | `[N]`  |
| GET    | `/message-templates`      | list messaging templates                | `[N]`  |
| POST   | `/message-templates`      | create template                         | `[N]`  |
| DELETE | `/message-templates/:id`  | delete template                         | `[N]`  |
| GET    | `/documents`              | list document hub items                 | `[N]`  |
| POST   | `/documents/upload`       | upload/create document                  | `[N]`  |
| POST   | `/documents/folder`       | create folder item                      | `[N]`  |
| DELETE | `/documents/:id`          | delete document/folder item             | `[N]`  |
| GET    | `/automation-rules`       | list automations                        | `[N]`  |
| POST   | `/automation-rules`       | create automation                       | `[N]`  |
| PUT    | `/automation-rules/:id`   | update automation                       | `[N]`  |
| DELETE | `/automation-rules/:id`   | delete automation                       | `[N]`  |
| GET    | `/portal/:token/overview` | public client portal overview (no auth) | `[N]`  |

## Calendar / Planner

| Method | Path               | Purpose                                          | Origin |
| ------ | ------------------ | ------------------------------------------------ | ------ |
| GET    | `/planner/events`  | unified events (contract/HR/task/personal)       | `[N]`  |
| POST   | `/planner/events`  | create personal/planner event                    | `[N]`  |
| PUT    | `/planner/events/:id` | update planner event                          | `[N]`  |
| DELETE | `/planner/events/:id` | delete planner event                          | `[N]`  |
| GET    | `/planner/smart`   | focus items for AI plan                          | `[N]`  |

Event categories accepted by the UI: `contract | hr_leave | task | personal`.

## Legislation + AI

| Method | Path                          | Purpose                          | Origin |
| ------ | ----------------------------- | -------------------------------- | ------ |
| GET    | `/legislation/updates`        | news list with `topic` + `caen` | `[N]`  |
| GET    | `/legislation/preferences`    | get user preferences             | `[N]`  |
| PUT    | `/legislation/preferences`    | save preferences                 | `[N]`  |
| POST   | `/ai/summarize`               | per-article AI summary           | `[N]`  |
| POST   | `/ai/topic-digest`            | digest across multiple updates   | `[N]`  |

The frontend uses the AI endpoints with streaming-friendly UX, but mock
returns plain JSON. When you wire a real LLM, return SSE / chunked text and
expand the frontend accordingly (today the streaming is simulated locally
in `frontend/src/lib/mockAI.ts`).

## Extensions + Subscription (current organisation)

| Method | Path                              | Purpose                              | Origin |
| ------ | --------------------------------- | ------------------------------------ | ------ |
| GET    | `/organisations/me/extensions`    | active extension map                 | `[N]`  |
| PUT    | `/organisations/me/extensions`    | toggle a single extension            | `[N]`  |
| GET    | `/organisations/me/subscription`  | plan + extensions + usage + limits   | `[N]`  |

Extension keys (stable IDs): `contracts_pro`, `ticketing_pro`, `hr_pro`,
`internal_chat`, `legislation_monitor`, `ai_assistant`, `multi_site_teams`.

`GET /organisations/me/extensions` response:

```json
{
  "extensions": {
    "contracts_pro": true,
    "ticketing_pro": true,
    "hr_pro": true,
    "internal_chat": true,
    "legislation_monitor": true,
    "ai_assistant": true,
    "multi_site_teams": false
  }
}
```

`PUT /organisations/me/extensions` body: `{ key: ExtensionKey, enabled: bool }`.
Returns the same shape as `GET`. In production this should reflect what the
billing reconciliation has flipped on; in dev the mock persists toggles in
`localStorage` so a developer can preview gated UI without Stripe.

`GET /organisations/me/subscription` response:

```json
{
  "id": "sub_...",
  "plan": "Business",
  "status": "active",
  "period_end": "ISO",
  "cancel_at_period_end": false,
  "extensions": { "contracts_pro": true, "ai_assistant": false, "...": "..." },
  "limits": {
    "templates": 30,
    "signings_per_month": 300,
    "clients": null,
    "storage_mb": 5120
  },
  "usage": {
    "templates": 0,
    "signings_this_month": 0,
    "clients": 0,
    "storage_mb": 0
  }
}
```

The frontend gates pages/sections via `RequireExtension` and inline checks via
`useExtensions().canUse(...)`. See `docs/FRONTEND_FEATURE_MAP.md` for which
pages require which extension.

## Admin Console

Mounted at `/admin/*` on the frontend, separate from the regular app. Backend
should accept the same JWT but require an `admin` actor kind.

| Method | Path                                              | Purpose                              | Origin |
| ------ | ------------------------------------------------- | ------------------------------------ | ------ |
| GET    | `/admin/dashboard`                                | KPIs + recent rows                   | `[N]`  |
| GET    | `/admin/organisations`                            | list (with `?status=`, `?q=`)        | `[N]`  |
| POST   | `/admin/organisations`                            | create org (auditable)               | `[N]`  |
| GET    | `/admin/organisations/:id`                        | read (with embedded extension map)   | `[N]`  |
| PUT    | `/admin/organisations/:id`                        | update org (auditable)               | `[N]`  |
| DELETE | `/admin/organisations/:id`                        | delete org (auditable)               | `[N]`  |
| POST   | `/admin/organisations/:id/suspend`                | suspend org (auditable)              | `[N]`  |
| POST   | `/admin/organisations/:id/restore`                | restore org (auditable)              | `[N]`  |
| GET    | `/admin/organisations/:id/extensions`             | per-org extension map                | `[N]`  |
| PUT    | `/admin/organisations/:id/extensions`             | toggle per-org extension (auditable) | `[N]`  |
| GET    | `/admin/users`                                    | cross-org user list (with `?q=`, `?organisation_id=`) | `[N]`  |
| POST   | `/admin/users`                                    | create user (auditable)              | `[N]`  |
| GET    | `/admin/users/:id`                                | read user                            | `[N]`  |
| PUT    | `/admin/users/:id`                                | update user                          | `[N]`  |
| DELETE | `/admin/users/:id`                                | delete user (auditable)              | `[N]`  |
| POST   | `/admin/users/:id/impersonate`                    | issue impersonation token            | `[N]`  |
| GET    | `/admin/subscription-plans`                       | list plans                           | `[N]`  |
| POST   | `/admin/subscription-plans`                       | create plan with limits + features   | `[N]`  |
| PUT    | `/admin/subscription-plans/:id`                   | update plan                          | `[N]`  |
| DELETE | `/admin/subscription-plans/:id`                   | delete plan                          | `[N]`  |
| GET    | `/admin/billing`                                  | MRR + active subs + per-org list     | `[N]`  |
| GET    | `/admin/billing/events`                           | recent Stripe-style events           | `[N]`  |
| GET    | `/admin/files`                                    | storage usage + orphans              | `[N]`  |
| GET    | `/admin/contracts`                                | cross-org contracts overview         | `[N]`  |
| GET    | `/admin/notifications`                            | recent notifications                 | `[N]`  |
| POST   | `/admin/notifications/broadcast`                  | broadcast to all users               | `[N]`  |
| GET    | `/admin/jobs`                                     | recent job runs                      | `[N]`  |
| POST   | `/admin/jobs/:name/trigger`                       | manually trigger a job               | `[N]`  |
| GET    | `/admin/audit`                                    | audit events (with `?organisation_id`, `?action`) | `[N]` |

Subscription plan body shape:

```json
{
  "slug": "pro",
  "name": "Pro",
  "price": 199,
  "currency": "RON",
  "stripe_price_id": "price_pro_monthly",
  "limits": {
    "users": 20,
    "clients": 200,
    "templates": 10,
    "signings_per_month": 100,
    "storage_mb": 2048
  },
  "features": ["contracts_pro", "ticketing_pro"]
}
```

Limits accept positive integers or `null` for "unlimited". `features` is an
array of `ExtensionKey` values from the registry above.

Creating, updating, deleting, suspending, restoring an organisation, creating
or deleting a user, toggling per-org extensions, and any manual job trigger
should all emit an audit event with `actor_kind = "admin"`.

## Response shape conventions

- `POST` may return either the resource directly or
  `{ error: false, message, data: { id } }` — the frontend accepts both.
- `GET` for collections returns an array.
- Errors should include `{ message, status, code? }`.

## Auth/permission expectations (target)

- All `/app` endpoints require JWT bearer.
- Public sign endpoints are token-based, no auth.
- Permission model is role-based; permissions array on the user can include
  the wildcard `"*"` to grant all.
- All `/admin/*` endpoints require an admin-kind principal. Non-admin sessions
  must receive 403.
- Endpoints that touch a paid-only module (clients, contracts/*, ticketing/*,
  hr/*, chat/*, legislation/*, ai/*) must additionally check the calling
  organisation's `organisation_features` row and reject with 402 / `feature_locked`
  when inactive.
