package postgres

import (
	"backend/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

func (r *PostgresDBRepo) ListOrganisations(ctx context.Context) ([]models.Organisation, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, name, cui, address, status, created_at, updated_at, deleted_at
		FROM organisations
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC, id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	organisations := make([]models.Organisation, 0)
	for rows.Next() {
		var organisation models.Organisation
		if err := rows.Scan(&organisation.ID, &organisation.Name, &organisation.CUI, &organisation.Address, &organisation.Status, &organisation.CreatedAt, &organisation.UpdatedAt, &organisation.DeletedAt); err != nil {
			return nil, err
		}
		organisations = append(organisations, organisation)
	}
	return organisations, rows.Err()
}

func (r *PostgresDBRepo) CreateOrganisation(ctx context.Context, organisation *models.Organisation) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	if organisation.Status == "" {
		organisation.Status = "active"
	}
	return r.DB.QueryRowContext(ctx, `
		INSERT INTO organisations (name, cui, address, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`, organisation.Name, organisation.CUI, organisation.Address, organisation.Status).Scan(&organisation.ID, &organisation.CreatedAt, &organisation.UpdatedAt)
}

func (r *PostgresDBRepo) GetOrganisationByID(ctx context.Context, id int64) (*models.Organisation, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	organisation := &models.Organisation{}
	err := r.DB.QueryRowContext(ctx, `
		SELECT id, name, cui, address, status, created_at, updated_at, deleted_at
		FROM organisations
		WHERE id = $1
			AND deleted_at IS NULL
	`, id).Scan(
		&organisation.ID,
		&organisation.Name,
		&organisation.CUI,
		&organisation.Address,
		&organisation.Status,
		&organisation.CreatedAt,
		&organisation.UpdatedAt,
		&organisation.DeletedAt,
	)
	if err != nil {
		return nil, err
	}
	return organisation, nil
}

func (r *PostgresDBRepo) UpdateOrganisationStatus(ctx context.Context, id int64, status string) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, `
		UPDATE organisations
		SET status = $2, updated_at = now()
		WHERE id = $1
			AND deleted_at IS NULL
	`, id, status)
	return err
}

func (r *PostgresDBRepo) GetOrganisationSettings(ctx context.Context, organisationID int64) (*models.OrganisationSettings, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	settings := &models.OrganisationSettings{}
	err := r.DB.QueryRowContext(ctx, `
		SELECT organisation_id, settings, updated_at
		FROM organisation_settings
		WHERE organisation_id = $1
	`, organisationID).Scan(
		&settings.OrganisationID,
		&settings.Settings,
		&settings.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return settings, nil
}

func (r *PostgresDBRepo) ListOrganisationSubscriptions(ctx context.Context, organisationID int64) ([]models.Subscription, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, subscription_plan_id, status, stripe_subscription_id,
			current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at
		FROM subscriptions
		WHERE organisation_id = $1
		ORDER BY created_at DESC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	subscriptions := make([]models.Subscription, 0)
	for rows.Next() {
		var subscription models.Subscription
		if err := rows.Scan(
			&subscription.ID,
			&subscription.OrganisationID,
			&subscription.SubscriptionPlanID,
			&subscription.Status,
			&subscription.StripeSubscriptionID,
			&subscription.CurrentPeriodStart,
			&subscription.CurrentPeriodEnd,
			&subscription.CancelAtPeriodEnd,
			&subscription.CreatedAt,
			&subscription.UpdatedAt,
		); err != nil {
			return nil, err
		}
		subscriptions = append(subscriptions, subscription)
	}
	return subscriptions, rows.Err()
}

func (r *PostgresDBRepo) ListEmployeeCategories(ctx context.Context, organisationID int64) ([]models.EmployeeCategory, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, name, description, color, created_at, updated_at, deleted_at
		FROM employee_categories
		WHERE organisation_id = $1
			AND deleted_at IS NULL
		ORDER BY name ASC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := make([]models.EmployeeCategory, 0)
	for rows.Next() {
		var category models.EmployeeCategory
		if err := rows.Scan(
			&category.ID,
			&category.OrganisationID,
			&category.Name,
			&category.Description,
			&category.Color,
			&category.CreatedAt,
			&category.UpdatedAt,
			&category.DeletedAt,
		); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}
	return categories, rows.Err()
}

func (r *PostgresDBRepo) CreateEmployeeCategory(ctx context.Context, category *models.EmployeeCategory) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	return r.DB.QueryRowContext(ctx, `
		INSERT INTO employee_categories (organisation_id, name, description, color)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`, category.OrganisationID, category.Name, category.Description, category.Color).Scan(&category.ID, &category.CreatedAt, &category.UpdatedAt)
}

