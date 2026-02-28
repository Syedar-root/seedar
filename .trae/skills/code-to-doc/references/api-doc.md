# API 文档生成规范

## 文档目标

帮助新人在 30 分钟内调用核心功能，无需了解技术实现细节。

## 文档结构

基础示例模板请参考[base-api-doc.md](../template/api-doc/base-api-doc.md)

### 1. 概述

简要说明 API 的整体功能和适用场景。

### 2. API 列表

按功能模块分组列出所有 API，每个 API 包含以下信息：

#### API 基本信息

- **API 名称**：清晰的功能名称
- **功能简述**：一句话说明 API 的作用
- **请求方式**：GET/POST/PUT/DELETE/PATCH 等（RESTful）或函数名/类名（库/SDK）
- **请求路径**：完整的 API 路径（如 `/api/dataset`）或函数签名（如 `createDataset(options)`）

#### 请求参数

以表格形式列出所有参数：

| 参数名 | 类型   | 必填 | 说明     | 示例值     |
| ------ | ------ | ---- | -------- | ---------- |
| id     | number | 是   | 资源 ID  | 1          |
| name   | string | 否   | 资源名称 | "销售数据" |

**类型说明**：

- 基础类型：string、number、boolean、array、object
- 自定义类型：根据项目实际情况填写（如 User、Order 等）
- 枚举类型：列出所有可选值

#### 响应示例

提供完整的响应示例：

**RESTful API 响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "销售数据",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**库/SDK 响应**：

```javascript
{
  id: 1,
  name: "销售数据",
  createdAt: "2024-01-01T00:00:00Z"
}
```

**CLI 响应**：

```
✓ 数据集创建成功
ID: 1
名称: 销售数据
创建时间: 2024-01-01T00:00:00Z
```

### 3. 错误码说明

列出常见错误码及其含义：

| 错误码 | 说明       | 解决方案             |
| ------ | ---------- | -------------------- |
| 404    | 资源不存在 | 检查 ID 是否正确     |
| 400    | 参数错误   | 检查参数格式和必填项 |
| 500    | 服务器错误 | 联系技术支持         |

**注意**：对于库/SDK，错误可能以异常或错误对象的形式返回，请根据实际情况调整。

## 内容要求

### 必须包含

- API 名称
- 功能简述
- 请求方式（根据项目类型选择合适的描述方式）
- 请求路径或函数签名
- 完整的参数列表（含类型、必填、说明、示例值）
- 响应示例
- 错误码说明

### 禁止包含

- 数据库连接细节
- 代码实现逻辑
- 内部技术架构
- 性能优化建议
- 开发调试信息
- 特定编程语言的语法细节（除非是示例）

## 通用生成步骤

### 第一步：识别项目类型

根据项目特征确定项目类型：

- **RESTful API**：有 HTTP 路由、使用 HTTP 动词（GET/POST 等）
- **GraphQL API**：有 Schema、Query、Mutation 定义
- **库/SDK**：提供函数/类供其他代码调用
- **CLI 工具**：命令行界面，通过命令和参数交互
- **gRPC 服务**：使用 Protocol Buffers 定义服务
- **WebSocket 服务**：实时双向通信

### 第二步：定位 API 定义文件

根据项目类型和编程语言，查找 API 定义文件：

#### RESTful API

**常见文件模式**：

- `*controller*.ts` / `*controller*.js` / `*controller*.py`
- `*route*.ts` / `*route*.js` / `*route*.py`
- `*api*.ts` / `*api*.js` / `*api*.py`
- `*handler*.go` / `*handler*.java`
- `views.py` (Django)
- `app.py` / `main.py` (Flask)

**关键标识**：

- HTTP 方法装饰器：`@Get`、`@Post`、`@app.route`、`router.get()`
- 路由定义：`/api/resource`、`'/resource'`

#### GraphQL API

**常见文件模式**：

- `*.graphql` / `*.gql`
- `*schema*.ts` / `*schema*.js`
- `*resolver*.ts` / `*resolver*.js`

**关键标识**：

- Schema 定义：`type Query`、`type Mutation`
- Resolver 函数

#### 库/SDK

**常见文件模式**：

- `index.ts` / `index.js` / `index.py` / `lib.rs`
- `*api*.ts` / `*client*.ts`
- `__init__.py`

**关键标识**：

- 导出的函数：`export function`、`def`、`pub fn`
- 导出的类：`export class`、`class`、`pub struct`

#### CLI 工具

**常见文件模式**：

- `cli.ts` / `cli.js` / `cli.py`
- `main.ts` / `main.js` / `main.py`
- `bin/*`

**关键标识**：

- 命令解析：`commander`、`yargs`、`argparse`、`clap`
- 命令定义：`program.command()`、`parser.add_argument()`

#### gRPC 服务

**常见文件模式**：

- `*.proto`
- `*service*.ts` / `*service*.js` / `*service*.py`

**关键标识**：

- Proto 定义：`service`、`rpc`
- 生成的服务代码

#### WebSocket 服务

**常见文件模式**：

- `*socket*.ts` / `*socket*.js` / `*socket*.py`
- `*websocket*.ts` / `*websocket*.js`

**关键标识**：

- Socket 连接：`socket.io`、`ws`、`WebSocket`
- 事件监听：`on()`、`emit()`

### 第三步：提取 API 信息

根据项目类型，提取相应的 API 信息：

#### RESTful API

1. 提取路由路径
2. 提取 HTTP 方法
3. 提取请求参数（从路径参数、查询参数、请求体中提取）
4. 提取响应结构

#### GraphQL API

1. 提取 Query 和 Mutation 定义
2. 提取参数列表
3. 提取返回类型

#### 库/SDK

1. 提取导出的函数和类
2. 提取函数参数
3. 提取返回类型

#### CLI 工具

1. 提取命令名称
2. 提取命令参数（选项、参数）
3. 提取命令输出

#### gRPC 服务

1. 提取服务方法
2. 提取请求消息结构
3. 提取响应消息结构

#### WebSocket 服务

1. 提取事件名称
2. 提取事件数据结构
3. 提取响应事件

### 第四步：查找参数和响应定义

根据项目类型，查找参数和响应的定义：

- **TypeScript/JavaScript**：查找接口定义（interface）、类型定义（type）、JSDoc 注释
- **Python**：查找类型注解、dataclass、pydantic 模型
- **Java**：查找类定义、注解（如@RequestParam、@RequestBody）
- **Go**：查找结构体定义（struct）、标签（tag）
- **C#**：查找类定义、属性
- **Rust**：查找结构体定义（struct）、枚举（enum）
- **PHP**：查找类定义、DocBlock 注释

### 第五步：生成文档

按照上述结构生成 API 文档，根据项目类型调整格式。

## 示例模板

基础示例模板请参考[base-api-doc.md](../template/api-doc/base-api-doc.md)
