SHELL := /bin/bash

.DEFAULT_GOAL := help

BACKEND_DIR := backend
FRONTEND_DIR := frontend
COMPOSE_FILE := $(BACKEND_DIR)/configs/docker-compose.yml
GO_ENV := GOCACHE=$$(pwd)/.gocache

.PHONY: help ensure-env db-up db-down db-reset migrate-up migrate-down migrate-status seed-db backend frontend dev-up dev-up-no-migrate test-backend test-frontend test

help:
	@echo "Available targets:"
	@echo "  make dev-up               - Start DB, run migrations, then backend + frontend"
	@echo "  make dev-up-no-migrate    - Start DB + backend + frontend without migrations"
	@echo "  make dev-down             - Stop Postgres container"
	@echo "  make db-up                - Start Postgres container"
	@echo "  make db-down              - Stop Postgres container"
	@echo "  make db-reset             - Reset DB volume (destructive)"
	@echo "  make migrate-up           - Apply backend migrations"
	@echo "  make migrate-down         - Roll back one backend migration"
	@echo "  make migrate-status       - Show backend migration status"
	@echo "  make seed-db              - Insert local demo data"
	@echo "  make backend              - Run backend only"
	@echo "  make frontend             - Run frontend only"
	@echo "  make test-backend         - Run backend tests"
	@echo "  make test-frontend        - Run frontend tests"
	@echo "  make test                 - Run backend + frontend tests"

ensure-env:
	@if [ ! -f "$(BACKEND_DIR)/.env" ]; then \
		cp "$(BACKEND_DIR)/.env.example" "$(BACKEND_DIR)/.env"; \
		echo "Created $(BACKEND_DIR)/.env from .env.example"; \
	fi
	@if [ -f "$(FRONTEND_DIR)/.env.example" ] && [ ! -f "$(FRONTEND_DIR)/.env" ] && [ ! -f "$(FRONTEND_DIR)/.env.development" ]; then \
		cp "$(FRONTEND_DIR)/.env.example" "$(FRONTEND_DIR)/.env"; \
		echo "Created $(FRONTEND_DIR)/.env from .env.example"; \
	fi

db-up:
	docker compose -f "$(COMPOSE_FILE)" up -d postgres

db-down:
	docker compose -f "$(COMPOSE_FILE)" down

dev-down: db-down

db-reset:
	docker compose -f "$(COMPOSE_FILE)" down -v

migrate-up: ensure-env db-up
	cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/migrate up

migrate-down: ensure-env db-up
	cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/migrate down

migrate-status: ensure-env db-up
	cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/migrate status

seed-db: ensure-env db-up migrate-up
	docker exec -i contapp2-postgres psql -U app_user -d contapp2 < "$(BACKEND_DIR)/configs/seed.sql"

backend: ensure-env db-up
	cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/api

frontend: ensure-env
	cd "$(FRONTEND_DIR)" && npm run dev

dev-up: ensure-env db-up migrate-up
	@set -euo pipefail; \
	echo "Starting backend..."; \
	(cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/api) & \
	BACK_PID=$$!; \
	echo "Starting frontend..."; \
	(cd "$(FRONTEND_DIR)" && npm run dev) & \
	FRONT_PID=$$!; \
	cleanup() { \
		echo ""; \
		echo "Stopping backend/frontend..."; \
		kill $$BACK_PID $$FRONT_PID 2>/dev/null || true; \
		wait $$BACK_PID 2>/dev/null || true; \
		wait $$FRONT_PID 2>/dev/null || true; \
	}; \
	trap cleanup INT TERM EXIT; \
	wait -n $$BACK_PID $$FRONT_PID

dev-up-no-migrate: ensure-env db-up
	@set -euo pipefail; \
	echo "Starting backend..."; \
	(cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/api) & \
	BACK_PID=$$!; \
	echo "Starting frontend..."; \
	(cd "$(FRONTEND_DIR)" && npm run dev) & \
	FRONT_PID=$$!; \
	cleanup() { \
		echo ""; \
		echo "Stopping backend/frontend..."; \
		kill $$BACK_PID $$FRONT_PID 2>/dev/null || true; \
		wait $$BACK_PID 2>/dev/null || true; \
		wait $$FRONT_PID 2>/dev/null || true; \
	}; \
	trap cleanup INT TERM EXIT; \
	wait -n $$BACK_PID $$FRONT_PID

test-backend:
	cd "$(BACKEND_DIR)" && $(GO_ENV) go test ./...

test-frontend:
	cd "$(FRONTEND_DIR)" && npm test

test: test-backend test-frontend
