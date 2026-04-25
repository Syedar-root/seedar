# V2 筛选能力扩展计划

## 目标
以测试驱动开发（TDD）方式扩展 V2 表达式系统，支持以下筛选操作：
- IN / NOT IN 列表
- BETWEEN / NOT BETWEEN 范围
- LIKE / NOT LIKE 模糊匹配
- IS NULL / IS NOT NULL 空值判断

## 任务拆分与依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 1: 类型定义                         │
│  [T1] 扩展 ExprKind 枚举                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 2: AST 扩展                         │
│  [T2] 新增 InExpr 类          [T3] 新增 BetweenExpr 类           │
│  [T4] 新增 LikeExpr 类        [T5] 新增 IsNullExpr 类            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 3: 测试用例 (TDD)                   │
│  [T6] 编写 InExpr 测试         [T7] 编写 BetweenExpr 测试        │
│  [T8] 编写 LikeExpr 测试       [T9] 编写 IsNullExpr 测试         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 4: 解析器扩展                       │
│  [T10] 扩展 parser.ts 支持新表达式解析                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────
│                        Phase 5: SQL 生成器扩展                   │
│  [T11] 扩展 knex-builder.ts 支持新表达式 SQL 生成               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 6: 验证与修复                       │
│  [T12] 运行测试验证功能                                         │
│  [T13] 运行 lint 检查                                           │
│  [T14] 运行 typecheck 检查                                      │
│  [T15] 修复所有错误                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 详细任务说明

### Phase 1: 类型定义

#### [T1] 扩展 ExprKind 枚举
**文件**: `src/v2/expr/types.ts`

**修改内容**:
```typescript
export enum ExprKind {
  // ... 现有类型
  In = "In",
  Between = "Between",
  Like = "Like",
  IsNull = "IsNull",
}
```

**依赖**: 无
**并行**: 否（基础任务）

---

### Phase 2: AST 扩展

#### [T2] 新增 InExpr 类
**文件**: `src/v2/expr/ast.ts`

**修改内容**:
- 新增 `InExpr` 类，支持 IN 和 NOT IN 操作
- 属性: `expr`, `values`, `negated`

**依赖**: T1
**并行**: 可与 T3, T4, T5 并行

#### [T3] 新增 BetweenExpr 类
**文件**: `src/v2/expr/ast.ts`

**修改内容**:
- 新增 `BetweenExpr` 类，支持 BETWEEN 和 NOT BETWEEN 操作
- 属性: `expr`, `low`, `high`, `negated`

**依赖**: T1
**并行**: 可与 T2, T4, T5 并行

#### [T4] 新增 LikeExpr 类
**文件**: `src/v2/expr/ast.ts`

**修改内容**:
- 新增 `LikeExpr` 类，支持 LIKE 和 NOT LIKE 操作
- 属性: `expr`, `pattern`, `negated`

**依赖**: T1
**并行**: 可与 T2, T3, T5 并行

#### [T5] 新增 IsNullExpr 类
**文件**: `src/v2/expr/ast.ts`

**修改内容**:
- 新增 `IsNullExpr` 类，支持 IS NULL 和 IS NOT NULL 操作
- 属性: `expr`, `negated`

**依赖**: T1
**并行**: 可与 T2, T3, T4 并行

---

### Phase 3: 测试用例 (TDD)

#### [T6] 编写 InExpr 测试
**文件**: `test/test-v2-filter-expr.ts` (新建)

**测试内容**:
- IN 列表基础测试
- NOT IN 测试
- 空列表边界测试
- SQL 生成验证

**依赖**: T2
**并行**: 可与 T7, T8, T9 并行

#### [T7] 编写 BetweenExpr 测试
**文件**: `test/test-v2-filter-expr.ts`

**测试内容**:
- BETWEEN 基础测试
- NOT BETWEEN 测试
- 边界值测试
- SQL 生成验证

**依赖**: T3
**并行**: 可与 T6, T8, T9 并行

