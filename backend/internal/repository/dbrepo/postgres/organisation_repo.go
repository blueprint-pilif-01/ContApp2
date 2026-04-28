package postgres

import (
	"backend/internal/models"
	"context"
)

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

func (r *PostgresDBRepo) ListEmployeeCategories(ctx context.Context, organisationID int64) ([]models.EmployeeCategory, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, name, description, created_at, updated_at, deleted_at
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
