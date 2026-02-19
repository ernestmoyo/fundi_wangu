# ──────────────────────────────────────────────────
# Fundi Wangu — Makefile
# Common development and deployment commands
# ──────────────────────────────────────────────────

.PHONY: help dev dev-up dev-down dev-logs migrate test lint build \
        prod-up prod-down prod-logs prod-deploy backup ssl-init

# ── Development ──────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start local development (API with hot reload)
	cd infrastructure && docker compose up -d postgres redis
	cd services/api && npx tsx watch src/server.ts

dev-up: ## Start all local Docker services
	cd infrastructure && docker compose up -d

dev-down: ## Stop all local Docker services
	cd infrastructure && docker compose down

dev-logs: ## Tail logs from local Docker services
	cd infrastructure && docker compose logs -f --tail=50

migrate: ## Run database migrations
	cd services/api && npx tsx src/db/migrate.ts

test: ## Run all tests
	npm run test

lint: ## Run linter and type checker
	npm run lint && npm run typecheck

build: ## Build all packages and apps
	npm run build

# ── Production ───────────────────────────────────

prod-up: ## Start production stack
	cd infrastructure && docker compose -f docker-compose.production.yml up -d

prod-down: ## Stop production stack
	cd infrastructure && docker compose -f docker-compose.production.yml down

prod-logs: ## Tail production logs
	cd infrastructure && docker compose -f docker-compose.production.yml logs -f --tail=100

prod-deploy: ## Deploy a version (usage: make prod-deploy VERSION=v0.1.0)
	./infrastructure/scripts/deploy.sh $(VERSION) production

backup: ## Run a manual database backup
	cd infrastructure && docker compose -f docker-compose.production.yml exec db-backup /usr/local/bin/backup.sh

ssl-init: ## Initialize SSL certificates (usage: make ssl-init EMAIL=admin@fundiwangu.co.tz)
	./infrastructure/scripts/ssl-init.sh $(EMAIL)

# ── Utilities ────────────────────────────────────

db-shell: ## Open a PostgreSQL shell
	cd infrastructure && docker compose exec postgres psql -U fundiwangu -d fundiwangu

redis-shell: ## Open a Redis CLI
	cd infrastructure && docker compose exec redis redis-cli

clean: ## Clean build artifacts
	rm -rf services/api/dist apps/web/.next apps/admin/.next .turbo node_modules/.cache