func (r *PostgresDBRepo) UpdateEmployeeCategory(ctx context.Context, category *models.EmployeeCategory) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, `
		UPDATE employee_categories
		SET name = $3, description = $4, color = $5, updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, category.OrganisationID, category.ID, category.Name, category.Description, category.Color)
	return err
}

func (r *PostgresDBRepo) DeleteEmployeeCategory(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, `
		UPDATE employee_categories
		SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func (r *PostgresDBRepo) ListWorkspaceMembers(ctx context.Context, organisationID int64) ([]models.WorkspaceMember, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, memberSelectQuery()+`
		WHERE m.organisation_id = $1
			AND m.deleted_at IS NULL
			AND a.deleted_at IS NULL
		ORDER BY a.last_name ASC, a.first_name ASC, m.id ASC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := make([]models.WorkspaceMember, 0)
	for rows.Next() {
		member, err := scanWorkspaceMember(rows)
		if err != nil {
			return nil, err
		}
		members = append(members, *member)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for i := range members {
		roles, err := r.rolesForMembership(ctx, organisationID, members[i].MembershipID)
		if err != nil {
			return nil, err
		}
		members[i].Roles = roles
	}
	return members, nil
}

func (r *PostgresDBRepo) GetWorkspaceMember(ctx context.Context, organisationID, membershipID int64) (*models.WorkspaceMember, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	member, err := scanWorkspaceMember(r.DB.QueryRowContext(ctx, memberSelectQuery()+`
		WHERE m.organisation_id = $1
			AND m.id = $2
			AND m.deleted_at IS NULL
			AND a.deleted_at IS NULL
	`, organisationID, membershipID))
	if err != nil {
		return nil, err
	}
	roles, err := r.rolesForMembership(ctx, organisationID, membershipID)
	if err != nil {
		return nil, err
	}
	member.Roles = roles
	return member, nil
}

func (r *PostgresDBRepo) CreateWorkspaceMember(ctx context.Context, member *models.WorkspaceMember, passwordHash string) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	email := strings.ToLower(strings.TrimSpace(member.Email))
	var accountID int64
	err = tx.QueryRowContext(ctx, `
		SELECT id
		FROM accounts
		WHERE lower(email) = lower($1)
			AND deleted_at IS NULL
	`, email).Scan(&accountID)
	if errors.Is(err, sql.ErrNoRows) {
		err = tx.QueryRowContext(ctx, `
			INSERT INTO accounts (email, password_hash, first_name, last_name, phone, status)
			VALUES ($1, $2, $3, $4, $5, 'active')
			RETURNING id
		`, email, passwordHash, member.FirstName, member.LastName, member.Phone).Scan(&accountID)
	}
	if err != nil {
		return err
	}

	if member.Status == "" {
		member.Status = "active"
	}
	err = tx.QueryRowContext(ctx, `
		INSERT INTO organisation_memberships (
			organisation_id, account_id, employee_category_id, display_name, job_title, status, joined_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, now())
		RETURNING id, created_at, updated_at
	`, member.OrganisationID, accountID, member.EmployeeCategoryID, member.DisplayName, member.JobTitle, member.Status).Scan(&member.MembershipID, &member.CreatedAt, &member.UpdatedAt)
	if err != nil {
		return err
	}
	member.AccountID = accountID
	member.Email = email
	return tx.Commit()
}

func (r *PostgresDBRepo) UpdateWorkspaceMember(ctx context.Context, member *models.WorkspaceMember) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, `
		UPDATE organisation_memberships
		SET employee_category_id = $3, display_name = $4, job_title = $5, updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, member.OrganisationID, member.MembershipID, member.EmployeeCategoryID, member.DisplayName, member.JobTitle)
	return err
}

func (r *PostgresDBRepo) UpdateWorkspaceMemberStatus(ctx context.Context, organisationID, membershipID int64, status string) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	if status != "active" {
		if err := ensureMembershipIsNotLastOwner(ctx, r.DB, organisationID, membershipID); err != nil {
			return err
		}
	}
	_, err := r.DB.ExecContext(ctx, `
		UPDATE organisation_memberships
		SET status = $3, updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, organisationID, membershipID, status)
	return err
}

func (r *PostgresDBRepo) ListRoles(ctx context.Context, organisationID int64) ([]models.Role, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, slug, name, system_role, created_at
		FROM roles
		WHERE organisation_id = $1
		ORDER BY system_role DESC, name ASC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRoles(rows)
}

func (r *PostgresDBRepo) ListPermissions(ctx context.Context) ([]models.Permission, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, slug, description
		FROM permissions
		ORDER BY slug ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permissions := make([]models.Permission, 0)
	for rows.Next() {
		var permission models.Permission
		if err := rows.Scan(&permission.ID, &permission.Slug, &permission.Description); err != nil {
			return nil, err
		}
		permissions = append(permissions, permission)
	}
	return permissions, rows.Err()
}

func (r *PostgresDBRepo) SetMembershipRoles(ctx context.Context, organisationID, membershipID int64, roleIDs []int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var exists bool
	if err := tx.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM organisation_memberships
			WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
		)
	`, organisationID, membershipID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return sql.ErrNoRows
	}

	currentHasOwner, err := membershipHasOwnerRole(ctx, tx, organisationID, membershipID)
	if err != nil {
		return err
	}
	nextHasOwner, err := roleIDsIncludeOwner(ctx, tx, organisationID, roleIDs)
	if err != nil {
		return err
	}
	if currentHasOwner && !nextHasOwner {
		if err := ensureMembershipIsNotLastOwner(ctx, tx, organisationID, membershipID); err != nil {
			return err
		}
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM membership_roles WHERE membership_id = $1`, membershipID); err != nil {
		return err
	}
	for _, roleID := range roleIDs {
		result, err := tx.ExecContext(ctx, `
			INSERT INTO membership_roles (membership_id, role_id)
			SELECT $1, id
			FROM roles
			WHERE organisation_id = $2 AND id = $3
			ON CONFLICT DO NOTHING
		`, membershipID, organisationID, roleID)
		if err != nil {
			return err
		}
		if rows, _ := result.RowsAffected(); rows == 0 {
			return fmt.Errorf("role %d not found for organisation", roleID)
		}
	}
	return tx.Commit()
}

type ownerGuardDB interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

func membershipHasOwnerRole(ctx context.Context, db ownerGuardDB, organisationID, membershipID int64) (bool, error) {
	var hasOwner bool
	err := db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM membership_roles mr
			JOIN roles r ON r.id = mr.role_id
			WHERE mr.membership_id = $1
				AND r.organisation_id = $2
				AND r.slug = 'owner'
		)
	`, membershipID, organisationID).Scan(&hasOwner)
	return hasOwner, err
}

