FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY services/source-engine/package.json services/source-engine/package.json
RUN pnpm install --filter @p360/source-engine... --no-frozen-lockfile
COPY services/source-engine services/source-engine
RUN pnpm --filter @p360/source-engine build
WORKDIR /app/services/source-engine
EXPOSE 3003
CMD ["node","dist/index.js"]
