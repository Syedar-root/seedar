# Dashboard 模块实现 Tasks

## 前置任务

- [x] Task 0: 分析现有模块结构（datasource/query/dataset），参考其代码风格

## 核心任务

### 实体层

- [x] Task 1: 创建 Dashboard 实体 (entities/dashboard.entity.ts)
  - [x] Task 1.1: 定义 Dashboard 实体，id 使用 CHAR(36) UUID，包含 name, layout, createdAt, updatedAt
  - [x] Task 1.2: 使用 TypeORM @Entity 装饰器
  - [x] Task 1.3: 使用 @PrimaryGeneratedColumn('uuid') 定义 UUID 主键
  - [x] Task 1.4: 使用 @CreateDateColumn 和 @UpdateDateColumn

- [x] Task 2: 创建 DashboardPanel 实体 (entities/dashboard-panel.entity.ts)
  - [x] Task 2.1: 定义 DashboardPanel 实体，id 使用 CHAR(36) UUID
  - [x] Task 2.2: 字段：id, title, type (enum), queryId (UUID), config (JSON), width, height, createdAt, updatedAt
  - [x] Task 2.3: 添加 @ManyToOne 关联 Query 实体
  - [x] Task 2.4: 创建 type enum: 'chart' | 'table' | 'text' | 'card'

- [x] Task 3: 创建 DashboardPanelRelation 实体 (entities/dashboard-panel-relation.entity.ts)
  - [x] Task 3.1: 定义多对多关联表实体，dashboardId 和 panelId 使用 CHAR(36) UUID
  - [x] Task 3.2: 字段：dashboardId (UUID), panelId (UUID)
  - [x] Task 3.3: 添加 @ManyToOne 关联 Dashboard 和 DashboardPanel

### DTO 层

- [x] Task 4: 创建 Dashboard DTO
  - [x] Task 4.1: CreateDashboardDto - name, layout (optional)
  - [x] Task 4.2: UpdateDashboardDto - 使用 PartialType(CreateDashboardDto)
  - [x] Task 4.3: DashboardResponse - 返回完整的 Dashboard（含 panels）

- [x] Task 5: 创建 DashboardPanel DTO
  - [x] Task 5.1: CreatePanelDto - title, type, queryId, config, width, height
  - [x] Task 5.2: UpdatePanelDto - 使用 PartialType(CreatePanelDto)
  - [x] Task 5.3: PanelResponse - 返回完整的 Panel

### Service 层

- [x] Task 6: 创建 DashboardService (services/dashboard.service.ts)
  - [x] Task 6.1: create - 创建 Dashboard
  - [x] Task 6.2: findAll - 获取所有 Dashboard（不含关联）
  - [x] Task 6.3: findOne - 获取单个 Dashboard（含 panels 关联）
  - [x] Task 6.4: update - 更新 Dashboard
  - [x] Task 6.5: remove - 删除 Dashboard（级联删除关联）
  - [x] Task 6.6: updateLayout - 更新布局

- [x] Task 7: 创建 PanelService (services/panel.service.ts)
  - [x] Task 7.1: create - 创建 Panel
  - [x] Task 7.2: findAll - 获取所有 Panel
  - [x] Task 7.3: findOne - 获取单个 Panel
  - [x] Task 7.4: update - 更新 Panel
  - [x] Task 7.5: remove - 删除 Panel

### Controller 层

- [x] Task 8: 创建 DashboardController (dashboard.controller.ts)
  - [x] Task 8.1: POST /dashboard - 创建
  - [x] Task 8.2: GET /dashboard - 列表
  - [x] Task 8.3: GET /dashboard/:id - 详情
  - [x] Task 8.4: PATCH /dashboard/:id - 更新
  - [x] Task 8.5: DELETE /dashboard/:id - 删除
  - [x] Task 8.6: PUT /dashboard/:id/layout - 更新布局
  - [x] Task 8.7: POST /dashboard/:id/panels - 添加 Panel
  - [x] Task 8.8: DELETE /dashboard/:id/panels/:panelId - 移除 Panel

- [x] Task 9: 创建 PanelController (panel.controller.ts)
  - [x] Task 9.1: POST /panel - 创建
  - [x] Task 9.2: GET /panel - 列表
  - [x] Task 9.3: GET /panel/:id - 详情
  - [x] Task 9.4: PATCH /panel/:id - 更新
  - [x] Task 9.5: DELETE /panel/:id - 删除

### Module 层

- [x] Task 10: 创建 DashboardModule (dashboard.module.ts)
  - [x] Task 10.1: 导入 TypeORM forFeature
  - [x] Task 10.2: 导入 QueryModule（获取 Query 实体）
  - [x] Task 10.3: 注册 DashboardService, PanelService
  - [x] Task 10.4: 注册 DashboardController, PanelController

### 配置层

- [x] Task 11: 更新 app.module.ts
  - [x] Task 11.1: 导入 DashboardModule
  - [x] Task 11.2: 添加到 imports 数组

## 验证任务

- [ ] Task 12: 创建单元测试
  - [ ] Task 12.1: DashboardService 单元测试
  - [ ] Task 12.2: PanelService 单元测试

- [ ] Task 13: 手动测试 API
  - [ ] Task 13.1: 测试 Dashboard CRUD
  - [ ] Task 13.2: 测试 Panel CRUD
  - [ ] Task 13.3: 测试 Dashboard-Panel 关联

## 任务依赖

- Task 1, 2, 3 完成后才能做 Task 4, 5
- Task 4, 5 完成后才能做 Task 6, 7
- Task 6, 7 完成后才能做 Task 8, 9
- Task 8, 9 完成后才能做 Task 10
- Task 10 完成后才能做 Task 11
- Task 11 完成后才能做 Task 12, 13
