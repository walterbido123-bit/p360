# Observability

## Correlation
`workflowId` is the primary trace/correlation identifier across n8n, agents, publisher and WordPress publication metadata. `eventId` identifies each stage event.

## Structured event fields
- timestamp
- service
- environment
- workflowId
- eventId
- agent/stage
- decision
- durationMs
- attempt
- sourceCount
- confidence
- risk
- duplicateScore
- wordpressPostId (after publication)
- errorCode/errorMessage (on failure)

## Signals
- Health: `/api/health` (web) and `/health` (publisher).
- Logs: JSON structured logs; never log credentials, full authorization headers or application passwords.
- Errors: Sentry-compatible DSN reserved via environment configuration.
- Metrics: ingestion rate, duplicate rejection rate, human-review rate, publish success/error rate, stage latency, retry count and queue age.

## Alerts
Critical alerts: publisher unavailable, repeated WordPress authentication failures, error-rate spike, queue backlog, unexpected publication while kill switch should be disabled, and contract-validation failures above threshold.
