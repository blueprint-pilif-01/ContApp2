package postgres

import (
	"context"
)

func (r *PostgresDBRepo) ListPermissionsForMembership(ctx context.Context, organisationID, membershipID int64) ([]string, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT DISTINCT p.slug
		FROM membership_roles mr
		JOIN roles ro ON ro.id = mr.role_id
		JOIN role_permissions rp ON rp.role_id = ro.id
		JOIN permissions p ON p.id = rp.permission_id
		WHERE mr.membership_id = $1
			AND ro.organisation_id = $2
		ORDER BY p.slug
	`, membershipID, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permissions := make([]string, 0)
	for rows.Next() {
		var permission string
		if err := rows.Scan(&permission); err != nil {
			return nil, err
		}
		permissions = append(permissions, permission)
	}
	return permissions, rows.Err()
}
