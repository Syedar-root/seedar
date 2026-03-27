# 实现数据源列表查询接口

## 任务概述
在前端 `d:\Program\projects\seedar\packages\ui-core\src\api\datasource.ts#L14-24` 中定义了 `findAll` 方法,调用 `GET /datasource` 接口获取所有数据源列表。但后端 `d:\Program\projects\seedar\apps\server\src\module\datasource\datasource.controller.ts` 中缺少对应的接口实现。

## 实现步骤

### 1. 在 DatasourceService 中添加 findAll 方法
- **文件**: `d:\Program\projects\seedar\apps\server\src\module\datasource\service\datasource.service.ts`
- **位置**: 在 `findOne` 方法之前添加
- **实现内容**:
  - 从数据库查询所有未软删除的数据源
  - 过滤掉 `deletedAt` 不为 null 的记录
  - 返回 `DatasourceResponse[]` 数组
  - **注意**: 列表查询只返回基本信息,不包含 `tables` 和 `foreignKeys`,以提高性能
- **参考**: 参考 `DashboardService.findAll()` 的实现模式

### 2. 在 DatasourceController 中添加 findAll 接口
- **文件**: `d:\Program\projects\seedar\apps\server\src\module\datasource\datasource.controller.ts`
- **位置**: 在 `@Post()` 方法之后,`@Get(':id')` 方法之前添加
- **实现内容**:
  - 添加 `@Get()` 装饰器
  - 添加 `@SuccessMessage('数据源列表查询成功')` 装饰器(参考现有的 `findOne` 方法)
  - 调用 `this.datasourceService.findAll()` 方法
  - 返回 `Promise<DatasourceResponse[]>`
- **参考**: 参考 `DashboardController.findAll()` 的实现模式

## 技术细节

### DatasourceResponse 构造函数
```typescript
constructor(
  datasource: Datasource,
  tables?: Array<{...}>,
  foreignKeys?: ForeignKeyResponse[]
)
```
- 列表查询时只传入 `datasource` 参数
- 不包含 `tables` 和 `foreignKeys`,避免加载大量关联数据

### 数据过滤
- 使用 TypeORM 的 `find()` 方法查询所有记录
- 自动过滤软删除的记录(`deletedAt` 不为 null)
- 如果需要显式过滤,可以使用 `{ where: { deletedAt: IsNull() } }`

## 验证方法
1. 启动后端服务
2. 调用 `GET /datasource` 接口
3. 验证返回的数据格式符合 `DatasourceResponse[]` 类型
4. 验证返回的数据不包含 `tables` 和 `foreignKeys` 字段
5. 验证软删除的数据源不在列表中
