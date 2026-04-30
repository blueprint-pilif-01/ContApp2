package postgres

import (
	"database/sql"
	"log/slog"
	"time"
)

const dbTimeout = 3 * time.Second

type PostgresDBRepo struct {
	DB     *sql.DB
	Logger *slog.Logger
}

func New(db *sql.DB, logger *slog.Logger) *PostgresDBRepo {
	return &PostgresDBRepo{
		DB:     db,
		Logger: logger,
	}
}

func (r *PostgresDBRepo) Connection() *sql.DB {
	return r.DB
}
