# 查询模块维护提示

## 高风险点

1. `packages/types` 和 `dsl-transformer.v2.ts` 不一致时，最容易出现运行期问题。
2. 数据集字段变化可能让旧 DSL 失效。
3. `columnMappings` 错误会导致前端展示列名或指标解释错乱。

## 排查顺序

1. 看前端提交的 DSL
2. 看 `DatasetService.findOne` 返回的数据集结构
3. 看转换后的 QuerySpec
4. 看生成 SQL
5. 再看数据库执行结果

## 改动建议

如果你要改 DSL：

1. 先改 `packages/types`
2. 再改前端编辑器
3. 再改 `dsl-transformer.v2.ts`
4. 最后确认 `columnMappings` 仍然可用
