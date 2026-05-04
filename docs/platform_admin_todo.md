# Platform Admin TODO

Platform admin is a separate security boundary from organisation users. Admins
should manage the SaaS platform layer, not automatically bypass organisation
privacy or workspace RBAC.

## Access Model

- [ ] Add platform admin scopes instead of one all-powerful admin role.
- [ ] Store platform admin role/scope assignments separately from organisation roles.
- [ ] Require explicit scopes on every `/admin/*` route.
- [ ] Keep organisation roles limited to organisation memberships only.

Suggested scopes:

- `platform:read`
- `platform:support`
- `platform:billing`
- `platform:security`
- `platform:jobs`
- `platform:impersonate`
- `platform:superadmin`

## Route Scope Map

- [ ] `/admin/dashboard` -> `platform:read`
- [ ] `/admin/files` -> `platform:read`
- [ ] `/admin/audit` -> `platform:security`
- [ ] `/admin/jobs` -> `platform:jobs`
- [ ] `/admin/jobs/{name}/trigger` -> `platform:jobs`
- [ ] `/admin/billing` -> `platform:billing`
- [ ] `/admin/billing/events` -> `platform:billing`
- [ ] `/admin/subscription-plans` -> `platform:billing`
- [ ] `/admin/organisations` -> `platform:support`
- [ ] `/admin/users` -> `platform:support`
- [ ] `/admin/users/{id}/impersonate` -> `platform:impersonate`
- [ ] `/admin/notifications/broadcast` -> `platform:superadmin`

## Privacy Rules

- [ ] Platform admins can view aggregate file/storage counts.
- [ ] Platform admins cannot read customer file contents by default.
- [ ] Platform admins cannot read private chat messages by default.
- [ ] Platform admins cannot read contract body/content by default.
- [ ] Platform admins cannot bypass workspace RBAC on organisation routes.
- [ ] Any support access to organisation-private data requires explicit elevated scope.

## Audit Requirements

- [ ] Audit every platform admin write action.
- [ ] Audit every impersonation attempt.
- [ ] Audit every billing/plan change.
- [ ] Audit every broadcast notification.
- [ ] Store actor type, admin ID, target organisation, target entity, action, and metadata.

## Impersonation

- [ ] Replace placeholder impersonation with real short-lived impersonation tokens.
- [ ] Require `platform:impersonate`.
- [ ] Require reason/comment before impersonation starts.
- [ ] Show visible impersonation banner in the workspace UI.
- [ ] Prevent impersonation into platform admin routes.
- [ ] Auto-expire impersonation sessions quickly.

## Current Guardrails

- [x] Admin login is separate from user login.
- [x] Admin routes require admin tokens.
- [x] Workspace routes require account workspace tokens.
- [x] Admin tokens no longer bypass workspace permissions.
- [x] Admin tokens no longer bypass organisation feature checks.
- [x] Admin and account refresh cookies are separated.
