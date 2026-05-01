package main

import (
	"backend/internal/config"
	platformdb "backend/internal/platform/db"
	"context"
	"fmt"
	"log/slog"
	"os"
)

func main() {
	if err := run(); err != nil {
		slog.Error("migration command failed", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	db, err := platformdb.OpenSQL(context.Background(), cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer db.Close()

	command := "up"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}

	switch command {
	case "up":
		return platformdb.MigrateUp(db, cfg.MigrationsDir)
	case "down":
		return platformdb.MigrateDown(db, cfg.MigrationsDir)
	case "status":
		return platformdb.MigrateStatus(db, cfg.MigrationsDir)
	default:
		return fmt.Errorf("unknown migration command %q; use up, down, or status", command)
	}
}
