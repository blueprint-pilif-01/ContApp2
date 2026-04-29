package db

import (
	"database/sql"

	"github.com/pressly/goose/v3"
)

func MigrateUp(db *sql.DB, dir string) error {
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Up(db, dir)
}

func MigrateDown(db *sql.DB, dir string) error {
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Down(db, dir)
}

func MigrateStatus(db *sql.DB, dir string) error {
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Status(db, dir)
}

func CurrentMigrationVersion(db *sql.DB) (int64, error) {
	if err := goose.SetDialect("postgres"); err != nil {
		return 0, err
	}
	return goose.GetDBVersion(db)
}
