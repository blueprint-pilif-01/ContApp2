package postgres

import (
	"backend/internal/models"
	"context"
)

func (r *PostgresDBRepo) CreateContractTemplate(ctx context.Context, template *models.ContractTemplate) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		INSERT INTO contract_templates (
			organisation_id, created_by_id, name, contract_type, content_json, status
		)
		VALUES ($1, $2, $3, $4, COALESCE($5, '{}'::jsonb), COALESCE(NULLIF($6, ''), 'draft'))
		RETURNING id, status, created_at, updated_at
	`, template.OrganisationID, template.CreatedByID, template.Name, template.ContractType, template.ContentJSON, template.Status).
		Scan(&template.ID, &template.Status, &template.CreatedAt, &template.UpdatedAt)
}

func (r *PostgresDBRepo) ListContractTemplates(ctx context.Context, organisationID int64) ([]models.ContractTemplate, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, created_by_id, name, contract_type, content_json,
			status, created_at, updated_at, deleted_at
		FROM contract_templates
		WHERE organisation_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	templates := make([]models.ContractTemplate, 0)
	for rows.Next() {
		template, err := scanContractTemplate(rows)
		if err != nil {
			return nil, err
		}
		templates = append(templates, *template)
	}
	return templates, rows.Err()
}

func (r *PostgresDBRepo) GetContractTemplate(ctx context.Context, organisationID, id int64) (*models.ContractTemplate, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return scanContractTemplate(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, created_by_id, name, contract_type, content_json,
			status, created_at, updated_at, deleted_at
		FROM contract_templates
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id))
}

func (r *PostgresDBRepo) UpdateContractTemplate(ctx context.Context, template *models.ContractTemplate) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		UPDATE contract_templates
		SET name = $3,
			contract_type = $4,
			content_json = COALESCE($5, content_json),
			status = COALESCE(NULLIF($6, ''), status),
			updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
		RETURNING updated_at
	`, template.OrganisationID, template.ID, template.Name, template.ContractType, template.ContentJSON, template.Status).
		Scan(&template.UpdatedAt)
}

func (r *PostgresDBRepo) DeleteContractTemplate(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	_, err := r.DB.ExecContext(ctx, `
		UPDATE contract_templates SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func (r *PostgresDBRepo) CreateContractInvite(ctx context.Context, invite *models.ContractInvite) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		INSERT INTO contract_invites (
			organisation_id, template_id, client_id, created_by_id, token_hash, status,
			remarks, expiration_date, sent_at, viewed_at, revoked_at, signed_at
		)
		VALUES ($1, $2, $3, $4, $5, COALESCE(NULLIF($6, ''), 'draft'), $7, $8, $9, $10, $11, $12)
		RETURNING id, status, created_at, updated_at
	`, invite.OrganisationID, invite.TemplateID, invite.ClientID, invite.CreatedByID, invite.TokenHash, invite.Status, invite.Remarks, invite.ExpirationDate, invite.SentAt, invite.ViewedAt, invite.RevokedAt, invite.SignedAt).
		Scan(&invite.ID, &invite.Status, &invite.CreatedAt, &invite.UpdatedAt)
}

func (r *PostgresDBRepo) ListContractInvites(ctx context.Context, organisationID int64) ([]models.ContractInvite, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, template_id, client_id, created_by_id, token_hash,
			status, remarks, expiration_date, sent_at, viewed_at, revoked_at, signed_at,
			created_at, updated_at, deleted_at
		FROM contract_invites
		WHERE organisation_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	invites := make([]models.ContractInvite, 0)
	for rows.Next() {
		invite, err := scanContractInvite(rows)
		if err != nil {
			return nil, err
		}
		invites = append(invites, *invite)
	}
	return invites, rows.Err()
}

