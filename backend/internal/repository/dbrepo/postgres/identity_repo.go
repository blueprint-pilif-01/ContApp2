package postgres

import (
	"backend/internal/models"
	"context"
	"database/sql"
	"errors"
	"time"
)

func (r *PostgresDBRepo) GetAdminByEmail(ctx context.Context, email string) (*models.Admin, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	admin := &models.Admin{}
	err := r.DB.QueryRowContext(ctx, `
		SELECT id, email, password_hash, first_name, last_name, status, created_at, updated_at
		FROM admins
		WHERE lower(email) = lower($1)
			AND status = 'active'
	`, email).Scan(
		&admin.ID,
		&admin.Email,
		&admin.PasswordHash,
		&admin.FirstName,
		&admin.LastName,
		&admin.Status,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return admin, nil
}

func (r *PostgresDBRepo) GetAdminByID(ctx context.Context, id int64) (*models.Admin, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	admin := &models.Admin{}
	err := r.DB.QueryRowContext(ctx, `
		SELECT id, email, password_hash, first_name, last_name, status, created_at, updated_at
		FROM admins
		WHERE id = $1
			AND status = 'active'
	`, id).Scan(
		&admin.ID,
		&admin.Email,
		&admin.PasswordHash,
		&admin.FirstName,
		&admin.LastName,
		&admin.Status,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return admin, nil
}

func (r *PostgresDBRepo) GetAccountByEmail(ctx context.Context, email string) (*models.Account, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.scanAccount(r.DB.QueryRowContext(ctx, `
		SELECT id, email, password_hash, first_name, last_name, phone, status, last_login_at, created_at, updated_at, deleted_at
		FROM accounts
		WHERE lower(email) = lower($1)
			AND status = 'active'
			AND deleted_at IS NULL
	`, email))
}

func (r *PostgresDBRepo) GetAccountByID(ctx context.Context, id int64) (*models.Account, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()
	return r.scanAccount(r.DB.QueryRowContext(ctx, `
		SELECT id, email, password_hash, first_name, last_name, phone, status, last_login_at, created_at, updated_at, deleted_at
		FROM accounts
		WHERE id = $1
			AND status = 'active'
			AND deleted_at IS NULL
	`, id))
}

func (r *PostgresDBRepo) UpdateAccountLastLogin(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, `
		UPDATE accounts
		SET last_login_at = now(), updated_at = now()
		WHERE id = $1
			AND deleted_at IS NULL
	`, id)
	return err
}

func (r *PostgresDBRepo) ListAccountWorkspaces(ctx context.Context, accountID int64) ([]models.AccountWorkspace, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT m.id, m.organisation_id, o.name, m.display_name, m.job_title
		FROM organisation_memberships m
		JOIN organisations o ON o.id = m.organisation_id
		WHERE m.account_id = $1
			AND m.status = 'active'
			AND m.deleted_at IS NULL
			AND o.status = 'active'
			AND o.deleted_at IS NULL
		ORDER BY o.name ASC, m.id ASC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	workspaces := make([]models.AccountWorkspace, 0)
	for rows.Next() {
		var workspace models.AccountWorkspace
		if err := rows.Scan(
			&workspace.MembershipID,
			&workspace.OrganisationID,
			&workspace.Organisation,
			&workspace.DisplayName,
			&workspace.JobTitle,
		); err != nil {
			return nil, err
		}
		workspaces = append(workspaces, workspace)
	}
	return workspaces, rows.Err()
}

func (r *PostgresDBRepo) GetAccountWorkspace(ctx context.Context, accountID, organisationID int64) (*models.AccountWorkspace, error) {
	workspaces, err := r.ListAccountWorkspaces(ctx, accountID)
	if err != nil {
		return nil, err
	}
	for _, workspace := range workspaces {
		if workspace.OrganisationID == organisationID {
			return &workspace, nil
		}
	}
	return nil, sql.ErrNoRows
}

func (r *PostgresDBRepo) CreateRefreshSession(ctx context.Context, session *models.RefreshSession) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	return r.DB.QueryRowContext(ctx, `
		INSERT INTO refresh_sessions (
			jti, actor_type, subject_id, active_organisation_id, active_membership_id, expires_at
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`, session.JTI, session.ActorType, session.SubjectID, session.ActiveOrganisationID, session.ActiveMembershipID, session.ExpiresAt).Scan(
		&session.ID,
		&session.CreatedAt,
	)
}

func (r *PostgresDBRepo) GetRefreshSessionByJTI(ctx context.Context, jti string) (*models.RefreshSession, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	session := &models.RefreshSession{}
	err := r.DB.QueryRowContext(ctx, `
		SELECT id, jti, actor_type, subject_id, active_organisation_id, active_membership_id, expires_at, revoked_at, created_at
		FROM refresh_sessions
		WHERE jti = $1
	`, jti).Scan(
		&session.ID,
		&session.JTI,
		&session.ActorType,
		&session.SubjectID,
		&session.ActiveOrganisationID,
		&session.ActiveMembershipID,
		&session.ExpiresAt,
		&session.RevokedAt,
		&session.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if session.RevokedAt != nil {
		return nil, errors.New("refresh session revoked")
	}
	if time.Now().UTC().After(session.ExpiresAt) {
		return nil, errors.New("refresh session expired")
	}
	return session, nil
}

func (r *PostgresDBRepo) RevokeRefreshSessionByJTI(ctx context.Context, jti string) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, `
		UPDATE refresh_sessions
		SET revoked_at = COALESCE(revoked_at, now())
		WHERE jti = $1
	`, jti)
	return err
}

func (r *PostgresDBRepo) RecordAccessTokenLogout(ctx context.Context, actorType string, subjectID int64, organisationID, membershipID *int64, loggedOutAt time.Time) error {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, `
		INSERT INTO access_token_logout_events (
			actor_type, subject_id, organisation_id, membership_id, logged_out_at
		)
		VALUES ($1, $2, $3, $4, $5)
	`, actorType, subjectID, organisationID, membershipID, loggedOutAt)
	return err
}

func (r *PostgresDBRepo) IsAccessTokenLoggedOut(ctx context.Context, actorType string, subjectID int64, issuedAt time.Time) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	var exists bool
	err := r.DB.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM access_token_logout_events
			WHERE actor_type = $1
				AND subject_id = $2
				AND logged_out_at >= $3
		)
	`, actorType, subjectID, issuedAt).Scan(&exists)
	return exists, err
}

type rowScanner interface {
	Scan(dest ...any) error
}

func (r *PostgresDBRepo) scanAccount(row rowScanner) (*models.Account, error) {
	account := &models.Account{}
	err := row.Scan(
		&account.ID,
		&account.Email,
		&account.PasswordHash,
		&account.FirstName,
		&account.LastName,
		&account.Phone,
		&account.Status,
		&account.LastLoginAt,
		&account.CreatedAt,
		&account.UpdatedAt,
		&account.DeletedAt,
	)
	if err != nil {
		return nil, err
	}
	return account, nil
}
