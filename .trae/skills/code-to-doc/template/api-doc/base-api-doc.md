# API 文档模板

## 概述

简要说明 API 的整体功能和适用场景。例如：本 API 提供数据集管理功能，适用于需要创建、查询和管理数据集的业务场景。

## API 列表

### 数据集管理 API

#### 创建数据集

**API 名称**：createDataset  
**功能简述**：创建一个新的数据集  
**请求方式**：POST  
**请求路径**：`/api/datasets`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| name | string | 是 | 数据集名称 | "销售数据" |
| datasourceId | number | 是 | 数据源 ID | 1 |
| description | string | 否 | 数据集描述 | "销售数据分析" |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "销售数据",
    "datasourceId": 1,
    "description": "销售数据分析",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**错误码说明**：
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 参数错误 | 检查参数格式和必填项 |
| 404 | 数据源不存在 | 检查 datasourceId 是否正确 |
| 500 | 服务器错误 | 联系技术支持 |

---

### 查询数据集列表

**API 名称**：listDatasets  
**功能简述**：获取数据集列表  
**请求方式**：GET  
**请求路径**：`/api/datasets`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 10 |
| name | string | 否 | 数据集名称（模糊查询） | "销售" |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "销售数据",
        "datasourceId": 1,
        "description": "销售数据分析",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

**错误码说明**：
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 参数错误 | 检查参数格式和必填项 |
| 500 | 服务器错误 | 联系技术支持 |

---

## 库/SDK 使用示例

### 创建数据集（库/SDK）

**API 名称**：createDataset  
**功能简述**：创建一个新的数据集  
**函数签名**：`createDataset(options: CreateDatasetOptions): Promise<Dataset>`

**参数**：
| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| name | string | 是 | 数据集名称 | "销售数据" |
| datasourceId | number | 是 | 数据源 ID | 1 |
| description | string | 否 | 数据集描述 | "销售数据分析" |

**返回值**：

```typescript
interface Dataset {
  id: number;
  name: string;
  datasourceId: number;
  description: string;
  createdAt: string;
}
```

**使用示例**：

```javascript
const dataset = await createDataset({
  name: '销售数据',
  datasourceId: 1,
  description: '销售数据分析',
});
console.log(dataset.id); // 1
```

**错误处理**：
| 错误类型 | 说明 | 解决方案 |
|----------|------|----------|
| ValidationError | 参数验证失败 | 检查参数格式和必填项 |
| NotFoundError | 数据源不存在 | 检查 datasourceId 是否正确 |
| APIError | API 调用失败 | 检查网络连接和服务器状态 |

---

## 注意事项

- 参数示例值应真实可用
- 响应示例应包含完整的字段
- 错误码应覆盖常见场景
- 按功能模块分组，便于查找
- 根据项目类型选择合适的文档格式
- 避免使用特定编程语言的语法细节（除非是示例）
- 使用通用的类型名称（string、number、boolean 等）
- 对于复杂类型，提供简短的说明
