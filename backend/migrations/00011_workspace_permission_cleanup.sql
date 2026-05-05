-- +goose Up
INSERT INTO permissions (slug, description)
VALUES
  ('chat:read', 'Read internal chat conversations and messages'),
  ('chat:write', 'Create internal chat messages'),
  ('message_templates:read', 'Read message templates'),
  ('message_templates:write', 'Create message templates'),
  ('message_templates:delete', 'Delete message templates'),
  ('hr:read', 'Read HR records'),
  ('hr:write', 'Create and update HR records'),
  ('planner:read', 'Read planner events'),
  ('planner:write', 'Create and update planner events'),
  ('planner:delete', 'Delete planner events'),
  ('automation_rules:read', 'Read automation rules'),
  ('automation_rules:write', 'Create and update automation rules'),
  ('automation_rules:delete', 'Delete automation rules'),
  ('reports:read', 'Read reports'),
  ('activity_log:read', 'Read activity log')
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
    'message_templates:delete',
    'hr:read',
    'hr:write',
    'planner:read',
    'planner:write',
    'planner:delete',
    'automation_rules:read',
    'automation_rules:write',
    'automation_rules:delete',
    'reports:read',
    'activity_log:read'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.slug IN (
  'chat:read',
  'message_templates:read',
  'hr:read',
  'planner:read',
  'automation_rules:read',
  'reports:read',
  'activity_log:read'
)
WHERE p_old.slug = 'members:read'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.slug IN (
  'chat:write',
  'message_templates:write',
  'hr:write',
  'planner:write',
  'planner:delete',
  'automation_rules:write'
)
WHERE p_old.slug = 'members:write'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.slug IN (
  'message_templates:delete',
  'automation_rules:delete'
)
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
    'message_templates:delete',
    'hr:read',
    'hr:write',
    'planner:read',
    'planner:write',
    'planner:delete',
    'automation_rules:read',
    'automation_rules:write',
    'automation_rules:delete',
    'reports:read',
    'activity_log:read'
  )
);

DELETE FROM permissions
WHERE slug IN (
  'chat:read',
  'chat:write',
  'message_templates:read',
  'message_templates:write',
  'message_templates:delete',
  'hr:read',
  'hr:write',
  'planner:read',
  'planner:write',
  'planner:delete',
  'automation_rules:read',
  'automation_rules:write',
  'automation_rules:delete',
  'reports:read',
  'activity_log:read'
);
