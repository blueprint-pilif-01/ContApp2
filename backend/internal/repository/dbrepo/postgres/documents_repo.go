package postgres

import (
	"backend/internal/models"
	"context"
)

func (r *PostgresDBRepo) CreateFile(ctx context.Context, file *models.File) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	return r.DB.QueryRowContext(ctx, `
		INSERT INTO files (
			organisation_id, uploaded_by_id, storage_key, original_name, mime_type,
			size_bytes, checksum_sha256, category
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`, file.OrganisationID, file.UploadedByID, file.StorageKey, file.OriginalName, file.MimeType, file.SizeBytes, file.ChecksumSHA256, file.Category).
		Scan(&file.ID, &file.CreatedAt)
}

func (r *PostgresDBRepo) ListFiles(ctx context.Context, organisationID int64) ([]models.File, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, uploaded_by_id, storage_key, original_name, mime_type,
			size_bytes, checksum_sha256, category, created_at, deleted_at
		FROM files
		WHERE organisation_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	files := make([]models.File, 0)
	for rows.Next() {
		file, err := scanFile(rows)
		if err != nil {
			return nil, err
		}
		files = append(files, *file)
	}
	return files, rows.Err()
}

func (r *PostgresDBRepo) GetFile(ctx context.Context, organisationID, id int64) (*models.File, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return scanFile(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, uploaded_by_id, storage_key, original_name, mime_type,
			size_bytes, checksum_sha256, category, created_at, deleted_at
		FROM files
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id))
}

func (r *PostgresDBRepo) DeleteFile(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	_, err := r.DB.ExecContext(ctx, `
		UPDATE files SET deleted_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func (r *PostgresDBRepo) CreateOrganisationDocument(ctx context.Context, document *models.OrganisationDocument) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		INSERT INTO organisation_documents (
			organisation_id, file_id, uploaded_by_id, document_name, document_type, visibility, remarks
		)
		VALUES ($1, $2, $3, $4, $5, COALESCE(NULLIF($6, ''), 'organisation'), $7)
		RETURNING id, visibility, created_at, updated_at
	`, document.OrganisationID, document.FileID, document.UploadedByID, document.DocumentName, document.DocumentType, document.Visibility, document.Remarks).
		Scan(&document.ID, &document.Visibility, &document.CreatedAt, &document.UpdatedAt)
}

func (r *PostgresDBRepo) ListOrganisationDocuments(ctx context.Context, organisationID int64) ([]models.OrganisationDocument, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, file_id, uploaded_by_id, document_name, document_type,
			visibility, remarks, created_at, updated_at, deleted_at
		FROM organisation_documents
		WHERE organisation_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	documents := make([]models.OrganisationDocument, 0)
	for rows.Next() {
		document, err := scanOrganisationDocument(rows)
		if err != nil {
			return nil, err
		}
		documents = append(documents, *document)
	}
	return documents, rows.Err()
}

func (r *PostgresDBRepo) GetOrganisationDocument(ctx context.Context, organisationID, id int64) (*models.OrganisationDocument, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return scanOrganisationDocument(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, file_id, uploaded_by_id, document_name, document_type,
			visibility, remarks, created_at, updated_at, deleted_at
		FROM organisation_documents
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id))
}

func (r *PostgresDBRepo) DeleteOrganisationDocument(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	_, err := r.DB.ExecContext(ctx, `
		UPDATE organisation_documents SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func (r *PostgresDBRepo) CreateClientDocument(ctx context.Context, document *models.ClientDocument) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		INSERT INTO client_documents (
			organisation_id, client_id, file_id, document_name, file_type, status, expiration_date, remarks
		)
		VALUES ($1, $2, $3, $4, $5, COALESCE(NULLIF($6, ''), 'active'), $7, $8)
		RETURNING id, status, created_at, updated_at
	`, document.OrganisationID, document.ClientID, document.FileID, document.DocumentName, document.FileType, document.Status, document.ExpirationDate, document.Remarks).
		Scan(&document.ID, &document.Status, &document.CreatedAt, &document.UpdatedAt)
}

func (r *PostgresDBRepo) ListClientDocuments(ctx context.Context, organisationID, clientID int64) ([]models.ClientDocument, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, client_id, file_id, document_name, file_type,
			status, expiration_date, remarks, created_at, updated_at, deleted_at
		FROM client_documents
		WHERE organisation_id = $1 AND client_id = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, organisationID, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	documents := make([]models.ClientDocument, 0)
	for rows.Next() {
		document, err := scanClientDocument(rows)
		if err != nil {
			return nil, err
		}
		documents = append(documents, *document)
	}
	return documents, rows.Err()
}

func (r *PostgresDBRepo) GetClientDocument(ctx context.Context, organisationID, id int64) (*models.ClientDocument, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return scanClientDocument(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, client_id, file_id, document_name, file_type,
			status, expiration_date, remarks, created_at, updated_at, deleted_at
		FROM client_documents
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id))
}

func (r *PostgresDBRepo) DeleteClientDocument(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	_, err := r.DB.ExecContext(ctx, `
		UPDATE client_documents SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func scanFile(row rowScanner) (*models.File, error) {
	file := &models.File{}
	err := row.Scan(&file.ID, &file.OrganisationID, &file.UploadedByID, &file.StorageKey, &file.OriginalName, &file.MimeType, &file.SizeBytes, &file.ChecksumSHA256, &file.Category, &file.CreatedAt, &file.DeletedAt)
	return file, err
}

func scanOrganisationDocument(row rowScanner) (*models.OrganisationDocument, error) {
	document := &models.OrganisationDocument{}
	err := row.Scan(&document.ID, &document.OrganisationID, &document.FileID, &document.UploadedByID, &document.DocumentName, &document.DocumentType, &document.Visibility, &document.Remarks, &document.CreatedAt, &document.UpdatedAt, &document.DeletedAt)
	return document, err
}

func scanClientDocument(row rowScanner) (*models.ClientDocument, error) {
	document := &models.ClientDocument{}
	err := row.Scan(&document.ID, &document.OrganisationID, &document.ClientID, &document.FileID, &document.DocumentName, &document.FileType, &document.Status, &document.ExpirationDate, &document.Remarks, &document.CreatedAt, &document.UpdatedAt, &document.DeletedAt)
	return document, err
}
