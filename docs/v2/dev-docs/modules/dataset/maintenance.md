# 数据集模块维护提示

## 高风险点

1. 数据集一旦被 Query 引用，字段或指标变更可能造成链式破坏。
2. 更新接口是聚合型接口，前后端字段命名不一致时很容易出现局部失效。
3. 多表数据集的主键和 Join 校验是稳定性的关键防线。

## 排查顺序

1. 看数据集请求体是否完整
2. 看主键校验是否通过
3. 看 Join 是否有效
4. 看是否有 Query 依赖导致删除失败

## 修改建议

改数据集模型时，通常要同步检查：

- `apps/server/src/module/dataset/dto/*`
- `packages/types/src/dataset/*`
- `apps/web-client/src/modules/dataset/types/*`
- `query` 模块是否受影响
