# Fundi Wangu — Developer Onboarding

Target: From clone to first running API in 30 minutes.

## Prerequisites

- **Node.js** 20 LTS or later
- **Docker** and **Docker Compose** (for PostgreSQL + Redis)
- **Git**

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/ernestmoyo/fundi_wangu.git
cd fundi_wangu
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment

```bash
cp .env.example .env
```

The defaults in `.env.example` work for local development with Docker.

### 4. Start infrastructure

```bash
cd infrastructure
docker compose up -d
cd ..
```

This starts:
- **PostgreSQL 16 + PostGIS** on port 5432
- **Redis 7** on port 6379

### 5. Run database migrations

```bash
cd services/api
# Run all migration SQL files against the local database
for f in migrations/*.sql; do
  psql "postgresql://fundiwangu:local_dev_password@localhost:5432/fundiwangu" -f "$f"
done
cd ../..
```

### 6. Start the API in development mode

```bash
npm run dev --workspace=@fundi-wangu/api
```

The API will be available at `http://localhost:3000`.

### 7. Verify it works

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "...",
    "db": "connected",
    "redis": "connected"
  }
}
```

## Project Structure

```
fundi-wangu/
├── apps/               # Client applications (mobile, web, admin)
├── packages/           # Shared libraries
│   ├── shared-types/   # TypeScript interfaces and enums
│   ├── i18n-strings/   # Bilingual strings (Swahili + English)
│   └── utils/          # Currency, phone, date utilities
├── services/
│   └── api/            # Express backend API
│       ├── src/
│       │   ├── routes/         # Route definitions
│       │   ├── controllers/    # Request handlers
│       │   ├── services/       # Business logic
│       │   ├── middleware/     # Auth, validation, rate limiting
│       │   ├── db/             # PostgreSQL and Redis clients
│       │   ├── jobs/           # BullMQ async job queues
│       │   └── integrations/   # Selcom, Africa's Talking, FCM
│       └── migrations/         # SQL migration files
├── infrastructure/     # Docker, nginx, scripts
└── docs/               # Documentation
```

## Key Conventions

- **TypeScript strict mode** everywhere. No `any` types.
- **Swahili is the primary language.** English is derived from it.
- **All monetary values** are integers in TZS (no floats).
- **All timestamps** are UTC. Convert to EAT (UTC+3) at presentation layer.
- **UUIDs** for all primary keys.
- **Conventional Commits** for git messages (`feat:`, `fix:`, `chore:`).
- **Parameterised SQL** only. Never concatenate user input into queries.

## Running Tests

```bash
npm run test
```

## Common Tasks

| Task | Command |
|------|---------|
| Start all services | `npm run dev` |
| Run tests | `npm run test` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Format code | `npm run format` |
| Build all | `npm run build` |
