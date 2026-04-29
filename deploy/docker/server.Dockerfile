FROM node:20-bookworm-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/metric_engine/package.json packages/metric_engine/package.json
COPY packages/types/package.json packages/types/package.json

RUN pnpm install --frozen-lockfile

COPY apps/server apps/server
COPY packages/metric_engine packages/metric_engine
COPY packages/types packages/types

RUN pnpm --filter @seedar/types build \
  && pnpm --filter @metric-engine/core build \
  && pnpm --filter server build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server ./apps/server
COPY --from=build /app/packages/metric_engine ./packages/metric_engine
COPY --from=build /app/packages/types ./packages/types

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["node", "dist/main.js"]
