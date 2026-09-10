# Periodismo360 — Operational Web Pipeline

## Flow

`00-web-orchestrator → Figma → code → GitHub/CI → QA → deploy → WordPress`

The repository's 23 `SKILL.md` files define specialist responsibilities. `config/pipeline.json` maps them to executable delivery stages. The Node scripts provide deterministic gates/adapters; GitHub Actions runs validation and QA on pull requests and gates production deployment behind the `production` environment.

## Commands

- `npm run skills:validate` — verifies all 23 skill contracts exist.
- `npm run pipeline:plan` — prints stage/skill routing.
- `npm run pipeline:run` — executes configured Figma, lint, test, build, QA, deploy and WordPress stages.
- `npm run figma:sync` — reads a Figma file through the Figma REST API into `.pipeline/figma.json`.
- `npm run qa` — runs only configured quality commands; any configured failure stops the pipeline.
- `npm run deploy` — invokes the configured deployment adapter.
- `npm run wordpress:publish` — creates a WordPress post via REST API. Publishing is guarded by `WP_PUBLISH=true`; default status is `draft`.

## GitHub configuration

Set repository/environment Variables for the non-secret command strings (`QA_*_COMMAND`, `DEPLOY_COMMAND`). Store credentials only as GitHub Secrets and expose them only to jobs that need them. Protect the `production` environment with required reviewers before enabling automatic production deployment.

## Figma

Figma is optional. Configure `FIGMA_FILE_KEY` and a token outside source control. The sync stage stores design metadata locally as a pipeline artifact; implementation remains the responsibility of the Figma-to-code and frontend skills or an attached coding agent.

## WordPress

Use a WordPress Application Password with the minimum required user role. Set `WP_BASE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`, and a JSON payload path. Keep `WP_PUBLISH=false` during integration tests. The adapter defaults posts to `draft`, so an explicit payload status is required for direct publication.

## Current boundary

This repository does not yet contain the Periodismo360 application source code, so build/test/lint commands are deliberately configuration-driven rather than invented. Once the web application is added, set the command variables and the same pipeline becomes its CI/CD gate.
