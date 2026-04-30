# Employee vs Client Clarification

This document records an important architecture clarification for ContApp2.

## Core Difference

An employee is an internal user of the workspace.

An employee can log in, has an account, belongs to one or more organisations through memberships, and can receive roles and permissions. Employees use the authenticated workspace UI to manage business data.

A client is an external customer of the business.

A client does not log in to the main workspace at this stage. Clients exist only as business records used by enabled modules, especially the Contracts package. A client may receive a public contract signing link, but that does not make the client an internal user.

## Employee

Employee data belongs to the organisation membership/user management area.

Employees should be managed from settings or administration screens such as:

- workspace users
- members
- employee categories
- roles
- permissions

Employees may have:

- account login credentials
- organisation membership
- roles
- permissions
- employee category
- internal tasks or tickets assigned to them

The frontend should not create employees through the clients API.

## Client

Client data belongs to the external customer area.

Clients are available only when the Contracts package is enabled, at least for the current stage of the product.

Clients may be:

- person clients
- company clients

Clients may have:

- name
- email
- phone
- address
- CNP for person clients
- CUI for company clients
- status
- optional responsible internal employee later, if needed

Clients should not have:

- workspace login credentials
- roles
- permissions
- organisation memberships
- employee category

## Frontend Rule

The frontend must treat employees and clients as separate domain models.

Client create/update payloads should not send internal-user fields such as:

- user_id
- organisation_id
- signature_id
- role
- permissions
- password
- employee category

The backend already knows the active organisation from the authenticated token, so the frontend should not send organisation_id for normal workspace requests.

## Backend Compatibility

Some temporary backend compatibility exists to accept older frontend payload fields. This is only to keep the UI working during migration.

The long-term design should be:

- `/settings/users` or similar endpoints manage employees.
- `/clients` endpoints manage external customers only.
- `/contracts/*` endpoints use clients as signing/customer records.
- The backend ignores or rejects user/employee fields sent to client endpoints once the frontend is cleaned.

## Database Direction

Employees should be represented through:

- accounts
- organisation_memberships
- roles
- membership_roles
- employee_categories

Clients should be represented through:

- clients

The `clients` table should support both person and company clients through `client_type`.

For person clients, use `cnp`.

For company clients, use `cui`.

## Current Issue

The frontend appears to mix employee and client concepts in some places. This can cause bad payloads, confusing UI labels, and invalid backend requests.

Example problem:

- creating a client with `user_id`, `organisation_id`, or `signature_id`
- using `cnp` for a company client instead of `cui`
- showing client forms as if they create internal employees

## Decision

Keep employees and clients separate.

Employees are internal workspace users.

Clients are external customers.

Future extensions may allow external client portal access or external chat, but that should be added as a separate feature and not mixed into the current employee model.
