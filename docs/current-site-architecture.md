# Periodismo360 — Public Baseline Architecture

Source baseline: `https://periodismo360.com/` (publicly rendered site only).

## Observed editorial information architecture

- Breaking/latest-news strip.
- Brand header and primary navigation.
- Primary categories: Inicio, Nacionales, Económicas, Globales, Deportes, Entretenimiento, Tecnología.
- Homepage lead/featured news hierarchy.
- Latest-news stream and category-led story modules.
- Newsletter acquisition module.
- Institutional/about area and multi-column footer.
- Article pages linked from homepage/category surfaces.

## Reconstruction policy

The new implementation uses the public site as an editorial/IA baseline, not as a source of private WordPress code. Server-side PHP, database contents, private plugins, credentials and non-public configuration are not copied or inferred.

## New component architecture

- `app/layout.tsx`: global shell, metadata, header/footer.
- `app/page.tsx`: modular homepage composition.
- `components/Header.tsx`: breaking strip, brand, primary navigation.
- `components/StoryCard.tsx`: reusable story presentation.
- `components/Footer.tsx`: institutional and section navigation.
- `lib/content.ts`: typed content contract; temporary adapter boundary for the future AI Newsroom/API.
- `app/globals.css`: initial design tokens, editorial layout and responsive behavior.

## AI Newsroom integration boundary

`Story` is the presentation contract. Future Sources/Editorial Engine output should be normalized into this contract (or its API successor) instead of coupling agents to React components. This allows ingestion, classification, fact-check, editing, SEO and multimedia services to evolve independently from the website UI.

## Next implementation increments

1. Replace placeholder baseline stories with a read-only WordPress REST content adapter.
2. Add category and article routes with metadata/schema.org.
3. Add image/media adapter and optimization policy.
4. Add search, author/byline, related stories, pagination and newsletter provider.
5. Add analytics/consent and ad-slot abstraction.
6. Add accessibility, Lighthouse, security and integration tests to the existing QA gate.
7. Deploy only to staging until explicit production approval.
