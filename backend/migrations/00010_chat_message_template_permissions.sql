-- +goose Up
INSERT INTO permissions (slug, description)
VALUES
  ('chat:read', 'Read internal chat conversations and messages'),
  ('chat:write', 'Create internal chat messages'),
  ('message_templates:read', 'Read message templates'),
  ('message_templates:write', 'Create message templates'),
  ('message_templates:delete', 'Delete message templates')
ON CONFLICT (slug) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'owner'
  AND p.slug IN (
    'chat:read',
    'chat:write',
    'message_templates:read',
    'message_templates:write',
    'message_templates:delete'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.slug IN ('chat:read', 'message_templates:read')
WHERE p_old.slug = 'members:read'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.slug IN ('chat:write', 'message_templates:write')
WHERE p_old.slug = 'members:write'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.slug = 'message_templates:delete'
WHERE p_old.slug = 'members:delete'
ON CONFLICT DO NOTHING;

-- +goose Down
DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id
  FROM permissions
  WHERE slug IN (
    'chat:read',
    'chat:write',
    'message_templates:read',
    'message_templates:write',
    'message_templates:delete'
  )
);

DELETE FROM permissions
WHERE slug IN (
  'chat:read',
  'chat:write',
  'message_templates:read',
  'message_templates:write',
  'message_templates:delete'
);
