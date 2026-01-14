# CDK deployment (Python)

Split stacks: Data (VPC, endpoints, Aurora Serverless v2, secret) and App (Lambda + HTTP API + optional custom domain).

## Prereqs
- Python 3.12
- AWS CLI configured
- CDK CLI installed (`npm install -g aws-cdk`)

## Setup
```bash
cd cdk
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cdk bootstrap aws://<account>/<region>
```

## Deploy
```bash
cdk synth

# 1) Deploy data stack (does not require Docker)
cdk deploy BarberDataStack \
  --concurrency 2

# If Aurora creation fails with "Cannot find version X.Y", override via context:
#   -c auroraPgVersion=15_4
# (maps to CDK enum rds.AuroraPostgresEngineVersion.VER_15_4)
# Example:
#   cdk deploy BarberDataStack --concurrency 2 -c auroraPgVersion=15_4

# 2) Deploy app stack (requires Docker for bundling with aws-lambda-python-alpha)
cdk deploy BarberAppStack \
  --concurrency 2 \
  -c includeApp=true \
  -c apiDomainName=api.example.com \
  -c hostedZoneDomain=example.com
```

## Notes
- Data stack creates: VPC (no NAT), interface endpoints (Secrets Manager, CloudWatch Logs, STS), Aurora Serverless v2 (0.5–2 ACU), and a single JSON secret with DB and app settings.
- App stack creates: Lambda (FastAPI via Mangum), HTTP API, optional custom domain + Route53/ACM when `apiDomainName` and `hostedZoneDomain` context values are provided.
- Lambda env values resolve directly from Secrets Manager (`database_url`, `jwt_secret`, `cors_origins`, `environment`).
- Update `cors_origins` and `jwt_secret` in the secret after first deploy; RDS password is auto-generated.
