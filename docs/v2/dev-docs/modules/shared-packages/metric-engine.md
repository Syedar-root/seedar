# Metric Engine 说明

## 1. 定位

`@metric-engine/core` 是查询执行内核，不直接服务页面，而是服务后端 Query 模块。

## 2. 核心能力

- V2 表达式 AST
- V2 SQL 构建
- 兼容层
- 保留 V1 API

## 3. 为什么独立成包

这样做的好处是：

- 查询语义和业务模块解耦
- SQL 生成可以独立演进
- 可以逐步从旧 API 迁移到新架构

## 4. 改动建议

改这个包时，不要只看包内编译是否通过，还要确认：

1. `QueryService` 还能正常调用
2. `dsl-transformer.v2.ts` 生成的 QuerySpec 仍被接受
3. 前端结果映射没有被连带破坏
