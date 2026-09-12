# Periodismo360 — WordPress-first architecture

## Decision
WordPress is the CMS, editorial control plane, publication system and canonical source of truth. n8n, Source Engine, PostgreSQL/Redis and AI agents remain isolated services.

## Flow
Sources/APIs -> Source Engine -> PostgreSQL/Redis -> n8n -> AI Editorial Engine -> WordPress Bridge -> WordPress draft -> human editor -> publish.

## Hard boundaries
1. AI services do not receive WordPress administrator credentials.
2. The WordPress Bridge can create/update AI drafts only; it rejects explicit publish requests.
3. The WordPress plugin endpoint always creates `post_status=draft`.
4. WordPress users and capabilities remain the authority for final publication.
5. `workflowId` is unique/idempotent and stored as post metadata.
6. Production auto-publishing remains disabled during rollout.

## WordPress editorial metadata
Each AI draft stores workflow ID, confidence, risk, duplicate score, sources, fact-check result, SEO package and automation state. The wp-admin post editor displays the key review state.

## Rollout
- Install plugin in staging WordPress first.
- Define `P360_AI_INGEST_TOKEN` outside the database/repository (prefer server config/environment-backed wp-config).
- Test `/wp-json/p360-ai/v1/health`.
- Configure bridge with staging URL and matching ingest token.
- Run one fixture and one real sourced story into `draft`.
- Verify no endpoint can publish without a WordPress editor.
- Only after acceptance install the plugin on production; keep automation draft-only initially.

## Frontend
The existing Next.js work is retained but is no longer required for the initial production architecture. WordPress continues serving periodismo360.com until a later, separately approved frontend migration.
