# Periodismo360 AI Newsroom — Architecture

## Status
Phase 1: infrastructure bootstrap.

## Production architecture

Sources/APIs/RSS/Webhooks -> n8n Orchestrator -> AI editorial agents -> WordPress Headless -> Next.js frontend -> CDN/hosting -> periodismo360.com

## Core layers

1. Ingestion: trusted feeds, APIs, sports/economy sources and webhooks.
2. Orchestration: n8n workflows with retries, idempotency and audit events.
3. AI agents: research, classification, deduplication, drafting, editing, verification, SEO, multimedia and publishing.
4. Editorial gate: confidence/risk scoring. Sensitive or low-confidence stories require human approval.
5. CMS: WordPress as editorial source of truth through authenticated REST endpoints.
6. Frontend: Next.js application consuming WordPress APIs with caching and revalidation.
7. Delivery: GitHub CI/CD plus Cloudflare/Vercel deployment.
8. Observability: structured logs, workflow execution IDs, publication audit trail and alerts.

## Security principles

- Never commit credentials or API keys.
- Secrets live in deployment/n8n secret stores and environment variables.
- Least-privilege credentials per integration.
- Production publishing requires an explicit policy gate.
- All automated publications retain source provenance and workflow IDs.

## Repository strategy

- `main`: protected production baseline.
- `feat/ai-newsroom-infrastructure`: Phase 1 implementation branch.
- Changes reach `main` only through reviewed pull requests.
