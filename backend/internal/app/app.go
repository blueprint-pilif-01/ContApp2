package app

import (
	"backend/internal/config"
	"backend/internal/platform/auth"
	platformdb "backend/internal/platform/db"
	platformlogger "backend/internal/platform/logger"
	"backend/internal/repository"
	"backend/internal/repository/dbrepo"
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	Config config.Config
	Pool   *pgxpool.Pool
	SQL    *sql.DB
	Repo   repository.DatabaseRepo
	Tokens auth.TokenManager
	Logger *slog.Logger
}

func New(ctx context.Context) (*App, func(), error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, nil, err
	}

	logger := platformlogger.New(cfg.AppEnv, os.Stdout)

	pool, err := platformdb.OpenPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, nil, err
	}

	sqlDB, err := platformdb.OpenSQL(ctx, cfg.DatabaseURL)
	if err != nil {
		pool.Close()
		return nil, nil, err
	}

	migrationVersion, err := platformdb.CurrentMigrationVersion(sqlDB)
	if err != nil {
		sqlDB.Close()
		pool.Close()
		return nil, nil, err
	}
	logger.Info("database connected", "migration_version", migrationVersion)

	cleanup := func() {
		sqlDB.Close()
		pool.Close()
	}

	return &App{
		Config: cfg,
		Pool:   pool,
		SQL:    sqlDB,
		Repo:   dbrepo.NewPostgresDBRepo(sqlDB, logger),
		Tokens: auth.NewTokenManager(cfg.JWTSecret, cfg.JWTIssuer, cfg.JWTAudience, cfg.AccessTokenTTL),
		Logger: logger,
	}, cleanup, nil
}

func Run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	app, cleanup, err := New(ctx)
	if err != nil {
		return err
	}
	defer cleanup()

	server := &http.Server{
		Addr:              app.Config.HTTPAddr,
		Handler:           app.routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		app.Logger.Info("api listening", "addr", app.Config.HTTPAddr)
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return server.Shutdown(shutdownCtx)
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}
