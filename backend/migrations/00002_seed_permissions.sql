-- +goose Up
INSERT INTO permissions (slug, description)
VALUES
  ('clients:read', 'Read clients'),
  ('clients:write', 'Create and update clients'),
  ('clients:delete', 'Delete clients'),
  ('documents:read', 'Read files and documents'),
  ('documents:write', 'Create files and documents'),
  ('documents:delete', 'Delete files and documents'),
  ('contracts:read', 'Read contract templates, invites, and submissions'),
  ('contracts:write', 'Create and update contract templates, invites, and submissions'),
  ('contracts:delete', 'Delete contract templates, invites, and submissions'),
  ('workspace_notes:read', 'Read workspace notes'),
  ('workspace_notes:write', 'Create and update workspace notes'),
  ('workspace_notes:delete', 'Delete workspace notes'),
  ('ticketing:read', 'Read ticketing tasks'),
  ('ticketing:write', 'Create and update ticketing tasks'),
  ('ticketing:delete', 'Delete ticketing tasks')
ON CONFLICT (slug) DO UPDATE
SET description = EXCLUDED.description;

-- +goose Down
DELETE FROM permissions
WHERE slug IN (
  'clients:read',
  'clients:write',
  'clients:delete',
  'documents:read',
  'documents:write',
  'documents:delete',
  'contracts:read',
  'contracts:write',
  'contracts:delete',
  'workspace_notes:read',
  'workspace_notes:write',
  'workspace_notes:delete',
  'ticketing:read',
  'ticketing:write',
  'ticketing:delete'
);
