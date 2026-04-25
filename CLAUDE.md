# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This is a pnpm workspace monorepo with two applications and several shared packages:

- `apps/server`: NestJS backend using TypeORM and module-based domain organization.
- `apps/web-client`: React 18 + Vite frontend.
- `packages/ui-core`: shared frontend API/SDK layer built on top of Axios.
- `packages/types`: shared TypeScript domain and API types used across frontend and backend.
- `packages/metric_engine`: metric DSL and SQL generation engine used by query-related backend logic.
- `packages/ui-react`: shared React UI package.

Per `.cursor/rules/preference.mdc`, respond to the user in Chinese.

## Common commands

Run from the repository root unless noted otherwise.

### Install

- `pnpm install`

### Development

- `pnpm dev` — run all workspace `start:dev` scripts in parallel.
- `pnpm dev:server` — run only the NestJS backend in watch mode.
- `pnpm dev:web` — run only the Vite frontend.

### Build

- `pnpm build` — build all workspaces that define a build script.
- `pnpm --filter server build` — build backend only.
- `pnpm --filter web-client build` — build frontend only.
- `pnpm --filter @metric-engine/core build` — build the metric engine package.
- `pnpm --filter @seedar/types build` — build shared types.

### Lint / format

- Root `pnpm lint` is currently a placeholder and does not lint the repo.
- `pnpm --filter server lint` — run backend ESLint with autofix.
- `pnpm --filter server format` — run backend Prettier on `src/**/*.ts` and `test/**/*.ts`.

### Tests

Backend uses Jest:

- `pnpm --filter server test`
- `pnpm --filter server test:watch`
- `pnpm --filter server test:cov`
- `pnpm --filter server test:e2e`
- `pnpm --filter server test -- app.controller.spec.ts` — run a single backend test file.
- `pnpm --filter server test -- --runInBand` — useful for debugging flaky tests.

Metric engine package also uses Jest:

- `pnpm --filter @metric-engine/core test`
- `pnpm --filter @metric-engine/core test -- <pattern>`

Type-checking helpers in packages:

- `pnpm --filter @metric-engine/core type-check`
- `pnpm --filter @seedar/types type-check`
- `pnpm --filter @seedar/ui-core type-check`

## High-level architecture

### Backend: NestJS domain modules

Backend entry is `apps/server/src/main.ts`, with root wiring in `apps/server/src/app.module.ts`.

The backend is organized around domain modules under `apps/server/src/module`:

- `datasource`: manages datasource connections, tables, columns, and foreign keys. Exposes a `KnexConnectionFactory` for query execution against external databases.
- `dataset`: defines semantic datasets on top of datasource metadata, including joins, fields, and metrics.
- `query`: executes dataset-driven queries. Depends on both `DatasetModule` and `DatasourceModule`.
- `dashboard`: manages dashboards, panels, and persisted panel layout state.
- `ai`: AI/chat domain; depends on dataset and query capabilities to support analysis workflows.

Cross-cutting backend concerns are centralized rather than repeated in each module:

- global exception filter
- global logging interceptor
- global response interceptor
- custom logger module/service
- TypeORM configuration via `database.config.ts`

When changing backend behavior, first locate the owning domain module, then follow the standard Nest flow: controller → service → entity/DTO.

### Frontend: route-driven feature modules

Frontend bootstraps from `apps/web-client/src/main.tsx`:

- initializes `ApiClient` from `packages/ui-core`
- creates a global TanStack Query client
- wraps the app in React DnD and Router providers

Routes are defined in `apps/web-client/src/core/router/index.tsx`. The frontend is organized mostly by feature modules under `apps/web-client/src/modules`, such as:

- `dashboard`
- `panel`
- `dataset`
- `datasource`
- `user`

Common UI and infrastructure live under `apps/web-client/src/core`, including router setup, reusable UI/business components, request helpers, and the lightweight `bridge` event bus (`mitt`).

When making frontend changes, prefer following the feature boundary already used by the route/module instead of adding cross-feature code in `core` unless it is truly shared.

### Shared contract packages

`packages/types` is the shared schema layer between frontend and backend. Prefer importing domain DTO/types from this package instead of redefining interfaces inside apps.

`packages/ui-core` is the frontend-facing API SDK. Its `ApiClient` wraps Axios and handles parsing the backend response envelope when `autoParseResponse` is enabled. Domain APIs such as datasource, dataset, query, dashboard, panel, and AI are exposed here. For frontend data access changes, update this package first, then consume the exported API from the app.

### Metric engine

`packages/metric_engine` is a standalone metric/query engine package.

Important architectural split:

- `v2/expr`: newer expression AST layer
- `v2/sql`: newer SQL builder layer using Knex and CTE construction
- `compat`: adapters that bridge older APIs onto the newer architecture
- `v1/*`: legacy query/metric APIs kept for compatibility

If query-generation behavior changes, check whether the code path is using the new v2 expression/SQL system directly or going through the compatibility layer.

## Practical guidance for navigation

- For API shape or payload questions, inspect `packages/types` first.
- For frontend network behavior, inspect `packages/ui-core/src/api/*` before changing app code.
- For backend business logic, inspect the owning module under `apps/server/src/module/*`.
- For query/metric logic, inspect both `apps/server/src/module/query` and `packages/metric_engine` together; the backend module is orchestration, while the package holds query-building primitives.
- There are generated or hand-written domain docs under several backend modules’ `docs/` folders. They can provide business context, but code is the source of truth.
