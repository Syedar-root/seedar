# Server 真实测试问题记录

更新时间：2026-05-10

## 1. `chalk` 的 ESM 兼容问题
- 现象：运行 `server` 测试时，Jest 报 `SyntaxError` 或模块加载失败。
- 原因：`chalk` 是 ESM 模块，Jest 默认处理方式不一致。
- 处理：在 `apps/server/package.json` 和测试配置中统一映射 `chalk` 到 `apps/server/test/chalk.mock.ts`。
- 结果：单元测试可以稳定运行。

## 2. Monorepo 下测试命令参数传递不稳定
- 现象：`pnpm --filter ... test -- --runInBand` 在部分环境下会吞掉参数。
- 原因：workspace/filter 场景下参数转发不稳定。
- 处理：改为显式命令。
  - `pnpm --filter @metric-engine/core exec jest --runInBand`
  - `pnpm --filter server exec jest --runInBand`
- 结果：测试链路稳定。

## 3. 覆盖率产物异常
- 现象：`coverage-final.json` 为空或 `lcov.info` 不完整。
- 原因：当前项目里 Jest + ts-jest 的产物在某些场景下不稳定。
- 处理：以 `--coverageReporters=text-summary` 的终端统计作为主基线。
- 结果：覆盖率可以稳定跟踪。

## 4. AI 相关依赖导入告警
- 现象：执行 AI 相关测试时出现第三方库初始化告警。
- 原因：部分依赖在加载时会打印提示信息。
- 处理：保留告警观察，不影响测试断言。
- 结果：测试结果正常。

## 5. 测试修复原则
- 原则：优先修真实逻辑，不为了“全绿”去改业务行为。
- 处理：仅调整测试桩、断言和 mock，使其贴近真实执行流程。

## 6. ClickHouse 分支 mock 形状不一致
- 现象：`datasource.service.branch.spec.ts` 中 `getTableColumns(...CLICKHOUSE...)` 报 `toLowerCase` 相关异常。
- 原因：`raw()` 的 mock 返回了 tuple 形状，但实际代码里的 `getClickHouseColumns()` 需要的是行数组。
- 处理：把 ClickHouse `raw` 改成两次返回：
  - 第 1 次给 `getTableNames()` 返回 `['archive']`
  - 第 2 次给 `getTableColumns()` 返回列行数组
- 结果：ClickHouse 分支测试通过。

## 当前 server 覆盖率
- 统计口径：`apps/server/package.json` 的 `collectCoverageFrom` 指定的逻辑文件，不是整个 `src`。
- Statements：`87.21%`
- Branches：`72.03%`
- Functions：`94.52%`
- Lines：`86.89%`
