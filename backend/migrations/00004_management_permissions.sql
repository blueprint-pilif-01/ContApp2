-- +goose Up
INSERT INTO permissions (slug, description)
VALUES
  ('members:read', 'Read workspace members'),
  ('members:write', 'Create and update workspace members'),
  ('members:delete', 'Remove workspace members'),
  ('roles:read', 'Read roles and permissions'),
  ('roles:write', 'Assign roles to members'),
  ('employee_categories:read', 'Read employee categories'),
  ('employee_categories:write', 'Create and update employee categories'),
  ('employee_categories:delete', 'Delete employee categories')
ON CONFLICT (slug) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'owner'
  AND p.slug IN (
    'members:read',
    'members:write',
    'members:delete',
    'roles:read',
    'roles:write',
    'employee_categories:read',
    'employee_categories:write',
    'employee_categories:delete'
  )
ON CONFLICT DO NOTHING;

-- +goose Down
DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id
  FROM permissions
  WHERE slug IN (
    'members:read',
    'members:write',
    'members:delete',
    'roles:read',
    'roles:write',
    'employee_categories:read',
    'employee_categories:write',
    'employee_categories:delete'
  )
);

DELETE FROM permissions
WHERE slug IN (
  'members:read',
  'members:write',
  'members:delete',
  'roles:read',
  'roles:write',
  'employee_categories:read',
  'employee_categories:write',
  'employee_categories:delete'
);
