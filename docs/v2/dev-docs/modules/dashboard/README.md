# 面板与仪表盘模块文档

## 1. 模块目标

该模块负责把 Query 结果封装成可视化面板，并把多个面板组合成仪表盘。

它是 Seedar 中最直接面向用户“看到成果”的部分。

## 2. 模块价值

如果说：

- `datasource` 负责接入数据
- `dataset` 负责建模数据
- `query` 负责执行数据

那么这里负责的是：

- 展示数据
- 编排数据
- 交付数据

因此它承担了系统“最后一公里”的价值。

## 3. 文档列表

- [overview.md](./overview.md)
- [panel-flow.md](./panel-flow.md)
- [dashboard-flow.md](./dashboard-flow.md)
- [maintenance.md](./maintenance.md)

## 4. 适合谁阅读

- 需要改图表、卡片、列表和布局的前端开发者
- 需要理解 Panel / Dashboard 资产关系的后端开发者
- 需要写“可视化模块设计”的论文作者

## 5. 关键代码入口

- [PanelPage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/panel/pages/panelPage.tsx)
- [DashboardPage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/dashboard/pages/dashboardPage.tsx)
- [useDashboard.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useDashboard.ts)
- [SeedarDashboard.tsx](/D:/Program/projects/seedar/packages/ui-react/src/components/dashboard/SeedarDashboard/SeedarDashboard.tsx)

## 6. 阅读时建议关注

1. Panel 与 Query 为什么分成两个资产。
2. Dashboard 为什么只保存布局与面板关系。
3. 预览态与正式展示态为什么共用但不完全重叠。
