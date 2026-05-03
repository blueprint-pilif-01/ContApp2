-- +goose Up
-- Ensure every organisation has an owner role with all current permissions.
INSERT INTO roles (organisation_id, slug, name, system_role)
SELECT id, 'owner', 'Owner', true
FROM organisations
WHERE deleted_at IS NULL
ON CONFLICT (organisation_id, slug)
DO UPDATE SET name = EXCLUDED.name, system_role = EXCLUDED.system_role;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'owner'
ON CONFLICT DO NOTHING;

-- For newly-created organisations that only have one active member and no
-- assigned roles, treat that first member as the owner.
WITH sole_members AS (
  SELECT organisation_id, max(id) AS membership_id
  FROM organisation_memberships
  WHERE deleted_at IS NULL
    AND status = 'active'
  GROUP BY organisation_id
  HAVING count(*) = 1
),
members_without_roles AS (
  SELECT sm.organisation_id, sm.membership_id
  FROM sole_members sm
  WHERE NOT EXISTS (
    SELECT 1
    FROM membership_roles mr
    WHERE mr.membership_id = sm.membership_id
  )
)
INSERT INTO membership_roles (membership_id, role_id)
SELECT mwr.membership_id, r.id
FROM members_without_roles mwr
JOIN roles r
  ON r.organisation_id = mwr.organisation_id
 AND r.slug = 'owner'
ON CONFLICT DO NOTHING;

-- +goose Down
-- Data repair only. Do not remove roles or assignments on rollback.
