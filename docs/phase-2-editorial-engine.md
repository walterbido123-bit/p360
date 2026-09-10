# Phase 2 — AI Editorial Engine

## Agent chain
Supervisor -> Research -> Classifier -> Writer -> Fact-check -> Editor -> SEO -> Multimedia.

## Safety model
- Agents receive supplied evidence; Research does not invent or silently create sources.
- Every prompt requires JSON-only structured output and forbids fabricated facts, quotes, statistics, URLs and sources.
- Fact-check can force human review.
- Multimedia creates briefs only; generated visuals must never be represented as documentary photographs.
- The n8n workflow is committed inactive and is intended for non-production testing first.
- Publication remains outside this workflow and behind the Phase 1 publisher kill switch.

## Runtime
The editorial engine exposes authenticated `POST /v1/agents/:agent` endpoints and `GET /health`. n8n calls these endpoints using `AGENT_SERVICE_TOKEN` stored outside Git.

## Contracts
- `contracts/agent-envelope.schema.json`: cross-agent event envelope.
- `contracts/editorial-stage.schema.json`: request shape for an editorial stage.
- `contracts/news-item.schema.json`: canonical story contract.

## Testing sequence
1. Start infrastructure in an isolated environment.
2. Configure a non-production OpenAI key and random service token.
3. Import `n8n/workflows/02-editorial-pipeline.json` but leave it inactive.
4. Execute manually with `dryRun=true` to verify routing without model calls.
5. Execute a fixture story with supplied source evidence and publishing disabled.
6. Validate JSON outputs and human-review routing.
7. Only after QA, add persistent audit storage and connect the editorial gate/publisher in a separate workflow.
