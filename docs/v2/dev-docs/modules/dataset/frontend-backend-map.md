# 数据集模块前后端映射

| 页面 / 场景 | 前端调用 | 后端承接 | 结果 |
| --- | --- | --- | --- |
| 数据集列表 | `useDatasets` | `GET /dataset` | 返回完整数据集列表 |
| 数据集详情 | `useDataset(id)` | `GET /dataset/:id` | 返回单个数据集明细 |
| 创建数据集 | `useCreateDataset` | `POST /dataset` | 新建语义层资产 |
| 更新数据集 | `useUpdateDataset` | `PATCH /dataset` | 同步字段、表、Join、指标 |
| 删除数据集 | `useDeleteDataset` | `DELETE /dataset/:id` | 软删除，可能被依赖阻断 |

## 前端关键文件

- [useDataset.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useDataset.ts)
- `apps/web-client/src/modules/dataset/**/*`

## 后端关键文件

- [dataset.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/dataset/dataset.controller.ts)
- [dataset.service.ts](/D:/Program/projects/seedar/apps/server/src/module/dataset/services/dataset.service.ts)
- `dataset.helper.ts`

## 典型改动入口

- 改字段提交结构：先看 DTO 和 `packages/types`
- 改 Join 行为：先看 `DatasetService.create`
- 改指标结构：先看 `DatasetMetric` 实体与相关 manager
