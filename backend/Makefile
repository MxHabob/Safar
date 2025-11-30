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

migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create new migration (usage: make migrate-create MESSAGE="description")
	docker-compose exec backend alembic revision --autogenerate -m "$(MESSAGE)"

migrate-initial: ## Create initial migration (001_initial)
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

