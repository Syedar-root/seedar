# 前端共享栈

## 1. `@seedar/ui-core`

核心价值：

- 屏蔽统一响应包装
- 提供 `DatasourceApi / DatasetApi / QueryApi / DashboardApi / PanelApi / AiApi`

## 2. `@seedar/ui-react`

核心价值：

- 提供 React Query hooks
- 提供 `SeedarDashboard`、`SeedarPanel`、`MetricCard`

相关入口：

- [useDataset.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useDataset.ts)
- [useQuery.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useQuery.ts)
- [useDashboard.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useDashboard.ts)
- [useAi.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useAi.ts)
- [SeedarDashboard.tsx](/D:/Program/projects/seedar/packages/ui-react/src/components/dashboard/SeedarDashboard/SeedarDashboard.tsx)
