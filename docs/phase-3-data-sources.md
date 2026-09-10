# Phase 3 — Data & Sources Engine

## Implemented
- Private source ingestion service with bearer-token boundary.
- Generic RSS/Atom adapter with timeout and bounded item count.
- Canonical URL/title normalization and deterministic SHA-256 fingerprinting.
- Source tier scoring and routing to research, human triage or quarantine.
- Versioned source registry template; all examples disabled by default.
- Canonical source-item JSON schema.
- Inactive n8n manual ingestion workflow for sandbox testing.
- Placeholders for football, MLB, NBA and Caribbean baseball provider adapters without inventing provider URLs or credentials.

## Safety
No live source is enabled in Git. No API key is committed. No ingest workflow is active. Nothing in Phase 3 publishes to WordPress. Source reliability scores cannot authorize publication; the editorial engine and publication gate remain separate controls.

## Next increments
1. Select and approve actual sources/providers per desk and jurisdiction.
2. Add PostgreSQL persistence for source registry, ingest events and dedupe fingerprints.
3. Add Redis-backed idempotency/locks.
4. Implement provider-specific sports adapters and normalized event schemas.
5. Add scheduled n8n polling with per-source cadence, retries and error workflow.
6. Connect eligible normalized items to the Phase 2 editorial pipeline in sandbox.
