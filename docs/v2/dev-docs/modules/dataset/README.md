# 数据集模块文档

## 模块目标

数据集模块负责把物理表结构整理成语义层资产，供查询、面板和仪表盘复用。

## 文档列表

- [overview.md](./overview.md)
- [editor-flow.md](./editor-flow.md)
- [frontend-backend-map.md](./frontend-backend-map.md)
- [maintenance.md](./maintenance.md)

## 关键代码入口

- [DatasetPage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/dataset/pages/datasetPage.tsx)
- [DatasetEditorPage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/dataset/components/DatasetEditor/DatasetEditorPage.tsx)
- [useDataset.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useDataset.ts)
- [dataset.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/dataset/dataset.controller.ts)
- [dataset.service.ts](/D:/Program/projects/seedar/apps/server/src/module/dataset/services/dataset.service.ts)
