## 模块命名规范
## 核心职责
统一模块全链路的命名规则，明确各类目录 / 文件 / 实体 / DTO/Service 的命名格式、约束、禁用场景
## 边界范围
仅聚焦「命名格式 / 约束」，不涉及目录结构、文件内容、逻辑实现
## 强制规范
### 1. 模块根目录命名
- 格式：**PascalCase（大驼峰）**，首字母大写，后续每个单词首字母均大写，无空格、无下划线、无特殊字符
- 约束：必须与模块主文件、模块名称完全一致；禁止小写、下划线命名；禁止模糊化命名（如 Module、MyModule 等无意义名称）
- 示例：正确（UserModule、OrderModule、ProductModule），错误（usermodule、user_module、MyModule）
### 2. 根目录核心文件命名
- `index.ts`：固定命名，禁止自定义（如 export.ts、entry.ts），后缀固定为.ts
- 模块主文件：**模块名小写.module.ts**，与根目录名称对应，后缀固定为.module.ts，禁止自定义
- 示例：正确（user.module.ts），错误（UserModule.module.ts、user.config.ts）
### 3. entities 目录命名
- 目录名：固定为**entities**（全小写），禁止自定义（如 models、pojos）
- 实体文件：**实体名小写.entity.ts**，后缀固定为.entity.ts
- 实体类名：**PascalCase**，如`User`、`UserRole`
- 示例：正确（user.entity.ts、role.entity.ts），错误（user.model.ts、UserPOJO.ts）
### 4. dto 目录命名
- 目录名：固定为**dto**（全小写），禁止自定义（如 dtos、validators）
- DTO 文件：**功能描述.类型.dto.ts**，必须明确区分请求 / 响应类型，后缀固定为.dto.ts
    - 请求 DTO：后缀为`.request.dto.ts`，如创建请求为`user.create.request.dto.ts`
    - 响应 DTO：后缀为`.response.dto.ts`，如用户响应为`user.response.dto.ts`
- DTO 类名：**PascalCase**，如`UserCreateRequestDto`、`UserUpdateRequestDto`、`UserResponseDto`
- 示例：正确（user.create.request.dto.ts、user.response.dto.ts），错误（user.dto.ts、user.req.dto.ts）
### 5. repositories 目录命名
- 目录名：固定为**repositories**（全小写），禁止自定义（如 dao、db）
- Repository 文件：**实体名小写.repository.ts**，后缀固定为.repository.ts
- Repository 类名：**PascalCase**，如`UserRepository`
- 示例：正确（user.repository.ts），错误（user.dao.ts、UserDB.ts）
### 6. services 目录命名
- 目录名：固定为**services**（全小写），禁止自定义（如 services、logic）
- Service 文件：**功能描述小写.service.ts**，后缀固定为.service.ts，复杂逻辑拆分时用中划线连接
- Service 类名：**PascalCase**，如`UserService`、`UserRoleService`
- 示例：正确（user.service.ts、user-role.service.ts），错误（user.logic.ts、UserBusiness.ts）
### 7. controllers 目录命名
- 目录名：固定为**controllers**（全小写），禁止自定义（如 apis、routes）
- Controller 文件：**模块名小写.controller.ts**，后缀固定为.controller.ts
- Controller 类名：**PascalCase**，如`UserController`
- 示例：正确（user.controller.ts），错误（user.api.ts、UserRoute.ts）
### 8. 其他目录命名
- guards/interceptors/utils/config/events：目录名固定为全小写，禁止自定义
- 下属文件：**功能描述小写.类型.ts**，如`user-auth.guard.ts`、`response-transform.interceptor.ts`
### 9. 类型定义命名
- 所有类型、类名：**PascalCase**，语义化命名，如`UserEntity`、`UserCreateRequestDto`、`UserResponseDto`
- 禁止模糊命名，禁止无类型后缀的命名，禁止使用无意义的名称如`Dto`、`Entity`
### 10. 函数与方法命名
- 函数、方法名：**camelCase（小驼峰）**，语义化命名，如`createUser`、`findUserById`、`validateUserRole`
- 禁止无意义命名，禁止使用`handle`、`process`等模糊名称