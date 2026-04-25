# ContApp Backend API Contract

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
| Ticketing System                  | Borrowed from BV `social_media_tasks` `[B]`       |
| Internal Communication (chat)     | Borrowed from BV `messaging` `[B]`                |
| Chat bot derive task              | New on top of chat `[N]`                          |
| Users + Roles + Permissions       | Borrowed from BV `users` + `permissions` `[B]`    |
| HR (pontaj/concedii/review/cert.) | New `[N]`                                         |
| Notebook (long form docs)         | New `[N]`                                         |
| Personal/Shared notes             | New `[N]` + legacy `/notes` compatibility `[E]`   |
| Calendar / Planner                | New `[N]`                                         |
| Planner Smart (AI plan)           | New `[N]`                                         |
| Legislation news + AI             | New `[N]`                                         |

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
    "invites_active": 0,
    "submissions_total": 0,
    "tasks_open": 0
  },
  "recent_activity": [
    { "id": "submission-1", "label": "...", "at": "ISO", "type": "submission" }
  ],
  "upcoming": [
    { "id": 1, "title": "...", "date": "ISO", "category": "contract" }
  ]
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

| Method | Path                                 | Purpose                | Origin |
| ------ | ------------------------------------ | ---------------------- | ------ |
| GET    | `/ticketing/tasks`                   | list with filters      | `[B]`  |
| POST   | `/ticketing/tasks`                   | create                 | `[B]`  |
| PUT    | `/ticketing/tasks/:id`               | update fields/status   | `[B]`  |
| POST   | `/ticketing/tasks/:id/claim`         | claim/assign self      | `[B]`  |
| POST   | `/ticketing/tasks/:id/complete`      | mark done              | `[B]`  |
| POST   | `/ticketing/tasks/:id/refuse`        | release/refuse         | `[B]`  |

`GET` accepts `?status=todo|in_progress|blocked|done` and `?assignee_id=`.

Status lifecycle: `todo → in_progress → done` with `blocked` as a side state.

## Chat (internal)

| Method | Path                                          | Purpose                       | Origin |
| ------ | --------------------------------------------- | ----------------------------- | ------ |
| GET    | `/chat/conversations`                         | list conversations            | `[B]`  |
| GET    | `/chat/conversations/:id/messages`            | list messages in conversation | `[B]`  |
| POST   | `/chat/conversations/:id/messages`            | send message                  | `[B]`  |
| POST   | `/chat/derive-task`                           | bot derives a ticket          | `[N]`  |

Conversation types: `direct | group | client`.

The bot endpoint should accept `{ message: string }` and return:

```json
{
  "task": { "id": 0, "title": "..." },
  "confirmation": "Am creat taskul #..."
}
```

## Settings: Users, Roles, Permissions

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
| GET    | `/workspace/notes`              | list shared/personal notes | `[N]` |
| POST   | `/workspace/notes`              | create note              | `[N]`  |
| PUT    | `/workspace/notes/:id`          | update note              | `[N]`  |
| GET    | `/notes`                        | personal notes (legacy)  | `[E]`  |
| POST   | `/notes`                        | create personal note     | `[E]`  |
| GET    | `/notes/:id`                    | read personal note       | `[E]`  |
| PUT    | `/notes/:id`                    | update personal note     | `[E]`  |
| DELETE | `/notes/:id`                    | delete personal note     | `[E]`  |

Note visibility values: `private | shared` for notebook, `personal | shared`
for workspace notes.

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
