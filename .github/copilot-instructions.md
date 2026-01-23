Deployment Instructions and Lessons Learned

Project Overview
- Frontend: Next.js static export hosted on S3 + CloudFront.
- Backend: FastAPI + Mangum on Lambda behind API Gateway HTTP API + custom domain.
- Infra: AWS CDK (Python) in cdk/ with BarberDataStack and BarberAppStack.

Required Preconditions
- Docker Desktop must be running before any CDK deploy. Lambda bundling uses Docker.
- AWS profile configured (synkrustech) and correct region (ap-south-1).
- Secrets Manager AppConfigSecret must include database_url, jwt_secret, cors_origins, environment.

Deployment Steps (CDK)
1) Deploy data stack and app stack via CDK from cdk/.
2) Confirm outputs:
   - HttpApiEndpoint
   - LambdaFunctionName
   - MigrationFunctionName
   - FrontendBucketName
   - FrontendDistributionDomain

Database Migrations (Required)
- The API will 500 if tables are missing (users table). This causes browser CORS errors.
- Run the Migration Lambda after deploy to apply Alembic migrations.
- Migration entrypoint: backend/app/migrate.py
- Bundling excludes the alembic folder and copies it to alembic_migrations.
- The migration Lambda uses script_location=alembic_migrations.

Frontend Static Export Notes
- Next.js is exported to frontend/out.
- CloudFront function rewrites /login and /register to .html.
- Bucket deployments split:
  - _next/static with long cache
  - HTML with short cache
  - Other assets with long cache
- Invalidate CloudFront when HTML routes are updated.

CORS Configuration
- CORSMiddleware reads CORS_ORIGINS from Secrets Manager.
- cors_origins supports comma-separated or JSON array string.
- Trailing slashes are stripped in settings.cors_origins_list.
- Preflight should return 200 with Access-Control-Allow-Origin.

Do / Don’t (To and Fro History)
Do:
- Keep Docker running before any CDK deploy.
- Run MigrationFunction after deploy to create tables.
- Check Lambda logs when CORS errors appear; 500s remove CORS headers.
- Ensure cors_origins in Secrets Manager matches the frontend domain exactly.
- Use CloudFront URL rewrite function for static Next.js routes.

Don’t:
- Don’t assume CORS is wrong when API returns 500.
- Don’t deploy without migrations; requests will fail with missing tables.
- Don’t remove _next/static assets from S3 or prune assets incorrectly.
- Don’t rely on dynamic Next.js routes when using static export.
- Don’t set Docker platform in CDK unless supported by aws-cdk version.

Validation Checklist
- OPTIONS and POST to /api/auth/register return Access-Control-Allow-Origin.
- POST returns 422 for empty payload (expected) instead of 500.
- /login and /register load from CloudFront without 403/404.
