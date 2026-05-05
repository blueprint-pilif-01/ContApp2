# RBAC Target Model

This document shows the recommended direction for permissions, roles, scopes,
and business-owner access.

## High Level Model

```mermaid
flowchart TD
    A[Account / User] --> B[Organisation Membership]
    B --> C[Roles]
    C --> D[Permissions]
    C --> E[Data Scopes]

    D --> F[Can do what action?]
    E --> G[On which data?]

    F --> H[Backend Route / Handler]
    G --> H

    H --> I[Allowed]
    H --> J[Denied]
```

The core idea:

```txt
Permission = what action can the user do?
Scope = which data can the user do it on?
Role = named bundle of permissions and scopes.
```

## Concrete Example

```mermaid
flowchart LR
    U[Maria - Employee] --> M[Membership in Org 1]
    M --> R[Role: HR Manager]

    R --> P1[hr:read]
    R --> P2[hr:write]
    R --> P3[members:read]

    R --> S1[Scope: own department]

    P1 --> API[GET /hr/leaves]
    S1 --> API

    API --> OK[Can view HR data only for own department]
```

## Business Owner

```mermaid
flowchart TD
    O[Business Owner] --> OM[Owner Membership]
    OM --> OR[System Role: owner]

    OR --> ALL[All workspace permissions]
    ALL --> C1[clients:*]
    ALL --> C2[documents:*]
    ALL --> C3[contracts:*]
    ALL --> C4[members:*]
    ALL --> C5[roles:*]
    ALL --> C6[hr:*]
    ALL --> C7[reports:*]

    OR --> SCOPE[Scope: all organisation data]
```

Important owner rules:

- Owner role cannot be deleted.
- Owner permissions cannot be removed.
- Last owner cannot be demoted or removed.
- Every organisation should always have at least one active owner.
- Owner has full access inside its organisation, not platform-admin access.

## Backend Request Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Backend Route
    participant Auth as requireAuth
    participant Account as requireAccount
    participant Feature as requireFeature
    participant RBAC as requirePermission
    participant Scope as requireScope
    participant Handler as Handler

    FE->>API: Request with token
    API->>Auth: Validate access token
    Auth->>Account: Check account, organisation, membership
    Account->>Feature: Check module enabled
    Feature->>RBAC: Check permission slug
    RBAC->>Scope: Check data scope
    Scope->>Handler: Continue
    Handler-->>FE: Response
```

Recommended request decision order:

1. Authenticate token.
2. Confirm actor type.
3. Confirm organisation membership.
4. Confirm feature is enabled for the organisation.
5. Confirm permission exists for the membership.
6. Confirm data scope allows access to the target records.
7. Run handler.

## Database Shape

```mermaid
erDiagram
    accounts ||--o{ organisation_memberships : has
    organisations ||--o{ organisation_memberships : contains

    organisation_memberships ||--o{ membership_roles : has
    roles ||--o{ membership_roles : assigned_to

    roles ||--o{ role_permissions : has
    permissions ||--o{ role_permissions : granted_by

    roles ||--o{ role_scopes : has
    role_scopes }o--|| scope_definitions : uses

    organisations ||--o{ roles : owns

    accounts {
        bigint id
        text email
        text status
    }

    organisations {
        bigint id
        text name
        text status
    }

    organisation_memberships {
        bigint id
        bigint organisation_id
        bigint account_id
        text status
    }

    roles {
        bigint id
        bigint organisation_id
        text slug
        text name
        boolean system_role
    }

    permissions {
        bigint id
        text slug
        text description
    }

    role_permissions {
        bigint role_id
        bigint permission_id
    }

    membership_roles {
        bigint membership_id
        bigint role_id
    }

    role_scopes {
        bigint id
        bigint role_id
        text resource
        text scope_type
        text scope_value
    }
```

## Responsibility Split

```mermaid
flowchart TD
    BO[Business Owner] --> CR[Creates Roles]
    BO --> AU[Assigns Users to Roles]
    BO --> AP[Assigns Existing Permissions]
    BO --> AS[Assigns Data Scopes]

    BE[Backend Code] --> DP[Defines Permission Slugs]
    BE --> ER[Enforces Route Permissions]
    BE --> ES[Enforces Data Scopes]

    BO -. should not .-> NP[Create New Backend Permission Names]
```

Business owner manages:

- users
- role names
- role assignments
- existing permission assignments
- data scopes

Backend owns:

- permission definitions
- route enforcement
- scope enforcement
- owner-role safety rules
- platform-admin separation

## Recommended Target

```txt
Business Owner
  -> full organisation access
  -> can create users
  -> can create roles
  -> can assign backend-defined permissions
  -> can assign data scopes

Role
  -> permissions
  -> scopes

Permission
  -> action
  -> examples: clients:read, documents:write, hr:read

Scope
  -> data boundary
  -> examples: all, own, assigned, department, category
```

## Sustainable Backend Rules

### Permissions

Permissions must be backend-defined. The frontend can list and assign
permissions, but it must not create new permission slugs.

Good:

```txt
clients:read
clients:write
documents:read
hr:read
reports:read
```

Bad:

```txt
can_view_blue_clients
custom_permission_from_ui
permission_for_client_123
```

### Roles

Business owner can create roles, but only using existing permissions.

Example custom roles:

- Accountant
- HR Manager
- Sales Agent
- Viewer
- Contract Manager

### Scopes

Use scopes when access depends on which records the user can see.

Examples:

| Scope | Meaning |
| --- | --- |
| `all` | All organisation data for that resource. |
| `own` | Records created by or owned by the user. |
| `assigned` | Records assigned to the user. |
| `department` | Records inside a department. |
| `category` | Records inside a category. |

Do not create one permission per record. That does not scale.

## Implementation Plan

1. Stop creating permissions from role-save requests.
2. Validate role permissions against backend-defined permissions.
3. Protect the `owner` system role from deletion or permission changes.
4. Add last-owner protection.
5. Add missing dedicated module permissions.
6. Move routes away from overloaded `members:*` permissions.
7. Add `role_scopes`.
8. Add `requireScope` or repository-level scoped query helpers.
9. Add tests for owner safety, permission denial, and scoped data access.

