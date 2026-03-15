# Dashboard 模块 API 文档

## 1. 概述

Dashboard 模块提供了仪表盘和面板的管理功能，包括创建、查询、更新、删除操作，以及仪表盘布局管理和面板关联管理。

## 2. 仪表盘 API

### 2.1 创建仪表盘

**请求**
- 方法: `POST`
- 路径: `/dashboard`
- 请求体: 
  ```json
  {
    "name": "仪表盘名称",
    "layout": {
      "lg": [
        {
          "i": "panel-uuid",
          "x": 0,
          "y": 0,
          "w": 6,
          "h": 4
        }
      ],
      "md": [
        {
          "i": "panel-uuid",
          "x": 0,
          "y": 0,
          "w": 4,
          "h": 4
        }
      ]
    }
  }
  ```

**响应**
- 成功: `201 Created`
  ```json
  {
    "id": "uuid",
    "name": "仪表盘名称",
    "layout": {
      "lg": [
        {
          "i": "panel-uuid",
          "x": 0,
          "y": 0,
          "w": 6,
          "h": 4
        }
      ]
    },
    "panels": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- 失败: `400 Bad Request` - 布局中包含无效的面板 ID

### 2.2 获取所有仪表盘

**请求**
- 方法: `GET`
- 路径: `/dashboard`

**响应**
- 成功: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "name": "仪表盘名称",
      "layout": {
        "lg": [
          {
            "i": "panel-uuid",
            "x": 0,
            "y": 0,
            "w": 6,
            "h": 4
          }
        ]
      },
      "panels": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
  ```

### 2.3 获取单个仪表盘

**请求**
- 方法: `GET`
- 路径: `/dashboard/:id`

