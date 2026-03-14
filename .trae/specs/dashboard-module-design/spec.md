# Dashboard 模块设计 Spec

## Why

用户需要将前端的 Dashboard 画布配置持久化到后端，支持：
- Dashboard 管理和布局配置
- Panel 组件的复用（一个 Panel 可被多个 Dashboard 引用）
- Panel 关联 Query 获取数据
- 组件配置的扩展性（chart/table/text/card 等）

## What Changes

新增 Dashboard 模块，包含以下实体：
- **Dashboard**: 画布/仪表盘，管理布局和 Panel 引用
- **DashboardPanel**: 面板实体，关联 Query 和组件配置
- **DashboardPanelRelation**: Dashboard 与 Panel 的多对多关联表

### 数据库设计

```sql
-- Dashboard 表
CREATE TABLE dashboard (
  id CHAR(36) PRIMARY KEY,  -- UUID
  name VARCHAR(255) NOT NULL,
  layout JSON,  -- react-grid-layout 布局配置
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- DashboardPanel 表（可复用）
CREATE TABLE dashboard_panel (
  id CHAR(36) PRIMARY KEY,  -- UUID
  title VARCHAR(255),  -- 面板标题
  type VARCHAR(50) NOT NULL,  -- 'chart' | 'table' | 'text' | 'card'
  query_id CHAR(36),  -- 关联的 Query ID（UUID）
  config JSON,  -- 组件配置（VChart spec / VTable config / text content 等）
  width INT,  -- 宽度
  height INT,  -- 高度
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES query(id)
);

-- Dashboard 与 Panel 关联表
CREATE TABLE dashboard_panels (
  dashboard_id CHAR(36) NOT NULL,  -- UUID
  panel_id CHAR(36) NOT NULL,  -- UUID
  PRIMARY KEY (dashboard_id, panel_id),
  FOREIGN KEY (dashboard_id) REFERENCES dashboard(id) ON DELETE CASCADE,
  FOREIGN KEY (panel_id) REFERENCES dashboard_panel(id) ON DELETE CASCADE
);
```

### API 设计

#### Dashboard API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /dashboard | 创建 Dashboard |
| GET | /dashboard | 获取所有 Dashboard |
| GET | /dashboard/:id | 获取单个 Dashboard（含布局和 Panels） |
| PATCH | /dashboard/:id | 更新 Dashboard |
| DELETE | /dashboard/:id | 删除 Dashboard |

#### Panel API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /panel | 创建 Panel |
| GET | /panel | 获取所有 Panel |
| GET | /panel/:id | 获取单个 Panel |
| PATCH | /panel/:id | 更新 Panel |
| DELETE | /panel/:id | 删除 Panel |

#### Dashboard-Panel 关联 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /dashboard/:id/panels | 添加 Panel 到 Dashboard |
| DELETE | /dashboard/:id/panels/:panelId | 从 Dashboard 移除 Panel |
| PUT | /dashboard/:id/layout | 更新 Dashboard 布局 |

## Impact

- 新增模块：`apps/server/src/module/dashboard/`
- 依赖模块：Query 模块（Panel 关联 Query）
- 前端影响：需要适配新的 API 格式

## ADDED Requirements

### Requirement: Dashboard 实体管理
系统 SHALL 提供 Dashboard 的完整 CRUD 操作

#### Scenario: 创建 Dashboard
- **WHEN** 用户调用 POST /dashboard，传入 name 和空 layout
- **THEN** 返回创建的 Dashboard，包含 id、name、layout、createdAt

#### Scenario: 获取 Dashboard 及关联数据
- **WHEN** 用户调用 GET /dashboard/:id
- **THEN** 返回 Dashboard 对象，包含：
  - layout（布局 JSON）
  - panels 数组，每个包含 title、type、queryId、config、width、height

### Requirement: Panel 实体管理
系统 SHALL 提供 Panel 的完整 CRUD 操作

#### Scenario: 创建 Chart Panel
- **WHEN** 用户调用 POST /panel，传入：
  ```json
  {
    "title": "销售趋势图",
    "type": "chart",
    "queryId": 1,
    "config": { "type": "bar", "xField": "date", "yField": "amount" },
    "width": 800,
    "height": 400
  }
  ```
- **THEN** 返回创建的 Panel，包含所有字段

#### Scenario: Panel 复用
- **WHEN** 用户创建 Panel 后，在多个 Dashboard 中引用
- **THEN** 修改 Panel 配置，所有引用的 Dashboard 都生效

### Requirement: Dashboard 布局管理
系统 SHALL 提供 Dashboard 布局的更新能力

#### Scenario: 更新布局
- **WHEN** 用户调用 PUT /dashboard/:id/layout，传入 react-grid-layout 的 layout 配置
- **THEN** Dashboard 的 layout 字段更新，前端可重新渲染布局

## MODIFIED Requirements

### Requirement: Dashboard 模块集成
- Dashboard 模块依赖 Query 模块获取数据
- Panel.queryId 外键关联 Query 表

## REMOVED Requirements

无

## 预留扩展

1. **权限控制**：后续可通过 Token 鉴权模块添加 userId 字段
2. **版本管理**：后续可通过 DashboardVersion 表实现版本回退
3. **组件类型**：通过 Panel.type 字段扩展 text、card 等类型
