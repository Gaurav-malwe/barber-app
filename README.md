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

## Backend deployment (CDK)

1) Set up CDK tooling
	```bash
	cd cdk
	python3 -m venv .venv
	source .venv/bin/activate
	pip install -r requirements.txt
	cdk bootstrap aws://<account>/<region>
	```
2) Deploy data stack (VPC, Aurora, secret)
	```bash
	cdk deploy BarberDataStack --concurrency 2 [-c auroraPgVersion=15_4]
	```
3) Update the generated secret values (in AWS Secrets Manager) for `cors_origins` and `jwt_secret` as needed.
4) Deploy app stack (Lambda + HTTP API, optional custom domain)
	```bash
	cdk deploy BarberAppStack \
	  --concurrency 2 \
	  -c includeApp=true \
	  -c apiDomainName=api.example.com \
	  -c hostedZoneDomain=example.com
	```

## Deploying new changes (production)

1) Ensure Docker Desktop is running (Lambda bundling uses Docker).
2) Build the frontend static export:
	```bash
	cd frontend
	npm ci
	npm run build
	```
3) Deploy CDK stacks (from cdk/):
	```bash
	cd cdk
	source .venv/bin/activate
	cdk deploy BarberAppStack \
	  --concurrency 2 \
	  -c includeApp=true \
	  -c apiDomainName=api.groomly.synkrustech.com \
	  -c hostedZoneDomain=synkrustech.com \
	  -c frontendDomainName=groomly.synkrustech.com
	```
4) Run database migrations (required after any schema change):
	```bash
	aws lambda invoke \
	  --function-name <MigrationFunctionName> \
	  --cli-binary-format raw-in-base64-out \
	  --payload '{}' \
	  --profile synkrustech \
	  /tmp/migrate-output.json
	```
5) Validate:
	- OPTIONS and POST to /api/auth/register return Access-Control-Allow-Origin.
	- POST returns 422 for empty payload (expected) instead of 500.
	- /login and /register load from CloudFront without 403/404.
