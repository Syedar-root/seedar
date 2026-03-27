# 后端 Panel 实体支持 titleConfig 配置实施计划

## 目标
在 Panel 实体中添加 titleConfig 字段，支持与前端 title 组件对应的标题样式配置。

## 实施步骤

### 步骤 1: 创建 TitleType 枚举
**文件**: `apps/server/src/module/dashboard/title-type.enum.ts`
- 创建枚举类 `TitleType`
- 定义 4 个枚举值：`PLAIN`, `FLAG`, `EDITORIAL`, `BRUTALIST`
- 对应前端的 4 种标题类型

### 步骤 2: 创建 TitleConfig 类型定义
**文件**: `apps/server/src/module/dashboard/title-config.types.ts`
- 定义 `TitleConfig` 接口
- 包含以下字段：
  - `type`: TitleType（标题类型）
  - `content`: string（标题内容，可选）
  - `enableTooltip`: boolean（是否启用提示，可选）
  - `maxTitleWidth`: string（最大宽度，可选）
  - `flagColor`: string（旗帜颜色，可选）
  - `subtitle`: string（副标题，可选）
  - `accentText`: string（强调文本，可选）
- 所有字段标记为可选

### 步骤 3: 修改 Panel 实体
**文件**: `apps/server/src/module/dashboard/entities/panel.entity.ts`
- 导入新创建的 `TitleType` 枚举
- 在 `title` 字段后添加新字段 `titleConfig`
- 字段定义：
  ```typescript
  @Column({ name: 'title_config', type: 'json', nullable: true })
  titleConfig?: Record<string, any>;
  ```
- 保持现有 `title` 字段不变

### 步骤 4: 修改 CreatePanelRequest DTO
**文件**: `apps/server/src/module/dashboard/dto/create-panel.request.ts`
- 导入 `TitleConfig` 类型定义
- 添加 `titleConfig` 字段：
  ```typescript
  @IsOptional()
  @IsObject()
  titleConfig?: Record<string, any>;
  ```
- 字段放在现有字段列表的合适位置

### 步骤 5: 修改 PanelResponse DTO
**文件**: `apps/server/src/module/dashboard/dto/panel.response.ts`
- 添加 `titleConfig` 属性到类定义
- 在 `fromEntity` 静态方法中添加字段映射：
  ```typescript
  response.titleConfig = panel.titleConfig;
  ```

### 步骤 6: 更新 entities/index.ts（如需要）
**文件**: `apps/server/src/module/dashboard/entities/index.ts`
- 检查是否需要导出新的枚举或类型
- 如需要，添加相应的导出语句

### 步骤 7: 数据库迁移
- 使用 TypeORM 生成迁移文件
- 在 `panel` 表中添加 `title_config` 列
- 列类型：`json`（根据数据库类型调整）
- 列属性：`nullable`
- 执行迁移

### 步骤 8: 验证实现
- 运行 TypeScript 编译检查
- 运行 lint 检查
- 测试创建 Panel API（带 titleConfig）
- 测试更新 Panel API（带 titleConfig）
- 测试查询 Panel API（验证 titleConfig 返回）

## 文件变更清单

### 新增文件
1. `apps/server/src/module/dashboard/title-type.enum.ts`
2. `apps/server/src/module/dashboard/title-config.types.ts`

### 修改文件
1. `apps/server/src/module/dashboard/entities/panel.entity.ts`
2. `apps/server/src/module/dashboard/dto/create-panel.request.ts`
3. `apps/server/src/module/dashboard/dto/panel.response.ts`

### 数据库变更
1. `panel` 表添加 `title_config` 列

## 注意事项
- 所有字段都是可选的，保持向后兼容性
- `title` 字段继续保留，与 `titleConfig` 共存
- 使用 `@IsOptional()` 装饰器确保字段可选
- 使用 `@IsObject()` 进行基本验证
- 不需要复杂的嵌套验证，保持灵活性
- 现有数据不受影响（新字段为 nullable）

## 验证标准
- ✅ TypeScript 编译无错误
- ✅ ESLint 检查通过
- ✅ 可以成功创建带 titleConfig 的 Panel
- ✅ 可以成功更新 Panel 的 titleConfig
- ✅ 查询 Panel 时能正确返回 titleConfig
- ✅ 不影响现有功能（title 字段继续正常工作）
