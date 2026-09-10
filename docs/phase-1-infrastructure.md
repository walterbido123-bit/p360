# Phase 1 — Infrastructure

## Audit result
The `main` branch was audited before modification. At audit time it contained only `.gitignore`, `LICENSE`, and `README.md`; no application source, Next.js frontend, WordPress integration, n8n workflow, deployment configuration, tests, or CI/CD were present.

The README describes `p360` as a professional repository for integrated digital marketing projects (strategy, SEO, content, social media, automation, AI, analytics, advertising, leads and conversion optimization). This is thematically compatible with Periodismo360, but it is not yet the new Periodismo360 website.

The existing `.gitignore` is an AL / Dynamics 365 Business Central template and is not appropriate as the final ignore policy for a Next.js/Node newsroom repository.

## Safety
No files on `main` are being modified during Phase 1. All bootstrap work starts on `feat/ai-newsroom-infrastructure`.

## Phase 1 deliverables
- Architecture specification.
- Environment-variable contract with no real secrets committed.
- Local PostgreSQL + Redis + n8n stack.
- Canonical JSON contract for newsroom stories.
- Repository layout for frontend, orchestration, agents and WordPress integration.
- CI quality gates before merge.

## Next implementation increments
1. Normalize `.gitignore` for Node/Next.js, Docker, environment files and generated artifacts.
2. Bootstrap `apps/web` as the Next.js frontend.
3. Add shared newsroom TypeScript types generated/aligned with JSON contracts.
4. Add WordPress API adapter and authenticated publication boundary.
5. Add n8n workflow definitions for ingest -> dedupe -> research -> edit -> quality gate -> publish.
6. Add automated tests and GitHub Actions.
7. Configure preview deployment before any production-domain cutover.

## Production rule
`periodismo360.com` must not be switched to the new frontend until preview QA, CMS integration, SEO redirects, analytics, publishing safeguards and rollback are validated.
