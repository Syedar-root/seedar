# 数据库方言适配计划

## 背景

当前 `metric_engine` 包中的时间过滤和同比/环比计算使用了 MySQL 特有语法（如 `DATE_SUB`、`CURDATE()`、`DATE_FORMAT` 等），导致在 PostgreSQL 和 ClickHouse 数据库上执行时报错。

## 目标

创建数据库方言配置类，让各个类自己根据数据库类型生成正确的 SQL，保持代码内聚性。

## 支持的数据库

* MySQL (mysql2)

* PostgreSQL (pg/postgres/postgresql)

* ClickHouse (@clickhouse/client)

## 修改文件清单

### 1. `packages/metric_engine/src/core/types.ts`

**新增** `DatabaseDialect` 类：

```typescript
export type DatabaseClient = 'mysql2' | 'pg' | 'postgres' | 'postgresql' | 'clickhouse' | 'sqlite3' | 'oracledb' | 'mssql';

export class DatabaseDialect {
  private static currentClient: DatabaseClient = 'mysql2';

  static setClient(client: DatabaseClient): void;
  static getClient(): DatabaseClient;
  static isPostgres(): boolean;
  static isMySQL(): boolean;
  static isClickHouse(): boolean;
}
```

### 2. `packages/metric_engine/src/query/filter.ts`

**修改** `TimeFilter.toSQL()` 方法：

* 导入 `DatabaseDialect`

* 根据数据库类型判断生成对应 SQL

| 时间范围           | MySQL                                   | PostgreSQL                          | ClickHouse                   |
| -------------- | --------------------------------------- | ----------------------------------- | ---------------------------- |
| recent\_days   | `DATE_SUB(CURDATE(), INTERVAL n DAY)`   | `CURRENT_DATE - INTERVAL 'n day'`   | `today() - INTERVAL n DAY`   |
| recent\_weeks  | `DATE_SUB(CURDATE(), INTERVAL n WEEK)`  | `CURRENT_DATE - INTERVAL 'n week'`  | `today() - INTERVAL n WEEK`  |
| recent\_months | `DATE_SUB(CURDATE(), INTERVAL n MONTH)` | `CURRENT_DATE - INTERVAL 'n month'` | `today() - INTERVAL n MONTH` |

### 3. `packages/metric_engine/src/query/knex-sql-generator.ts`

**修改** `initializeKnex()` 方法：

* 导入 `DatabaseDialect`

* 在初始化时调用 `DatabaseDialect.setClient(client)` 设置数据库类型

### 4. `packages/metric_engine/src/metrics/metric-classes.ts`

**修改** 两处：

#### 4.1 `getTimeConditionSQL()` 方法（约第 354 行）

* 导入 `DatabaseDialect`

* 根据数据库类型判断生成对应 SQL（与 filter.ts 相同逻辑）

#### 4.2 `getPeriodExpression()` 方法（约第 898 行）

* 根据数据库类型判断生成对应 SQL

| 周期类型                   | MySQL                                | PostgreSQL                                | ClickHouse                |
| ---------------------- | ------------------------------------ | ----------------------------------------- | ------------------------- |
| MONTH\_OVER\_MONTH     | `DATE_FORMAT(CURDATE(), '%Y-%m-01')` | `DATE_TRUNC('month', CURRENT_DATE)`       | `toStartOfMonth(today())` |
| YEAR\_OVER\_YEAR       | `YEAR(CURDATE())`                    | `EXTRACT(YEAR FROM CURRENT_DATE)`         | `toYear(today())`         |
| WEEK\_OVER\_WEEK       | `YEARWEEK(date, 1)`                  | `EXTRACT(YEAR...)*100 + EXTRACT(WEEK...)` | `toYearWeek(date, 1)`     |
| QUARTER\_OVER\_QUARTER | `QUARTER(date)`                      | `EXTRACT(QUARTER FROM date)`              | `toQuarter(date)`         |
| DAY\_OVER\_DAY         | `DATE(date) = CURDATE()`             | `date::date = CURRENT_DATE`               | `toDate(date) = today()`  |

## 实施步骤

1. 修改 `types.ts`，添加 `DatabaseDialect` 类，支持 MySQL/PostgreSQL/ClickHouse
2. 修改 `filter.ts`，导入 `DatabaseDialect` 并修改 `TimeFilter.toSQL()`
3. 修改 `knex-sql-generator.ts`，导入 `DatabaseDialect` 并在 `initializeKnex()` 中设置
4. 修改 `metric-classes.ts`，导入 `DatabaseDialect` 并修改 `getTimeConditionSQL()` 和 `getPeriodExpression()`
5. 运行类型检查验证修改

## 不修改文件

* `sql-generator.ts` - 用户明确表示不需要修改

