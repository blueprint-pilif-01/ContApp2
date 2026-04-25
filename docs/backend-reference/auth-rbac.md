# Auth + RBAC Reference

Borrowed conceptually from `bisericavertical`.

## Files

- `D:/JSprojects/bisericavertical/backend/middleware/auth.js`
- `D:/JSprojects/bisericavertical/backend/middleware/permissions.js`

## Key mechanics

- JWT bearer auth (`Authorization: Bearer <token>`).
- User principal resolved per request.
- Effective permissions resolved from roles.
- Permission checks support wildcard (`*`) and scoped checks.

## Porting guidance

- Keep ContApp frontend contract unchanged:
  - `POST /auth/user/login`
  - `GET /auth/refresh-token`
  - `POST /auth/logout`
- Backend can be implemented in Go; this file only documents behavior and policy expectations.
