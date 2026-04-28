package postgres

import (
	"backend/internal/models"
	"context"
)

func (r *PostgresDBRepo) CreateClient(ctx context.Context, client *models.Client) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	return r.DB.QueryRowContext(ctx, `
		INSERT INTO clients (
			organisation_id, owner_user_id, client_type, first_name, last_name, cnp,
			company_name, cui, tva, responsible_name, responsible_email, email,
			phone, address, status
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, COALESCE(NULLIF($15, ''), 'active'))
		RETURNING id, status, created_at, updated_at
	`,
		client.OrganisationID,
		client.OwnerUserID,
		client.ClientType,
		client.FirstName,
		client.LastName,
		client.CNP,
		client.CompanyName,
		client.CUI,
		client.TVA,
		client.ResponsibleName,
		client.ResponsibleEmail,
		client.Email,
		client.Phone,
		client.Address,
		client.Status,
	).Scan(&client.ID, &client.Status, &client.CreatedAt, &client.UpdatedAt)
}

func (r *PostgresDBRepo) ListClients(ctx context.Context, organisationID int64) ([]models.Client, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, owner_user_id, client_type, first_name, last_name, cnp,
			company_name, cui, tva, responsible_name, responsible_email, email, phone,
			address, status, created_at, updated_at, deleted_at
		FROM clients
		WHERE organisation_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	clients := make([]models.Client, 0)
	for rows.Next() {
		client, err := scanClient(rows)
		if err != nil {
			return nil, err
		}
		clients = append(clients, *client)
	}
	return clients, rows.Err()
}

func (r *PostgresDBRepo) GetClient(ctx context.Context, organisationID, id int64) (*models.Client, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	return scanClient(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, owner_user_id, client_type, first_name, last_name, cnp,
			company_name, cui, tva, responsible_name, responsible_email, email, phone,
			address, status, created_at, updated_at, deleted_at
		FROM clients
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id))
}

func (r *PostgresDBRepo) UpdateClient(ctx context.Context, client *models.Client) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	return r.DB.QueryRowContext(ctx, `
		UPDATE clients
		SET client_type = $3,
			first_name = $4,
			last_name = $5,
			cnp = $6,
			company_name = $7,
			cui = $8,
			tva = $9,
			responsible_name = $10,
			responsible_email = $11,
			email = $12,
			phone = $13,
			address = $14,
			status = COALESCE(NULLIF($15, ''), status),
			updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
		RETURNING updated_at
	`,
		client.OrganisationID,
		client.ID,
		client.ClientType,
		client.FirstName,
		client.LastName,
		client.CNP,
		client.CompanyName,
		client.CUI,
		client.TVA,
		client.ResponsibleName,
		client.ResponsibleEmail,
		client.Email,
		client.Phone,
		client.Address,
		client.Status,
	).Scan(&client.UpdatedAt)
}

func (r *PostgresDBRepo) DeleteClient(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, `
		UPDATE clients
		SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func scanClient(row rowScanner) (*models.Client, error) {
	client := &models.Client{}
	err := row.Scan(
		&client.ID,
		&client.OrganisationID,
		&client.OwnerUserID,
		&client.ClientType,
		&client.FirstName,
		&client.LastName,
		&client.CNP,
		&client.CompanyName,
		&client.CUI,
		&client.TVA,
		&client.ResponsibleName,
		&client.ResponsibleEmail,
		&client.Email,
		&client.Phone,
		&client.Address,
		&client.Status,
		&client.CreatedAt,
		&client.UpdatedAt,
		&client.DeletedAt,
	)
	if err != nil {
		return nil, err
	}
	return client, nil
}
