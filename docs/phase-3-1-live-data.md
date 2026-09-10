# Phase 3.1 — Live Data Foundation

## Implemented
- PostgreSQL persistence for normalized source items and unique fingerprints.
- Redis NX+TTL idempotency claims to prevent concurrent/repeated processing.
- MLB StatsAPI schedule/score adapter.
- API-Football adapter for configured football leagues/seasons.
- SportsDataIO NBA adapter.
- API-Baseball adapter for Caribbean baseball, with LIDOM coverage confirmed at provider level; other winter-league IDs must be verified before enabling.
- Inactive n8n bridge from Source Engine to Editorial Supervisor.

## Provider strategy
Use official/primary feeds whenever practical, licensed commercial feeds where required, and RSS for discovery. Do not scrape or republish copyrighted article bodies. Store normalized metadata, source links and evidence excerpts needed for editorial verification.

## Safety
Everything remains staging-first. `PUBLISHING_ENABLED=false`; n8n live bridge is inactive; source registry entries are disabled in Git; provider credentials are environment-only.

## Next validation
1. Provision staging PostgreSQL/Redis.
2. Obtain provider test/production entitlements.
3. Verify league IDs for each football and Caribbean competition.
4. Run fixtures through source-engine endpoints.
5. Validate DB uniqueness and Redis idempotency under retries.
6. Run Source Engine -> Supervisor -> complete Editorial Engine in staging.
7. Add scheduler and dead-letter workflow only after these tests pass.
