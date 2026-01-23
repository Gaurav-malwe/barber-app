## Frontend build and deploy

- Dev server: `npm run dev` (requires `NEXT_PUBLIC_API_BASE_URL`, defaults to http://localhost:8000).
- Production build: `npm run build` runs `next build` (with `output: "export"`) and writes the static site to `out/`.

## S3 + CloudFront deployment (CDK)

1) Build the static site first:
	```bash
	cd frontend
	npm ci
	npm run build
	```
2) Deploy the CDK stack from `cdk/` with the frontend domain and hosted zone context, e.g.:
	```bash
	cd ../cdk
	cdk deploy BarberAppStack \
	  --context includeApp=true \
	  --context hostedZoneDomain=example.com \
	  --context apiDomainName=api.example.com \
	  --context frontendDomainName=app.example.com
	```

## Caching and invalidations

- `_next/static/*` and other assets: `Cache-Control: public,max-age=31536000,immutable` (no CloudFront invalidation needed).
- `*.html`: `Cache-Control: public,max-age=0,must-revalidate`; CloudFront invalidation is limited to HTML paths on deploy.
- Customer and receipt detail views now use query params (e.g., `/customers/view?id=...`, `/bill/receipt?id=...`) to work with static export.
