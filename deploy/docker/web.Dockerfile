FROM node:20-bookworm-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web-client/package.json apps/web-client/package.json
COPY packages/ui-core/package.json packages/ui-core/package.json
COPY packages/ui-react/package.json packages/ui-react/package.json
COPY packages/types/package.json packages/types/package.json

COPY apps/web-client apps/web-client
COPY packages/ui-core packages/ui-core
COPY packages/ui-react packages/ui-react
COPY packages/types packages/types

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @seedar/types build \
  && pnpm --filter @seedar/web-client build

FROM nginx:1.27-alpine AS runtime

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web-client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
