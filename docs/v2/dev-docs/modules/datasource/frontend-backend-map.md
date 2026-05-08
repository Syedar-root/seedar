# 数据源模块前后端映射

## 页面与动作

| 页面 | 用户动作 | 前端调用 | 后端承接 |
| --- | --- | --- | --- |
| `/datasource` | 查看列表 | `useDatasources` | `GET /datasource` |
| `/datasource` | 创建数据源 | `DatasourceApi.create` | `POST /datasource` |
| `/datasource` | 测试连接 | `DatasourceApi.testConnection` | `POST /datasource/test-connection` |
| `/datasource` | 删除数据源 | `DatasourceApi.remove` | `DELETE /datasource/:id` |
| `/datasource/:id` | 查看详情 | `DatasourceApi.findOne` | `GET /datasource/:id` |

## 前端关键文件

- [DatasourcePage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/datasource/pages/datasourcePage.tsx)
- `CreateDatasourceDialog`
- `DatasourceCard`
- `TableExplorer`
- `RelationshipTimeline`

## 后端关键文件

- [datasource.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/datasource/datasource.controller.ts)
- [datasource.service.ts](/D:/Program/projects/seedar/apps/server/src/module/datasource/service/datasource.service.ts)
- `knex-connection.factory.ts`
- `datasource.validation.ts`

## 修改建议

如果你要新增一种数据源类型，通常至少要同时改：

1. `datasource.types.ts`
2. `datasource.validation.ts`
3. `knex-connection.factory.ts`
4. `DatasourceService` 中的表/列/外键抓取逻辑
5. 前端创建表单
