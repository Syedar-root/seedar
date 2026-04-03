## 模块目录结构规范
## 核心职责
定义后端模块（业务模块、功能模块）的强制闭环目录结构，明确各目录的核心作用、分类导出规则、存在条件
## 边界范围
仅聚焦「目录层级 / 存在性」，不涉及文件命名、内容书写、逻辑实现
## 强制规范
所有业务模块必须遵循以下闭环结构，子功能模块递归复用同套结构，禁止自定义目录或文件名：
```plain

UserModule（模块根目录，闭环单元）
├── index.ts            // 模块对外唯一出口：仅导出模块类、公共类型，不写任何实现
├── user.module.ts      // 模块配置文件：NestJS Module 装饰器配置，依赖注入声明
├── entities            // 实体层：模块内所有数据实体定义，禁止POJO
│   ├── index.ts        // 实体层导出文件：统一导出当前模块所有实体
│   ├── user.entity.ts  // 用户实体定义
│   └── role.entity.ts  // 角色实体定义
├── dto                 // DTO层：请求与响应DTO定义，严格区分请求/响应
│   ├── index.ts        // DTO层导出文件：统一导出当前模块所有DTO
│   ├── user.create.request.dto.ts    // 创建用户请求DTO
│   ├── user.update.request.dto.ts    // 更新用户请求DTO
│   └── user.response.dto.ts          // 用户响应DTO
├── repositories        // 数据访问层：实体对应的Repository，数据操作实现
│   ├── index.ts        // 数据访问层导出文件：统一导出当前模块所有Repository
│   ├── user.repository.ts
│   └── role.repository.ts
├── services            // 业务逻辑层：业务逻辑实现，拆分复杂逻辑
│   ├── index.ts        // 业务层导出文件：统一导出当前模块所有公共Service
│   ├── user.service.ts
│   └── user-role.service.ts  // 拆分的子逻辑Service，控制单文件行数
├── controllers         // 接口层：接口定义、请求处理
│   ├── index.ts        // 接口层导出文件：统一导出当前模块所有Controller
│   └── user.controller.ts
├── guards              // 守卫层：模块私有守卫（可选，无则删除）
│   └── ...
├── interceptors        // 拦截器层：模块私有拦截器（可选，无则删除）
│   └── ...
├── config              // 配置层：模块私有配置（可选，无则删除）
│   └── ...
├── events              // 事件层：模块领域事件（可选，无则删除）
│   └── ...
└── utils               // 工具层：模块私有纯工具函数（可选，无则删除）
    └── ...
```
### 补充约束
1. 仅根目录的 index.ts 对外暴露模块内容，各子目录的 index.ts 仅用于内部统一导出，不对外暴露；
2. 无对应功能时可删除空目录（如无私有守卫可删除 guards 目录，无工具函数可删除 utils 目录）；
3. 所有子目录必须包含 index.ts 实现统一导出，禁止零散导出，内部导入优先通过子目录 index 导入；
4. 公共基础类（BaseEntity、BaseRepository、BaseService、通用DTO）必须存放在公共模块，禁止每个业务模块重复实现；
5. 禁止模块之间的循环依赖，公共模块不能依赖业务模块，业务模块可以依赖公共模块；
6. 可选扩展子目录：`config`（模块配置）、`events`（领域事件）、`filters`（模块私有异常过滤器），无对应功能时可删除。