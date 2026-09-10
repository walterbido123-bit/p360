# Periodismo360 AI Newsroom — Phase 1: Infrastructure

## Status
Bootstrap architecture for the production platform. This branch is isolated from `main`.

## Audit baseline
At the start of Phase 1, `main` contains only `.gitignore`, `LICENSE`, and `README.md`. No existing Periodismo360 frontend, WordPress integration, n8n workflows, agent code, CI/CD, or deploy configuration is present in this repository.

The existing `.gitignore` targets Microsoft Dynamics 365 Business Central AL projects and is not appropriate for the intended Next.js/Node.js newsroom stack. It is intentionally left untouched on `main`; replacement/extension will happen only on this feature branch.

## Target architecture

```text
Sources / RSS / Sports APIs / Webhooks
                |
                v
             n8n
                |
                v
        AI Newsroom Pipeline
  research -> dedupe -> verify -> write
       -> edit -> SEO -> media -> QA
                |
                v
       WordPress Headless CMS
                |
                v
          Next.js Frontend
                |
                v
        Vercel / Cloudflare
                |
                v
        periodismo360.com
```

## Production layers

1. **Frontend** — Next.js + TypeScript.
2. **CMS** — WordPress as headless editorial CMS via REST API.
3. **Orchestration** — n8n for ingestion and editorial workflows.
4. **AI agents** — supervisor, research, classifier, deduplication, writer, editor, fact-check, SEO, multimedia and publisher.
5. **Data** — PostgreSQL for newsroom state/audit data and Redis for queues/cache where required.
6. **Edge and delivery** — Cloudflare for DNS/security/cache; Vercel or compatible runtime for Next.js.
7. **Source control** — GitHub with feature branches and pull-request based promotion to `main`.
8. **Observability** — structured logs, workflow run IDs, agent trace IDs, publication audit trail, error reporting and analytics.

## Repository target layout

```text
apps/
  web/                  # Next.js public frontend
services/
  newsroom/             # agent orchestration/domain services
  wordpress/            # WordPress API integration
packages/
  contracts/            # shared TypeScript/JSON schemas
  config/               # shared configuration
  observability/        # logging/tracing helpers
n8n/
  workflows/            # versioned workflow exports
  README.md
infra/
  docker/
  cloudflare/
  vercel/
  wordpress/
docs/
  architecture/
  editorial/
  operations/
.github/
  workflows/
```

## Environment contract
No production credentials are committed to Git.

Expected variables include:

```text
NEXT_PUBLIC_SITE_URL
WORDPRESS_URL
WORDPRESS_API_URL
WORDPRESS_USERNAME
WORDPRESS_APP_PASSWORD
N8N_BASE_URL
N8N_WEBHOOK_SECRET
DATABASE_URL
REDIS_URL
OPENAI_API_KEY
NEWSROOM_SIGNING_SECRET
```

Actual secrets must be stored in the deployment platform/GitHub environment secret stores, not `.env` files committed to the repository.

## Editorial safety gate
Automated publication is not a single unconditional path. Every candidate story receives provenance, duplicate, confidence, editorial-risk and QA signals. High-risk or insufficiently verified stories are routed to human review. Only eligible low-risk content can reach the automatic WordPress publishing step.

## Phase 1 acceptance criteria

- Isolated feature branch exists.
- Repository baseline is audited and documented.
- Monorepo/application structure is defined.
- Environment/secrets contract is defined.
- Local infrastructure strategy is defined.
- CI validation is introduced before merge.
- WordPress, n8n and agent boundaries are documented before implementation.
- `main` remains unchanged until a reviewed pull request is merged.

## Next implementation sequence

1. Bootstrap Next.js/TypeScript workspace.
2. Add production `.gitignore` and `.env.example` without secrets.
3. Add Docker Compose for local PostgreSQL/Redis/n8n dependencies.
4. Define shared newsroom event and article contracts.
5. Add CI for lint/typecheck/build/security checks.
6. Implement WordPress API adapter.
7. Add n8n workflow exports and webhook contracts.
8. Implement agent pipeline and editorial gates.
9. Connect frontend to WordPress.
10. Configure preview deployment, then production domain cutover only after validation.
