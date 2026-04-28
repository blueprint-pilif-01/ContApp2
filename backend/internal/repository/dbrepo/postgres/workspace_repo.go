package postgres

import (
	"backend/internal/models"
	"context"
)

func (r *PostgresDBRepo) CreateWorkspaceNote(ctx context.Context, note *models.WorkspaceNote) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		INSERT INTO workspace_notes (
			organisation_id, owner_user_id, client_id, visibility, title, body, pinned
		)
		VALUES ($1, $2, $3, COALESCE(NULLIF($4, ''), 'personal'), $5, $6, $7)
		RETURNING id, visibility, created_at, updated_at
	`, note.OrganisationID, note.OwnerUserID, note.ClientID, note.Visibility, note.Title, note.Body, note.Pinned).
		Scan(&note.ID, &note.Visibility, &note.CreatedAt, &note.UpdatedAt)
}

func (r *PostgresDBRepo) ListWorkspaceNotes(ctx context.Context, organisationID, membershipID int64) ([]models.WorkspaceNote, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, owner_user_id, client_id, visibility, title, body,
			pinned, created_at, updated_at, deleted_at
		FROM workspace_notes
		WHERE organisation_id = $1
			AND deleted_at IS NULL
			AND (visibility = 'shared' OR owner_user_id = $2)
		ORDER BY pinned DESC, updated_at DESC
	`, organisationID, membershipID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	notes := make([]models.WorkspaceNote, 0)
	for rows.Next() {
		note, err := scanWorkspaceNote(rows)
		if err != nil {
			return nil, err
		}
		notes = append(notes, *note)
	}
	return notes, rows.Err()
}

func (r *PostgresDBRepo) GetWorkspaceNote(ctx context.Context, organisationID, membershipID, id int64) (*models.WorkspaceNote, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return scanWorkspaceNote(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, owner_user_id, client_id, visibility, title, body,
			pinned, created_at, updated_at, deleted_at
		FROM workspace_notes
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
			AND (visibility = 'shared' OR owner_user_id = $3)
	`, organisationID, id, membershipID))
}

func (r *PostgresDBRepo) UpdateWorkspaceNote(ctx context.Context, note *models.WorkspaceNote) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		UPDATE workspace_notes
		SET client_id = $4,
			visibility = COALESCE(NULLIF($5, ''), visibility),
			title = $6,
			body = $7,
			pinned = $8,
			updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND owner_user_id = $3 AND deleted_at IS NULL
		RETURNING updated_at
	`, note.OrganisationID, note.ID, note.OwnerUserID, note.ClientID, note.Visibility, note.Title, note.Body, note.Pinned).
		Scan(&note.UpdatedAt)
}

func (r *PostgresDBRepo) DeleteWorkspaceNote(ctx context.Context, organisationID, membershipID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	_, err := r.DB.ExecContext(ctx, `
		UPDATE workspace_notes SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND owner_user_id = $3 AND deleted_at IS NULL
	`, organisationID, id, membershipID)
	return err
}

func scanWorkspaceNote(row rowScanner) (*models.WorkspaceNote, error) {
	note := &models.WorkspaceNote{}
	err := row.Scan(&note.ID, &note.OrganisationID, &note.OwnerUserID, &note.ClientID, &note.Visibility, &note.Title, &note.Body, &note.Pinned, &note.CreatedAt, &note.UpdatedAt, &note.DeletedAt)
	return note, err
}