func (r *PostgresDBRepo) GetContractInvite(ctx context.Context, organisationID, id int64) (*models.ContractInvite, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return scanContractInvite(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, template_id, client_id, created_by_id, token_hash,
			status, remarks, expiration_date, sent_at, viewed_at, revoked_at, signed_at,
			created_at, updated_at, deleted_at
		FROM contract_invites
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id))
}

func (r *PostgresDBRepo) DeleteContractInvite(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	_, err := r.DB.ExecContext(ctx, `
		UPDATE contract_invites SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func (r *PostgresDBRepo) CreateContractSubmission(ctx context.Context, submission *models.ContractSubmission) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		INSERT INTO contract_submissions (
			organisation_id, invite_id, template_id, client_id, filled_fields,
			signature_image, contract_number, pdf_file_id, status, signed_at
		)
		VALUES ($1, $2, $3, $4, COALESCE($5, '{}'::jsonb), $6, $7, $8, COALESCE(NULLIF($9, ''), 'signed'), $10)
		RETURNING id, status, created_at, updated_at
	`, submission.OrganisationID, submission.InviteID, submission.TemplateID, submission.ClientID, submission.FilledFields, submission.SignatureImage, submission.ContractNumber, submission.PDFFileID, submission.Status, submission.SignedAt).
		Scan(&submission.ID, &submission.Status, &submission.CreatedAt, &submission.UpdatedAt)
}

func (r *PostgresDBRepo) ListContractSubmissions(ctx context.Context, organisationID int64) ([]models.ContractSubmission, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, invite_id, template_id, client_id, filled_fields,
			signature_image, contract_number, pdf_file_id, status, signed_at,
			created_at, updated_at, deleted_at
		FROM contract_submissions
		WHERE organisation_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	submissions := make([]models.ContractSubmission, 0)
	for rows.Next() {
		submission, err := scanContractSubmission(rows)
		if err != nil {
			return nil, err
		}
		submissions = append(submissions, *submission)
	}
	return submissions, rows.Err()
}

func (r *PostgresDBRepo) GetContractSubmission(ctx context.Context, organisationID, id int64) (*models.ContractSubmission, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return scanContractSubmission(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, invite_id, template_id, client_id, filled_fields,
			signature_image, contract_number, pdf_file_id, status, signed_at,
			created_at, updated_at, deleted_at
		FROM contract_submissions
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id))
}

func (r *PostgresDBRepo) DeleteContractSubmission(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	_, err := r.DB.ExecContext(ctx, `
		UPDATE contract_submissions SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func scanContractTemplate(row rowScanner) (*models.ContractTemplate, error) {
	template := &models.ContractTemplate{}
	err := row.Scan(&template.ID, &template.OrganisationID, &template.CreatedByID, &template.Name, &template.ContractType, &template.ContentJSON, &template.Status, &template.CreatedAt, &template.UpdatedAt, &template.DeletedAt)
	return template, err
}

func scanContractInvite(row rowScanner) (*models.ContractInvite, error) {
	invite := &models.ContractInvite{}
	err := row.Scan(&invite.ID, &invite.OrganisationID, &invite.TemplateID, &invite.ClientID, &invite.CreatedByID, &invite.TokenHash, &invite.Status, &invite.Remarks, &invite.ExpirationDate, &invite.SentAt, &invite.ViewedAt, &invite.RevokedAt, &invite.SignedAt, &invite.CreatedAt, &invite.UpdatedAt, &invite.DeletedAt)
	return invite, err
}

func scanContractSubmission(row rowScanner) (*models.ContractSubmission, error) {
	submission := &models.ContractSubmission{}
	err := row.Scan(&submission.ID, &submission.OrganisationID, &submission.InviteID, &submission.TemplateID, &submission.ClientID, &submission.FilledFields, &submission.SignatureImage, &submission.ContractNumber, &submission.PDFFileID, &submission.Status, &submission.SignedAt, &submission.CreatedAt, &submission.UpdatedAt, &submission.DeletedAt)
	return submission, err
}
