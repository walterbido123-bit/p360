# Source Governance Policy

## Tiers
- `primary` (base 0.95): official institutions, leagues, regulators, courts, company filings/official statements for claims about themselves. Primary does not mean infallible; contested claims still require independent verification.
- `high` (0.85): established professional newsrooms/wires or contracted data providers with strong correction practices.
- `standard` (0.70): useful secondary/local/specialist sources requiring corroboration for material claims.
- `unverified` (0.40): tips, social posts, unknown sites and user submissions. Never auto-route to drafting as verified fact.

## Routing
Score >= 0.80 -> research queue. Score 0.60–0.79 -> human triage. Score < 0.60 -> quarantine. A source score measures source/input reliability only; it is not story confidence and cannot by itself authorize publication.

## Registry rules
Every source needs a stable ID, publisher, desk, geography, kind, tier, poll interval and explicit enabled flag. New sources start disabled and require editorial/technical review before activation.

## Rights and attribution
Ingestion stores metadata and limited evidence necessary for reporting workflows. It must not republish copyrighted source articles verbatim. Drafting must be original and claims must be attributed when appropriate.

## Sports
Prefer official league/team/statistical feeds or licensed providers. Scores, schedules and standings should preserve provider timestamps and identifiers. Rumors and social reports are routed as unverified until corroborated.
