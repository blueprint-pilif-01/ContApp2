# Template Editor Architecture Deviation

This document records a current mismatch between the frontend template editor and the backend/database architecture.

## Agreed Architecture

Contract template content should live directly in:

```text
contract_templates.content_json
```

The separate `template_fields` concept should not be part of the final backend/database model.

Reason:

- template fields are part of the template document structure
- keeping fields inside `content_json` avoids extra version tables too early
- contracts remain simpler to load, save, duplicate, and sign
- the database model stays aligned with the latest DBML design

## Current Frontend Behaviour

The current frontend still uses the older model.

In `TemplateEditorPage`, the editor content is serialized as JSON and sent to:

```text
POST /contracts/template-fields
GET  /contracts/template-fields/:id
```

The UI text also says that content is stored in:

```text
template_field.data
```

and that every save creates a new snapshot because there is no:

```text
PUT /template-fields/:id
```

## Why This Is A Deviation

This conflicts with the current backend/database direction.

The backend has `contract_templates.content_json`, but it does not have a final `template_fields` table or final `template_fields` API.

The frontend is therefore still designed around the old backend concept.

## Short-Term Compatibility Option

To avoid changing the frontend immediately, the backend can expose compatibility endpoints:

```text
POST /contracts/template-fields
GET  /contracts/template-fields/:id
DELETE /contracts/template-fields/:id
```

But these endpoints should not create a real `template_fields` table.

Instead, they should map the old frontend shape to the new backend model:

```text
template_field.data -> contract_templates.content_json
template_field.template_id -> contract_templates.id
```

This keeps the frontend working while preserving the final database design.

## Long-Term Fix

The frontend should be updated to save template content directly through:

```text
POST /contracts/templates
PUT  /contracts/templates/:id
GET  /contracts/templates/:id
```

The editor should read and write:

```text
content_json
```

The UI note about `template_field.data` should be removed.

## Decision

Do not reintroduce `template_fields` as a real database table.

Use `contract_templates.content_json` as the source of truth.

If compatibility is needed, implement it only as an API adapter layer.
