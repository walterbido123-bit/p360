# Phase 3.2 — Staging & Integration Testing

## Isolation guarantees
- Use `docker-compose.staging.yml`, never production infrastructure.
- All ports bind to localhost.
- `PUBLISHING_ENABLED=false` is forced inside n8n.
- No Publisher or WordPress service exists in the staging compose file.
- n8n workflows remain inactive until manually imported and tested.

## Required secrets (local/staging secret store only)
Generate random values for `POSTGRES_PASSWORD`, `SOURCE_SERVICE_TOKEN`, `AGENT_SERVICE_TOKEN`, and `N8N_ENCRYPTION_KEY`. `OPENAI_API_KEY` is optional for dry-run and required only for real editorial-model testing. Sports provider keys are optional per adapter.

## Start
`docker compose --env-file .env.staging -f docker-compose.staging.yml up --build`

## Test layers
1. Health checks for Source Engine and Editorial Engine.
2. Real public RSS ingestion -> Redis idempotency -> PostgreSQL fingerprint persistence.
3. Agent chain with `dryRun=true` using `scripts/staging-smoke.sh`.
4. After dry-run passes, run one fixture with `dryRun=false` and a staging OpenAI key. Inspect every JSON result manually.
5. Import the corrected `02-editorial-pipeline.json` and test n8n manually.
6. Do not add Publisher/WordPress until a separate approval gate.

## Sports verification
Verified API-Football IDs: Premier League 39, La Liga 140, Bundesliga 78, Serie A 135, Ligue 1 61, Eredivisie 88, Eliteserien 103, MLS 253, UEFA Champions League 2. MLB uses MLB StatsAPI sportId 1. Caribbean catalog coverage includes LIDOM, LBPRC and LVBP; provider league IDs remain null until resolved from the authenticated API. Do not guess IDs.

## Definition of done
A real Internet item is fetched, normalized, claimed in Redis, persisted once in PostgreSQL, passed through Supervisor -> Research -> Classifier -> Writer -> Fact-check -> Editor -> SEO, and execution ends without any WordPress request. Store logs and sample JSON as staging evidence before advancing.
