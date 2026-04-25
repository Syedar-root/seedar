# TypeORM Migration Workflow

## 1. First-time initialization

1. Ensure DB is reachable and empty (or matches expected baseline).
2. Generate initial migration:

```bash
pnpm --filter server run migration:generate
```

3. Review generated SQL carefully, then commit migration file.
4. Apply migration:

```bash
pnpm --filter server run migration:run
```

## 2. Iteration workflow

1. Change entity definitions.
2. Generate migration:

```bash
pnpm --filter server run migration:generate
```

3. Review migration diff and adjust manually if needed.
4. Run migration locally and validate behavior:

```bash
pnpm --filter server run migration:run
```

5. Commit code + migration in the same PR.

## 3. Rollback

```bash
pnpm --filter server run migration:revert
```

Use rollback only for controlled scenarios. For production incidents, prefer forward-fix migrations.
