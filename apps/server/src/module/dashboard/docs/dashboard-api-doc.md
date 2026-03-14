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
    "layout": { "row": 1, "col": 1, "width": 12, "height": 6 }
  }
  ```

**响应**
- 成功: `201 Created`
  ```json
  {
    "id": "uuid",
    "name": "仪表盘名称",
    "layout": { "row": 1, "col": 1, "width": 12, "height": 6 },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

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
      "layout": { "row": 1, "col": 1, "width": 12, "height": 6 },
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
    "layout": { "row": 1, "col": 1, "width": 12, "height": 6 },
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
    "layout": { "row": 1, "col": 1, "width": 12, "height": 6 },
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
    "panels": [
      {
        "id": "uuid",
        "row": 1,
        "col": 1,
        "width": 6,
        "height": 4
      }
    ]
  }
  ```

**响应**
- 成功: `200 OK`
  ```json
  {
    "id": "uuid",
    "name": "仪表盘名称",
    "layout": {
      "panels": [
        {
          "id": "uuid",
          "row": 1,
          "col": 1,
          "width": 6,
          "height": 4
        }
      ]
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- 失败: `404 Not Found` - 仪表盘不存在

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

## 5. 错误处理

| 状态码 | 描述 |
|--------|------|
| 404 | 资源不存在 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

## 6. 最佳实践

1. **仪表盘布局设计**：合理规划面板布局，确保信息展示清晰
2. **面板配置**：根据面板类型设置合适的配置参数
3. **查询关联**：为需要数据的面板关联正确的查询 ID
4. **权限控制**：根据实际需求添加适当的权限控制
5. **性能优化**：对于包含大量数据的面板，考虑添加数据缓存机制