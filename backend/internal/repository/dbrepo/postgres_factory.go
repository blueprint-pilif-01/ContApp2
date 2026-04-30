package dbrepo

import (
	"backend/internal/repository/dbrepo/postgres"
	"database/sql"
	"log/slog"
)

func NewPostgresDBRepo(db *sql.DB, logger *slog.Logger) *postgres.PostgresDBRepo {
	return postgres.New(db, logger)
}
