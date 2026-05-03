SHELL := /bin/bash

.DEFAULT_GOAL := help

BACKEND_DIR := backend
FRONTEND_DIR := frontend
COMPOSE_FILE := $(BACKEND_DIR)/configs/docker-compose.yml
GO_ENV := GOCACHE=$$(pwd)/.gocache
FRONTEND_DEV_HOST ?= 0.0.0.0
FRONTEND_DEV_PORT ?= 5173

.PHONY: help ensure-env db-up db-wait db-down db-reset migrate-up migrate-down migrate-status seed-db backend frontend frontend-terminal frontend-install frontend-build frontend-preview frontend-typecheck frontend-lint check-frontend dev-up dev-up-no-migrate dev-up-inline dev-up-no-migrate-inline test-backend test-frontend test

help:
	@echo "Available targets:"
	@echo "  make dev-up               - Start DB, migrate, open frontend terminal, then run backend here"
	@echo "  make dev-up-no-migrate    - Start DB, open frontend terminal, then run backend here"
	@echo "  make dev-up-inline        - Start backend + frontend in this terminal"
	@echo "  make dev-down             - Stop Postgres container"
	@echo "  make db-up                - Start Postgres container"
	@echo "  make db-wait              - Wait until Postgres is healthy"
	@echo "  make db-down              - Stop Postgres container"
	@echo "  make db-reset             - Reset DB volume (destructive)"
	@echo "  make migrate-up           - Apply backend migrations"
	@echo "  make migrate-down         - Roll back one backend migration"
	@echo "  make migrate-status       - Show backend migration status"
	@echo "  make seed-db              - Insert local demo data"
	@echo "  make backend              - Run backend only"
	@echo "  make frontend             - Run frontend only"
	@echo "  make frontend-terminal    - Open frontend dev server in a new terminal"
	@echo "  make frontend-install     - Install frontend dependencies with npm ci"
	@echo "  make frontend-build       - Build frontend production assets"
	@echo "  make frontend-preview     - Preview built frontend locally"
	@echo "  make frontend-typecheck   - Run frontend TypeScript checks"
	@echo "  make frontend-lint        - Run frontend lint"
	@echo "  make check-frontend       - Typecheck, lint, test, and build frontend"
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
	$(MAKE) db-wait

db-wait:
	@set -euo pipefail; \
	container="$$(docker compose -f "$(COMPOSE_FILE)" ps -q postgres)"; \
	if [ -z "$$container" ]; then \
		echo "Postgres container was not created."; \
		exit 1; \
	fi; \
	echo "Waiting for Postgres to become healthy..."; \
	for i in $$(seq 1 30); do \
		status="$$(docker inspect -f '{{.State.Health.Status}}' "$$container" 2>/dev/null || true)"; \
		if [ "$$status" = "healthy" ]; then \
			echo "Postgres is healthy."; \
			exit 0; \
		fi; \
		if [ "$$status" = "unhealthy" ]; then \
			echo "Postgres healthcheck is unhealthy."; \
			docker compose -f "$(COMPOSE_FILE)" logs --tail=80 postgres; \
			exit 1; \
		fi; \
		sleep 1; \
	done; \
	echo "Timed out waiting for Postgres healthcheck."; \
	docker compose -f "$(COMPOSE_FILE)" logs --tail=80 postgres; \
	exit 1

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
	cd "$(FRONTEND_DIR)" && npm run dev -- --host "$(FRONTEND_DEV_HOST)" --port "$(FRONTEND_DEV_PORT)"

frontend-terminal: ensure-env
	@set -euo pipefail; \
	cmd='cd "$(CURDIR)/$(FRONTEND_DIR)" && npm run dev -- --host "$(FRONTEND_DEV_HOST)" --port "$(FRONTEND_DEV_PORT)"; exec bash'; \
	echo "Opening frontend terminal on http://localhost:$(FRONTEND_DEV_PORT)"; \
	if command -v gnome-terminal >/dev/null 2>&1; then \
		gnome-terminal --title="ContApp2 frontend" -- bash -lc "$$cmd"; \
	elif command -v kgx >/dev/null 2>&1; then \
		kgx --title="ContApp2 frontend" -- bash -lc "$$cmd"; \
	elif command -v konsole >/dev/null 2>&1; then \
		konsole --new-tab --workdir "$(CURDIR)/$(FRONTEND_DIR)" -e bash -lc "$$cmd"; \
	elif command -v xfce4-terminal >/dev/null 2>&1; then \
		xfce4-terminal --title="ContApp2 frontend" --command="bash -lc '$$cmd'"; \
	elif command -v xterm >/dev/null 2>&1; then \
		xterm -T "ContApp2 frontend" -e bash -lc "$$cmd"; \
	elif command -v alacritty >/dev/null 2>&1; then \
		alacritty --title "ContApp2 frontend" -e bash -lc "$$cmd"; \
	elif command -v kitty >/dev/null 2>&1; then \
		kitty --title "ContApp2 frontend" bash -lc "$$cmd"; \
	else \
		echo "No supported terminal emulator found."; \
		echo "Open another terminal and run: make frontend"; \
		exit 1; \
	fi

frontend-install:
	cd "$(FRONTEND_DIR)" && npm ci

frontend-build: ensure-env
	cd "$(FRONTEND_DIR)" && npm run build

frontend-preview: ensure-env
	cd "$(FRONTEND_DIR)" && npm run preview -- --host "$(FRONTEND_DEV_HOST)" --port "$(FRONTEND_DEV_PORT)"

frontend-typecheck:
	cd "$(FRONTEND_DIR)" && npm run typecheck

frontend-lint:
	cd "$(FRONTEND_DIR)" && npm run lint

check-frontend: frontend-typecheck frontend-lint test-frontend frontend-build

dev-up: ensure-env db-up migrate-up frontend-terminal
	@echo "Starting backend in this terminal..."
	cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/api

dev-up-no-migrate: ensure-env db-up frontend-terminal
	@echo "Starting backend in this terminal..."
	cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/api

dev-up-inline: ensure-env db-up migrate-up
	@set -euo pipefail; \
	echo "Starting backend..."; \
	(cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/api) & \
	BACK_PID=$$!; \
	echo "Starting frontend on http://localhost:$(FRONTEND_DEV_PORT)"; \
	(cd "$(FRONTEND_DIR)" && npm run dev -- --host "$(FRONTEND_DEV_HOST)" --port "$(FRONTEND_DEV_PORT)") & \
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

dev-up-no-migrate-inline: ensure-env db-up
	@set -euo pipefail; \
	echo "Starting backend..."; \
	(cd "$(BACKEND_DIR)" && $(GO_ENV) go run ./cmd/api) & \
	BACK_PID=$$!; \
	echo "Starting frontend on http://localhost:$(FRONTEND_DEV_PORT)"; \
	(cd "$(FRONTEND_DIR)" && npm run dev -- --host "$(FRONTEND_DEV_HOST)" --port "$(FRONTEND_DEV_PORT)") & \
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
