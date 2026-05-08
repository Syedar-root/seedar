# Query DSL 与 SQL 生成

## 1. DSL 的定位

Query DSL 是前端查询编辑器和后端执行引擎之间的中间协议。

它不直接等于 SQL，也不直接等于数据库实体，而是语义化的查询描述。

## 2. 转换链路

`QueryDSL -> DSLTransformerV2 -> QuerySpec -> KnexQueryBuilder -> SQL`

## 3. 为什么要经过 `metric_engine`

因为这样可以把：

- 表达式系统
- 聚合层次
- 派生维度
- 数据库方言差异

集中放在独立包里演进，而不是散落在业务服务中。

## 4. 前端对应入口

前端在面板页里拖拽出来的不是 SQL，而是 DSL 配置。真正的数据执行发生在后端。
