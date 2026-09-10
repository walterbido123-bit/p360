FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY agents/editorial-engine/package.json agents/editorial-engine/package.json
RUN pnpm install --filter @p360/editorial-engine... --no-frozen-lockfile
COPY agents/editorial-engine agents/editorial-engine
RUN pnpm --filter @p360/editorial-engine build
WORKDIR /app/agents/editorial-engine
EXPOSE 3002
CMD ["node","dist/index.js"]
