# 数据源模块快速入门指南

## 1. 模块简介

数据源模块是系统的基础组件，用于管理各种类型的数据源连接、元数据获取和数据处理。该模块支持多种数据源类型，包括 MySQL、PostgreSQL、ClickHouse、CSV 和 Excel。

## 2. 环境配置

### 2.1 依赖安装

确保项目已经安装了以下依赖：

```bash
# 安装核心依赖
npm install @nestjs/common @nestjs/typeorm typeorm knex

# 安装数据库驱动（根据需要选择）
npm install mysql2 pg clickhouse

# 安装配置管理
npm install @nestjs/config
```

### 2.2 环境变量配置

在项目根目录创建 `.env` 文件，并添加以下配置：

```dotenv
# 数据库连接信息
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=seedar
DATABASE_USERNAME=root
DATABASE_PASSWORD=123456

# 用于加密数据源配置的密钥
ENCRYPTION_KEY=your_encryption_key_here
```

### 2.3 模块注册

在 NestJS 应用的模块文件中注册数据源模块：

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasourceModule } from './module/datasource/datasource.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    DatasourceModule,
  ],
})
export class AppModule {}
```

## 3. 基本使用

### 3.1 创建数据源

**步骤 1：准备配置**

根据数据源类型准备相应的配置：

- **MySQL 配置**：
  ```json
  {
    "name": "测试MySQL数据源",
    "type": "mysql",
    "config": {
      "host": "localhost",
      "port": "3306",
      "database": "test_db",
      "username": "root",
      "password": "123456"
    }
  }
  ```

- **PostgreSQL 配置**：
  ```json
  {
    "name": "测试PostgreSQL数据源",
    "type": "postgres",
    "config": {
      "host": "localhost",
      "port": "5432",
      "database": "test_db",
      "username": "postgres",
      "password": "123456"
    }
  }
  ```

- **ClickHouse 配置**：
  ```json
  {
    "name": "测试ClickHouse数据源",
    "type": "clickhouse",
    "config": {
      "host": "localhost",
      "port": "8123",
      "database": "test_db",
      "username": "default",
      "password": ""
    }
  }
  ```

- **CSV 配置**：
  ```json
  {
    "name": "测试CSV数据源",
    "type": "csv",
    "config": {
      "filePath": "/path/to/data.csv",
      "delimiter": ",",
      "encoding": "utf-8"
    }
  }
  ```

- **Excel 配置**：
  ```json
  {
    "name": "测试Excel数据源",
    "type": "excel",
    "config": {
      "filePath": "/path/to/data.xlsx",
      "sheetName": "Sheet1"
    }
  }
  ```

**步骤 2：发送请求**

使用 POST 请求创建数据源：

```bash
curl -X POST http://localhost:3000/datasource \
  -H "Content-Type: application/json" \
  -d '{"name": "测试MySQL数据源", "type": "mysql", "config": {"host": "localhost", "port": "3306", "database": "test_db", "username": "root", "password": "123456"}}'
```

**步骤 3：验证结果**

成功创建后，会返回数据源信息，包括 ID、名称、类型、配置等。

### 3.2 查询数据源

使用 GET 请求获取数据源详情：

```bash
curl http://localhost:3000/datasource/1
```

响应会包含数据源的完整信息，包括表结构和外键关系。

### 3.3 更新数据源

使用 PATCH 请求更新数据源：

```bash
curl -X PATCH http://localhost:3000/datasource/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "更新后的数据源名称", "config": {"host": "newhost", "port": "3306", "database": "test_db", "username": "root", "password": "654321"}}'
```

### 3.4 删除数据源

使用 DELETE 请求删除数据源：

```bash
curl -X DELETE http://localhost:3000/datasource/1
```

## 4. 高级使用

### 4.1 使用服务层

在代码中直接使用 `DatasourceService` 进行操作：

```typescript
import { Injectable } from '@nestjs/common';
import { DatasourceService } from './module/datasource/service/datasource.service';
import { CreateDatasourceRequest } from './module/datasource/dto/create-datasource.request';

@Injectable()
export class MyService {
  constructor(private readonly datasourceService: DatasourceService) {}

  async createDataSource() {
    const request: CreateDatasourceRequest = {
      name: '测试数据源',
      type: 'mysql',
      config: {
        host: 'localhost',
        port: '3306',
        database: 'test_db',
        username: 'root',
        password: '123456'
      }
    };

    return await this.datasourceService.create(request);
  }

  async getDataSource(id: number) {
    return await this.datasourceService.findOne(id);
  }
}
```

### 4.2 自定义数据源类型

要添加新的数据源类型，需要：

1. 在 `DataSourceType` 枚举中添加新类型
2. 创建对应的配置类
3. 在 `validateDataSourceConfig` 函数中添加验证逻辑
4. 在 `getTableNames` 和 `getTableColumns` 方法中添加对应的处理逻辑

### 4.3 批量操作

对于大量数据源的操作，可以使用批量处理方式提高性能：

```typescript
// 批量创建数据源
async createMultipleDatasources(requests: CreateDatasourceRequest[]) {
  const results = [];
  for (const request of requests) {
    const result = await this.datasourceService.create(request);
    results.push(result);
  }
  return results;
}
```

## 5. 常见问题

### 5.1 连接测试失败

**问题**：创建数据源时连接测试失败

**解决方案**：
- 检查数据库服务是否运行
- 验证连接配置是否正确
- 确保网络连接畅通
- 检查数据库用户权限

### 5.2 元数据获取失败

**问题**：数据源创建成功，但元数据获取失败

**解决方案**：
- 检查数据库用户是否有查询系统表的权限
- 验证数据库结构是否正常
- 查看日志获取详细错误信息

### 5.3 配置加密问题

**问题**：配置加密失败或解密失败

**解决方案**：
- 确保环境变量 `ENCRYPTION_KEY` 已正确设置
- 检查加密算法是否正确实现
- 验证配置格式是否正确

## 6. 性能优化

### 6.1 连接池配置

对于数据库类型的数据源，合理配置连接池可以提高性能：

```json
{
  "name": "优化的MySQL数据源",
  "type": "mysql",
  "config": {
    "host": "localhost",
    "port": "3306",
    "database": "test_db",
    "username": "root",
    "password": "123456",
    "pool": {
      "min": 2,
      "max": 10
    }
  }
}
```

### 6.2 元数据缓存

元数据获取是一个耗时操作，建议在业务逻辑中合理缓存元数据信息，避免重复获取。

### 6.3 批量操作

对于大量数据的操作，使用批量处理可以减少数据库交互次数，提高性能。

## 7. 最佳实践

1. **命名规范**：数据源名称应清晰明了，反映数据源的用途和类型
2. **配置管理**：敏感配置信息应妥善保管，避免硬编码
3. **错误处理**：合理处理数据源操作中的错误，提供清晰的错误提示
4. **权限控制**：对数据源的访问应进行适当的权限控制
5. **监控**：定期检查数据源状态，确保连接正常

## 8. 总结

数据源模块是系统的基础组件，通过统一的接口和流程管理多种类型的数据源。本指南介绍了数据源模块的基本使用方法，包括环境配置、数据源的创建、查询、更新和删除操作，以及高级使用技巧和性能优化建议。

通过本指南，您应该能够快速上手数据源模块，为系统添加和管理各种类型的数据源，为上层应用提供统一、安全、可靠的数据访问能力。