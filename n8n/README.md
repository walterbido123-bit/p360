# n8n orchestration

Production workflows are versioned here as exported JSON after validation in a non-production n8n instance.

## Pipeline
`ingest -> normalize -> exact fingerprint -> semantic/token dedupe -> research -> classify -> draft -> fact-check -> edit -> SEO -> editorial gate -> human review or publisher`

## Required workflow guarantees
- Every execution carries `workflowId` and `eventId`.
- Ingest nodes are idempotent.
- Retries use bounded exponential backoff.
- External calls have explicit timeouts.
- Failed executions go to a dead-letter/error workflow.
- Publisher calls require a service token and cannot bypass the editorial gate.
- Production publishing remains disabled unless `PUBLISHING_ENABLED=true` is explicitly configured outside Git.

## Planned exports
- `workflows/01-ingest.json`
- `workflows/02-editorial-pipeline.json`
- `workflows/03-human-review.json`
- `workflows/99-error-handler.json`
