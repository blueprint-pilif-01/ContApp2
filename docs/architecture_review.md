# Architecture Review

Date: 2026-05-03

This document reviews whether the current ContApp2 architecture is healthy and
scalable enough for the intended multi-organisation SaaS product.

## Verdict

The current model is acceptable for a prototype, demo, and early local
development. It is not yet strong enough for a production-scale
multi-organisation SaaS.

The product direction is scalable. The current implementation needs a backend
hardening phase before adding many more modules.

The main issue is not the chosen stack. Go, React, Vite, PostgreSQL, and a
modular monolith are appropriate. The main risks are data ownership, API drift,
RBAC provisioning, and missing backend tests.

## What Is Good

### Modular Monolith

Starting as a modular monolith is the right choice. It keeps deployment simple
while still allowing clear internal module boundaries.

### Organisation-Based SaaS Model

The main SaaS boundary is `organisations`, which is the correct direction for
this product.

### Identity Model

Using global `accounts` plus `organisation_memberships` is the right model.

Benefits:

- one login identity can belong to multiple organisations
- roles can be organisation-specific
- product-facing "users" are memberships, not global accounts
- future organisation switching is possible

### Admin Separation

Platform `admins` are separate from normal workspace accounts. Admin routes are
explicitly isolated from organisation workspace routes. Remaining hardening work
is platform-admin scopes, audit coverage, and impersonation rules; track it in
`docs/platform_admin_todo.md`.

### RBAC And Feature Guards Exist

The backend already has permission checks and feature guards. The concepts are
correct, even though provisioning and consistency need improvement.

### PostgreSQL Foundation

PostgreSQL is a good fit for this product because the app depends heavily on:

- relational organisation-scoped data
- permissions and roles
- contracts and clients
- audit trails
- billing/entitlements
- future reporting

## Main Risks

### Organisation Isolation Is Not Strict Enough

Many tables have `organisation_id`, but related foreign keys are not always
enforced as belonging to the same organisation.

Example risk:

- `contract_invites.organisation_id` could point to organisation A
- `template_id` or `client_id` could point to organisation B

The same class of risk can appear with files, documents, signatures, tickets,
notes, planner events, HR records, and chat records if handlers accept related
IDs directly.

Impact:

- potential cross-organisation data leakage
- invalid business data
- hard-to-debug permission bugs
- weak foundation for production

Recommended direction:

- validate related IDs in services/repositories before insert/update
- add organisation-scoped unique constraints where useful
- consider composite foreign keys like `(organisation_id, id)` for high-risk
  relationships
- add automated tests for cross-organisation rejection

### RBAC Provisioning Is Fragile

The app has roles and permissions, but role creation/assignment is not yet
centralized enough.

Observed issue:

- a new organisation business owner was created without the owner role
- the membership then failed `members:read` checks

Recommended direction:

- create one clear role provisioning service
- whenever an organisation is created, ensure default roles exist
- whenever a business owner is created, assign the owner role in the same
  transaction
- owner role should receive all current organisation permissions unless a
  stricter product decision is made

### Feature Keys Are Split Between Frontend And Backend

Frontend-facing keys include:

- `contracts_pro`
- `ticketing_pro`
- `hr_pro`
- `internal_chat`
- `legislation_monitor`
- `ai_assistant`

Backend/internal keys currently include:

- `contracts`
- `ticketing`
- `hr`
- `internal_chat`
- `documents`

This mapping works only if every layer remembers to translate correctly.

Recommended direction:

- centralize the mapping
- document canonical frontend keys and canonical backend feature keys
- avoid ad hoc string literals in handlers
- add tests for feature responses and guards

### API Contract Drift

Some frontend pages expect endpoints that the backend does not yet expose.
After removing runtime mocks, those gaps are now visible.

Examples:

- admin billing, plans, files, jobs, audit, notifications
- legislation endpoints
- AI summarize/topic digest
- saved signatures
- public client portal
- template field compatibility endpoints

Recommended direction:

- maintain `docs/FRONTEND_FEATURE_MAP.md` as the live frontend/backend checklist
- hide unfinished pages or implement placeholder backend endpoints
- avoid adding frontend pages that depend on fake data

### Response Shapes Are Inconsistent

The API docs define a response style, but the backend does not consistently
return it.

Current issue:

- backend errors return `{ "error": "message" }`
- docs describe `{ "error": true, "message": "...", "code": "..." }`

Recommended direction:

- standardize success and error responses
- update frontend API parsing if needed
- add tests for error response shape

### Too Much SQL Lives In Handlers

Some handlers use repositories, while others execute raw SQL directly.

This is acceptable for quick integration work, but it becomes a problem as the
product grows.

Risks:

- harder testing
- inconsistent organisation filtering
- duplicate query patterns
- business rules spread across handlers

Recommended direction:

- keep handlers thin
- move business operations into services or repositories
- keep transaction-heavy flows out of handlers

### Public Signing Token Handling Needs Hardening

Public signing tokens should not be stored raw.

Recommended direction:

- generate a raw token once
- hash the token before storing
- resolve public sign links by hashing the incoming token
- only expose the raw token at creation/send time

### Backend Tests Are Missing

`make test-backend` currently mostly verifies compilation because packages have
no test files.

This is not enough for a SaaS app with RBAC and organisation isolation.

Required backend test areas:

- login success/failure
- refresh/logout behavior
- permission denial
- owner role provisioning
- organisation data isolation
- feature guard denial
- public signing token flow
- admin CRUD basics

## Recommended Hardening Roadmap

### Phase 1: Contract And Data Safety

1. Define canonical API response shapes.
2. Update `httpx.Error` and success helpers.
3. Audit all organisation-scoped write paths.
4. Add related-ID organisation validation before writes.
5. Add tests for cross-organisation write rejection.

### Phase 2: RBAC And Provisioning

1. Create role provisioning helpers.
2. Ensure default roles on organisation creation.
3. Ensure business owners receive owner role.
4. Backfill missing owner roles for existing organisations.
5. Add tests for owner permissions.

### Phase 3: Feature And Entitlement Consistency

1. Centralize feature key mapping.
2. Add missing feature definitions for planned extensions.
3. Make all paid module routes use consistent guards.
4. Add tests for enabled/disabled feature access.

### Phase 4: Endpoint Reality Check

1. Compare frontend routes/pages to backend routes.
2. Implement placeholder backend endpoints for pages kept in the app.
3. Hide pages for modules that are not yet supported.
4. Remove compatibility endpoints once frontend is updated.

### Phase 5: Move Logic Out Of Handlers

1. Keep handlers focused on auth, decode, call service, encode.
2. Move direct SQL flows into repositories/services.
3. Use transactions in service/repository layer.
4. Add focused repository/service tests.

## Final Recommendation

Do not rewrite the project. Keep the modular monolith.

The next major work should be a backend hardening/refactor phase, not new
feature expansion.

The order should be:

1. organisation isolation
2. RBAC provisioning
3. feature key consistency
4. API response consistency
5. backend tests
6. then more product modules
