# Live Data Providers

## Sports
- Football: API-Football (API-Sports). Adapter requires `API_FOOTBALL_KEY`. League IDs/seasons remain configuration, never hard-coded editorial assumptions.
- MLB: MLB StatsAPI adapter for schedules/scores. No credential is committed.
- NBA: SportsDataIO League API adapter. Requires `SPORTSDATAIO_KEY`; production-quality live data requires an appropriate commercial production entitlement.
- Caribbean baseball: API-Baseball (API-Sports). Coverage includes LIDOM; league IDs for LIDOM and any Mexico/Puerto Rico/Venezuela competitions must be discovered/verified against the provider's current league catalog before enabling.

## News
Initial registry favors first-party institutional feeds plus Periodismo360's own feed. Commercial wire content (AP/Reuters/EFE etc.) must only be added with a valid content/data license. Google News is discovery, not a substitute for source licensing or primary-source verification.

## Operational policy
All real sources remain `enabled:false` in Git. Runtime configuration enables approved sources in staging first. Credentials remain outside Git. Provider responses are persisted as normalized records; Redis prevents duplicate concurrent processing and PostgreSQL enforces fingerprint uniqueness.
