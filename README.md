# Barber App (India) — MVP

Next.js frontend + FastAPI backend + Postgres.

## Product docs

- [docs/reports-and-discounts-prd.md](docs/reports-and-discounts-prd.md)

## Local development

### Option A: Run everything via Docker

```bash
docker compose up --build
```

Frontend: http://localhost:3000
Backend: http://localhost:8000
API docs: http://localhost:8000/docs

### Option B: Run Postgres in Docker + run apps locally

### 1) Start Postgres

```bash
docker compose up -d db
```

### 2) Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 3) Frontend

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:8000
API docs: http://localhost:8000/docs

## Environment variables

- Backend: copy `backend/.env.example` to `backend/.env` and adjust if needed.
- Frontend: copy `frontend/.env.local.example` to `frontend/.env.local`.

## Database migrations

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```