#### [T8] 编写 LikeExpr 测试
**文件**: `test/test-v2-filter-expr.ts`

**测试内容**:
- LIKE 基础测试
- NOT LIKE 测试
- 通配符测试
- SQL 生成验证

**依赖**: T4
**并行**: 可与 T6, T7, T9 并行

#### [T9] 编写 IsNullExpr 测试
**文件**: `test/test-v2-filter-expr.ts`

**测试内容**:
- IS NULL 测试
- IS NOT NULL 测试
- SQL 生成验证

**依赖**: T5
**并行**: 可与 T6, T7, T8 并行

---

### Phase 4: 解析器扩展

#### [T10] 扩展 parser.ts 支持新表达式解析
**文件**: `src/v2/expr/parser.ts`

**修改内容**:
1. 注册 jsep 新运算符
2. 扩展 `transform` 方法处理新表达式类型
3. 处理数组字面量解析

**依赖**: T2, T3, T4, T5
**并行**: 否

---

### Phase 5: SQL 生成器扩展

#### [T11] 扩展 knex-builder.ts 支持新表达式 SQL 生成
**文件**: `src/v2/sql/knex-builder.ts`

**修改内容**:
1. 在 `buildExpr` 方法中添加新表达式类型的处理
2. 在 `buildExprWithAlias` 方法中添加对应处理
3. 在 `ExprAnalyzer` 中添加新表达式的聚合层级分析

**依赖**: T2, T3, T4, T5
**并行**: 可与 T10 部分并行

---

### Phase 6: 验证与修复

#### [T12] 运行测试验证功能
**命令**: `npx ts-node test/test-v2-filter-expr.ts`

**依赖**: T6-T11
**并行**: 否

#### [T13] 运行 lint 检查
**命令**: `npm run lint` (需确认项目 lint 命令)

**依赖**: T12
**并行**: 可与 T14 并行

#### [T14] 运行 typecheck 检查
**命令**: `npx tsc --noEmit`

**依赖**: T12
**并行**: 可与 T13 并行

#### [T15] 修复所有错误
**内容**: 修复 T12-T14 发现的所有问题

**依赖**: T13, T14
**并行**: 否

---

## 并行执行策略

| 阶段 | 可并行任务 |
|------|-----------|
| Phase 2 | T2, T3, T4, T5 可并行执行 |
| Phase 3 | T6, T7, T8, T9 可并行执行 |
| Phase 6 | T13, T14 可并行执行 |

## 执行顺序

1. **Phase 1**: 执行 T1（基础任务，必须先完成）
2. **Phase 2**: 并行执行 T2, T3, T4, T5
3. **Phase 3**: 并行执行 T6, T7, T8, T9
4. **Phase 4**: 执行 T10
5. **Phase 5**: 执行 T11
6. **Phase 6**: 执行 T12 → 并行执行 T13, T14 → 执行 T15

## 文件修改清单

| 文件 | 修改类型 | 任务 |
|------|---------|------|
| `src/v2/expr/types.ts` | 修改 | T1 |
| `src/v2/expr/ast.ts` | 修改 | T2, T3, T4, T5 |
| `src/v2/expr/index.ts` | 修改 | T2-T5 (导出新类) |
| `test/test-v2-filter-expr.ts` | 新建 | T6-T9 |
| `src/v2/expr/parser.ts` | 修改 | T10 |
| `src/v2/sql/knex-builder.ts` | 修改 | T11 |
| `src/v2/expr/analyzer.ts` | 修改 | T11 |

## 预期产出

完成后支持的筛选表达式：

```typescript
// IN 列表
status IN ('paid', 'shipped', 'completed')
status NOT IN ('cancelled', 'refunded')

// BETWEEN 范围
amount BETWEEN 100 AND 1000
created_at NOT BETWEEN '2024-01-01' AND '2024-12-31'

// LIKE 模糊匹配
name LIKE '%张%'
email NOT LIKE '%spam%'

// IS NULL 空值判断
deleted_at IS NULL
deleted_at IS NOT NULL
```
