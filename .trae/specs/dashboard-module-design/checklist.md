# Dashboard 模块实现 Checklist

## 实体层

- [x] Dashboard 实体定义正确，id 使用 CHAR(36) UUID，包含 name, layout, createdAt, updatedAt
- [x] DashboardPanel 实体定义正确，id 使用 CHAR(36) UUID，包含 title, type, queryId (UUID), config, width, height, createdAt, updatedAt
- [x] DashboardPanel 正确关联 Query 实体（@ManyToOne）
- [x] DashboardPanelRelation 实体定义正确，dashboardId 和 panelId 使用 CHAR(36) UUID
- [x] Panel type enum 包含: 'chart' | 'table' | 'text' | 'card'

## DTO 层

- [x] CreateDashboardDto 包含 name (string, required), layout (optional)
- [x] UpdateDashboardDto 正确继承 PartialType(CreateDashboardDto)
- [x] CreatePanelDto 包含所有必需字段: title, type, queryId, config, width, height
- [x] UpdatePanelDto 正确继承 PartialType(CreatePanelDto)
- [x] DashboardResponse 返回完整数据（含 panels 数组）

## Service 层

- [x] DashboardService.create 正确创建 Dashboard
- [x] DashboardService.findAll 返回 Dashboard 列表
- [x] DashboardService.findOne 返回单个 Dashboard（含关联的 panels）
- [x] DashboardService.update 正确更新 Dashboard
- [x] DashboardService.remove 正确删除 Dashboard（含级联删除关联）
- [x] DashboardService.updateLayout 正确更新布局
- [x] PanelService.create 正确创建 Panel
- [x] PanelService.findAll 返回 Panel 列表
- [x] PanelService.findOne 返回单个 Panel
- [x] PanelService.update 正确更新 Panel
- [x] PanelService.remove 正确删除 Panel

## Controller 层

- [x] POST /dashboard 创建 Dashboard
- [x] GET /dashboard 获取 Dashboard 列表
- [x] GET /dashboard/:id 获取 Dashboard 详情
- [x] PATCH /dashboard/:id 更新 Dashboard
- [x] DELETE /dashboard/:id 删除 Dashboard
- [x] PUT /dashboard/:id/layout 更新布局
- [x] POST /dashboard/:id/panels 添加 Panel
- [x] DELETE /dashboard/:id/panels/:panelId 移除 Panel
- [x] POST /panel 创建 Panel
- [x] GET /panel 获取 Panel 列表
- [x] GET /panel/:id 获取 Panel 详情
- [x] PATCH /panel/:id 更新 Panel
- [x] DELETE /panel/:id 删除 Panel

## Module 层

- [x] DashboardModule 正确导入 TypeORM 实体
- [x] DashboardModule 正确导入 QueryModule
- [x] DashboardModule 注册了所有需要的 Services 和 Controllers

## 集成

- [x] app.module.ts 正确导入 DashboardModule
- [ ] 数据库迁移或同步成功创建 dashboard, dashboard_panel, dashboard_panels 表

## 错误处理

- [x] GET /dashboard/:id 不存在时返回 404
- [x] GET /panel/:id 不存在时返回 404
- [x] DELETE /dashboard/:id 不存在时返回 404
- [x] DELETE /panel/:id 不存在时返回 404

## 代码风格

- [x] 遵循现有模块（datasource/query/dataset）的代码风格
- [x] 使用中文注释或无注释
- [x] 变量命名与现有代码一致