**响应**
- 成功: `200 OK`
  ```json
  {
    "id": "uuid",
    "name": "仪表盘名称",
    "layout": {
      "lg": [
        {
          "i": "panel-uuid",
          "x": 0,
          "y": 0,
          "w": 6,
          "h": 4
        }
      ]
    },
    "panels": [
      {
        "id": "uuid",
        "title": "面板标题",
        "type": "chart",
        "queryId": "uuid",
        "config": {},
        "width": 6,
        "height": 4
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- 失败: `404 Not Found` - 仪表盘不存在

### 2.4 更新仪表盘

**请求**
- 方法: `PATCH`
- 路径: `/dashboard/:id`
- 请求体: 
  ```json
  {
    "name": "新仪表盘名称"
  }
  ```

**响应**
- 成功: `200 OK`
  ```json
  {
    "id": "uuid",
    "name": "新仪表盘名称",
    "layout": {
      "lg": [
        {
          "i": "panel-uuid",
          "x": 0,
          "y": 0,
          "w": 6,
          "h": 4
        }
      ]
    },
    "panels": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- 失败: `404 Not Found` - 仪表盘不存在

### 2.5 删除仪表盘

**请求**
- 方法: `DELETE`
- 路径: `/dashboard/:id`

**响应**
- 成功: `204 No Content`
- 失败: `404 Not Found` - 仪表盘不存在

### 2.6 更新仪表盘布局

**请求**
- 方法: `PUT`
- 路径: `/dashboard/:id/layout`
- 请求体: 
  ```json
  {
    "lg": [
      {
        "i": "panel-uuid",
        "x": 0,
        "y": 0,
        "w": 6,
        "h": 4,
        "minW": 2,
        "minH": 2,
        "maxW": 12,
        "maxH": 8,
        "static": false,
        "isDraggable": true,
        "isResizable": true
      }
    ],
    "md": [
      {
        "i": "panel-uuid",
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4
      }
    ],
    "sm": [
      {
        "i": "panel-uuid",
        "x": 0,
        "y": 0,
        "w": 2,
        "h": 4
      }
    ],
    "xs": [],
    "xxs": []
  }
  ```

**响应**
- 成功: `200 OK`
  ```json
  {
    "id": "uuid",
    "name": "仪表盘名称",
    "layout": {
      "lg": [
        {
          "i": "panel-uuid",
          "x": 0,
          "y": 0,
          "w": 6,
          "h": 4
        }
      ]
    },
    "panels": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- 失败: `404 Not Found` - 仪表盘不存在
- 失败: `400 Bad Request` - 布局中包含无效的面板 ID

### 2.7 向仪表盘添加面板

**请求**
- 方法: `POST`
- 路径: `/dashboard/:id/panels`
- 请求体: 
  ```json
  {
    "panelId": "uuid"
  }
  ```

**响应**
- 成功: `200 OK`
- 失败: `404 Not Found` - 仪表盘不存在

### 2.8 从仪表盘移除面板

**请求**
- 方法: `DELETE`
- 路径: `/dashboard/:id/panels/:panelId`

**响应**
- 成功: `204 No Content`
- 失败: `404 Not Found` - 面板不存在于仪表盘中

## 3. 面板 API

### 3.1 创建面板

**请求**
- 方法: `POST`
- 路径: `/panel`
- 请求体: 
  ```json
  {
    "title": "面板标题",
    "type": "chart",
    "queryId": "uuid",
    "config": {},
    "width": 6,
    "height": 4
  }
  ```

**响应**
- 成功: `201 Created`
  ```json
  {
    "id": "uuid",
    "title": "面板标题",
    "type": "chart",
    "queryId": "uuid",
    "config": {},
    "width": 6,
    "height": 4,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

### 3.2 获取所有面板

**请求**
- 方法: `GET`
- 路径: `/panel`

**响应**
- 成功: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "title": "面板标题",
      "type": "chart",
      "queryId": "uuid",
      "config": {},
      "width": 6,
      "height": 4,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
  ```

### 3.3 获取单个面板

**请求**
- 方法: `GET`
- 路径: `/panel/:id`

**响应**
- 成功: `200 OK`
  ```json
  {
    "id": "uuid",
    "title": "面板标题",
    "type": "chart",
    "queryId": "uuid",
    "config": {},
    "width": 6,
    "height": 4,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- 失败: `404 Not Found` - 面板不存在

### 3.4 更新面板

**请求**
- 方法: `PATCH`
- 路径: `/panel/:id`
- 请求体: 
  ```json
  {
    "title": "新面板标题",
    "config": { "color": "blue" }
  }
  ```

**响应**
- 成功: `200 OK`
  ```json
  {
    "id": "uuid",
    "title": "新面板标题",
    "type": "chart",
    "queryId": "uuid",
    "config": { "color": "blue" },
    "width": 6,
    "height": 4,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- 失败: `404 Not Found` - 面板不存在

### 3.5 删除面板

**请求**
- 方法: `DELETE`
- 路径: `/panel/:id`

**响应**
- 成功: `204 No Content`
- 失败: `404 Not Found` - 面板不存在

## 4. 面板类型

面板支持以下类型：

| 类型 | 描述 |
|------|------|
| `chart` | 图表面板 |
| `table` | 表格面板 |
| `text` | 文本面板 |
| `card` | 卡片面板 |

## 5. 布局结构

### 5.1 响应式断点

布局支持以下响应式断点：

| 断点 | 描述 | 典型屏幕宽度 |
|------|------|-------------|
| `lg` | 大屏幕 | ≥1200px |
| `md` | 中等屏幕 | ≥996px |
| `sm` | 小屏幕 | ≥768px |
| `xs` | 超小屏幕 | ≥480px |
| `xxs` | 极小屏幕 | <480px |

### 5.2 布局项字段

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `i` | string | 是 | 面板 ID（对应 panel.id） |
| `x` | number | 是 | 水平位置（网格列号） |
| `y` | number | 是 | 垂直位置（网格行号） |
| `w` | number | 是 | 宽度（网格列数） |
| `h` | number | 是 | 高度（网格行数） |
| `minW` | number | 否 | 最小宽度 |
| `minH` | number | 否 | 最小高度 |
| `maxW` | number | 否 | 最大宽度 |
| `maxH` | number | 否 | 最大高度 |
| `static` | boolean | 否 | 是否静态（不可拖拽/调整大小） |
| `isDraggable` | boolean | 否 | 是否可拖拽 |
| `isResizable` | boolean | 否 | 是否可调整大小 |

## 6. 错误处理

| 状态码 | 描述 |
|--------|------|
| 404 | 资源不存在 |
| 400 | 请求参数错误（含布局中无效的面板 ID） |
| 500 | 服务器内部错误 |

## 7. 最佳实践

1. **仪表盘布局设计**：合理规划面板布局，确保信息展示清晰
2. **响应式布局**：为不同屏幕尺寸配置合适的布局，提升用户体验
3. **面板配置**：根据面板类型设置合适的配置参数
4. **查询关联**：为需要数据的面板关联正确的查询 ID
5. **权限控制**：根据实际需求添加适当的权限控制
6. **性能优化**：对于包含大量数据的面板，考虑添加数据缓存机制

---

> 【更新于 2026-03-15】：根据代码变更，更新布局结构为响应式布局格式（支持 lg/md/sm/xs/xxs 断点），新增布局项字段说明，修正响应格式中增加 panels 字段，添加布局验证错误说明。
