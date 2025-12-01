# Makefile for Safar Backend
.PHONY: help build up down restart logs shell test clean migrate

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-db: ## Show database logs
	docker-compose logs -f postgres

shell: ## Open shell in backend container
	docker-compose exec backend /bin/bash

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U safar_user -d safar_db

test: ## Run tests
	docker-compose exec backend pytest

test-cov: ## Run tests with coverage report
	docker-compose exec backend pytest --cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=70

test-cov-local: ## Run tests with coverage (local, no docker)
	pytest --cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=70

test-unit: ## Run unit tests only
	docker-compose exec backend pytest tests/unit -v

test-integration: ## Run integration tests only
	docker-compose exec backend pytest tests/integration -v

test-e2e: ## Run E2E tests only
	docker-compose exec backend pytest tests/e2e -v

test-fast: ## Run tests without coverage (faster)
	docker-compose exec backend pytest --no-cov -v

coverage: ## Generate and open coverage report
	docker-compose exec backend pytest --cov=app --cov-report=html
	@echo "Coverage report generated at htmlcov/index.html"

coverage-check: ## Check if coverage meets threshold (70%)
	docker-compose exec backend pytest --cov=app --cov-report=term --cov-fail-under=70

migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create new migration (usage: make migrate-create MESSAGE="description")
	docker-compose exec backend alembic revision --autogenerate -m "$(MESSAGE)"

migrate-initial: ## Create initial migration (001_initial)
	docker-compose exec backend alembic revision --autogenerate -m "initial"

migrate-fix-and-create: ## Fix Alembic error and create initial migration
	docker-compose exec backend python scripts/fix_and_create_migration.py && \
	docker-compose exec backend alembic revision --autogenerate -m "initial"

init-db: ## Initialize database
	docker-compose exec backend python scripts/init_db.py

clean: ## Remove containers, volumes, and images
	docker-compose down -v --rmi all

clean-volumes: ## Remove all volumes
	docker-compose down -v

prod-up: ## Start production services
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

rebuild: ## Rebuild and restart services
	docker-compose up -d --build --force-recreate

health: ## Check health of all services
	docker-compose ps

