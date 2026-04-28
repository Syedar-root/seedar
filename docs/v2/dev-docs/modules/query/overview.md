# 查询模块概览

## 1. 模块职责

查询模块负责：

- 保存 Query 资产
- 接收临时 DSL 预览请求
- 把 DSL 转成 QuerySpec
- 调用 `metric_engine` 生成 SQL
- 在真实数据源上执行 SQL
- 把结果、SQL、列映射回传给前端

## 2. 上下游

上游：

- `dataset`
- `panel`

下游：

- 真实外部数据库
- `metric_engine`

## 3. 为什么它是系统中枢

因为它同时理解：

- 业务语义层
- 查询 DSL
- SQL 生成
- 结果回传格式