func roleIDsIncludeOwner(ctx context.Context, db ownerGuardDB, organisationID int64, roleIDs []int64) (bool, error) {
	if len(roleIDs) == 0 {
		return false, nil
	}
	for _, roleID := range roleIDs {
		var isOwner bool
		if err := db.QueryRowContext(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM roles
				WHERE organisation_id = $1
					AND id = $2
					AND slug = 'owner'
			)
		`, organisationID, roleID).Scan(&isOwner); err != nil {
			return false, err
		}
		if isOwner {
			return true, nil
		}
	}
	return false, nil
}

func ensureMembershipIsNotLastOwner(ctx context.Context, db ownerGuardDB, organisationID, membershipID int64) error {
	isOwner, err := membershipHasOwnerRole(ctx, db, organisationID, membershipID)
	if err != nil {
		return err
	}
	if !isOwner {
		return nil
	}
	var activeOwners int
	if err := db.QueryRowContext(ctx, `
		SELECT count(DISTINCT m.id)
		FROM organisation_memberships m
		JOIN membership_roles mr ON mr.membership_id = m.id
		JOIN roles r ON r.id = mr.role_id
		WHERE m.organisation_id = $1
			AND m.deleted_at IS NULL
			AND m.status = 'active'
			AND r.slug = 'owner'
	`, organisationID).Scan(&activeOwners); err != nil {
		return err
	}
	if activeOwners <= 1 {
		return fmt.Errorf("last owner cannot be removed")
	}
	return nil
}

func memberSelectQuery() string {
	return `
		SELECT
			m.id, m.organisation_id, m.account_id,
			a.email, a.first_name, a.last_name, a.phone,
			m.employee_category_id, ec.name,
			m.display_name, m.job_title, m.status, m.joined_at, m.created_at, m.updated_at
		FROM organisation_memberships m
		JOIN accounts a ON a.id = m.account_id
		LEFT JOIN employee_categories ec ON ec.id = m.employee_category_id AND ec.deleted_at IS NULL
	`
}

type memberScanner interface {
	Scan(dest ...any) error
}

func scanWorkspaceMember(row memberScanner) (*models.WorkspaceMember, error) {
	member := &models.WorkspaceMember{}
	err := row.Scan(
		&member.MembershipID,
		&member.OrganisationID,
		&member.AccountID,
		&member.Email,
		&member.FirstName,
		&member.LastName,
		&member.Phone,
		&member.EmployeeCategoryID,
		&member.EmployeeCategory,
		&member.DisplayName,
		&member.JobTitle,
		&member.Status,
		&member.JoinedAt,
		&member.CreatedAt,
		&member.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return member, nil
}

func (r *PostgresDBRepo) rolesForMembership(ctx context.Context, organisationID, membershipID int64) ([]models.Role, error) {
	rows, err := r.DB.QueryContext(ctx, `
		SELECT r.id, r.organisation_id, r.slug, r.name, r.system_role, r.created_at
		FROM roles r
		JOIN membership_roles mr ON mr.role_id = r.id
		WHERE r.organisation_id = $1
			AND mr.membership_id = $2
		ORDER BY r.name ASC
	`, organisationID, membershipID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRoles(rows)
}

func scanRoles(rows *sql.Rows) ([]models.Role, error) {
	roles := make([]models.Role, 0)
	for rows.Next() {
		var role models.Role
		if err := rows.Scan(&role.ID, &role.OrganisationID, &role.Slug, &role.Name, &role.SystemRole, &role.CreatedAt); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}
