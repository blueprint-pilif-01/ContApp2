package postgres

import (
	"backend/internal/models"
	"context"
)

func (r *PostgresDBRepo) CreateTicketingTask(ctx context.Context, task *models.TicketingTask) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		INSERT INTO ticketing_tasks (
			organisation_id, created_by_id, assignee_user_id, client_id, title, description,
			status, priority, source_type, source_id, due_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, COALESCE(NULLIF($7, ''), 'todo'), COALESCE(NULLIF($8, ''), 'normal'), $9, $10, $11)
		RETURNING id, status, priority, created_at, updated_at
	`, task.OrganisationID, task.CreatedByID, task.AssigneeUserID, task.ClientID, task.Title, task.Description, task.Status, task.Priority, task.SourceType, task.SourceID, task.DueAt).
		Scan(&task.ID, &task.Status, &task.Priority, &task.CreatedAt, &task.UpdatedAt)
}

func (r *PostgresDBRepo) ListTicketingTasks(ctx context.Context, organisationID int64) ([]models.TicketingTask, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, organisation_id, created_by_id, assignee_user_id, client_id, title,
			description, status, priority, source_type, source_id, due_at, claimed_at,
			completed_at, refused_at, created_at, updated_at, deleted_at
		FROM ticketing_tasks
		WHERE organisation_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tasks := make([]models.TicketingTask, 0)
	for rows.Next() {
		task, err := scanTicketingTask(rows)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, *task)
	}
	return tasks, rows.Err()
}

func (r *PostgresDBRepo) GetTicketingTask(ctx context.Context, organisationID, id int64) (*models.TicketingTask, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return scanTicketingTask(r.DB.QueryRowContext(ctx, `
		SELECT id, organisation_id, created_by_id, assignee_user_id, client_id, title,
			description, status, priority, source_type, source_id, due_at, claimed_at,
			completed_at, refused_at, created_at, updated_at, deleted_at
		FROM ticketing_tasks
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id))
}

func (r *PostgresDBRepo) UpdateTicketingTask(ctx context.Context, task *models.TicketingTask) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.DB.QueryRowContext(ctx, `
		UPDATE ticketing_tasks
		SET assignee_user_id = $3,
			client_id = $4,
			title = $5,
			description = $6,
			status = COALESCE(NULLIF($7, ''), status),
			priority = COALESCE(NULLIF($8, ''), priority),
			source_type = $9,
			source_id = $10,
			due_at = $11,
			claimed_at = $12,
			completed_at = $13,
			refused_at = $14,
			updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
		RETURNING updated_at
	`, task.OrganisationID, task.ID, task.AssigneeUserID, task.ClientID, task.Title, task.Description, task.Status, task.Priority, task.SourceType, task.SourceID, task.DueAt, task.ClaimedAt, task.CompletedAt, task.RefusedAt).
		Scan(&task.UpdatedAt)
}

func (r *PostgresDBRepo) DeleteTicketingTask(ctx context.Context, organisationID, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	_, err := r.DB.ExecContext(ctx, `
		UPDATE ticketing_tasks SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1 AND id = $2 AND deleted_at IS NULL
	`, organisationID, id)
	return err
}

func scanTicketingTask(row rowScanner) (*models.TicketingTask, error) {
	task := &models.TicketingTask{}
	err := row.Scan(&task.ID, &task.OrganisationID, &task.CreatedByID, &task.AssigneeUserID, &task.ClientID, &task.Title, &task.Description, &task.Status, &task.Priority, &task.SourceType, &task.SourceID, &task.DueAt, &task.ClaimedAt, &task.CompletedAt, &task.RefusedAt, &task.CreatedAt, &task.UpdatedAt, &task.DeletedAt)
	return task, err
}
