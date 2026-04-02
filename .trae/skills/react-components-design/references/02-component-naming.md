# React+TS组件命名规范
## 核心职责
统一组件全链路的命名规则，明确各类目录/文件/类型/Hook/Context的命名格式、约束、禁用场景
## 边界范围
仅聚焦「命名格式/约束」，不涉及目录结构、文件内容、逻辑实现
## 强制规范
### 1. 组件根目录命名
- 格式：**PascalCase（大驼峰）**，首字母大写，后续每个单词首字母均大写，无空格、无下划线、无特殊字符
- 约束：必须与组件主文件、组件名称完全一致；禁止小写、下划线命名；禁止模糊化命名（如Component、MyComp等无意义名称）
- 示例：正确（AComp、UserList、OrderDetail），错误（acomp、user_list、MyComponent）

### 2. 根目录核心文件命名
- `index.ts`：固定命名，禁止自定义（如export.ts、entry.ts），后缀固定为.ts
- 组件主文件：**组件名.tsx**，与根目录名称完全一致，后缀固定为.tsx，禁止自定义（如ACompView.tsx）
- 样式文件：**组件名.module.样式后缀**，后缀仅允许css/scss/less，禁止自定义（如ACompStyle.module.css）
- `types.ts`：固定命名，禁止自定义（如type.ts、interface.ts），后缀固定为.ts

### 3. components目录命名
- 目录名：固定为**components**（全小写），禁止自定义（如subComponents）
- 子组件目录：与根目录命名规则一致，PascalCase
- 下属`index.ts`：固定命名，仅用于导出子组件

### 4. pages目录命名
- 目录名：固定为**pages**（全小写），禁止自定义（如subPages）
- 子页面目录：与根目录命名规则一致，PascalCase
- 下属`index.ts`：固定命名，仅用于导出子页面

### 5. hooks目录命名
- 目录名：固定为**hooks**（全小写），禁止自定义（如customHooks）
- Hook文件：**use+逻辑描述.hook.ts**，前缀固定use，后缀固定.hook.ts
- 示例：正确（useACompData.hook.ts、useUserOperate.hook.ts），错误（ACompData.hook.ts、useACompData.ts）

### 6. store目录命名
- 目录名：固定为**store**（全小写），禁止自定义（如state、storeManager）
- 下属文件：固定为`index.ts`、`store.ts`，复杂逻辑可拆分`actions.ts`、`state.ts`，禁止自定义文件名
- 状态方法：命名为`set+状态名`/`update+状态名`（如setIsLoading、updateLocalList）

### 7. utils目录命名
- 目录名：固定为**utils**（全小写），禁止自定义（如tools、helpers）
- 工具文件：单文件时固定为`utils.ts`，拆分时为**功能描述.utils.ts**，后缀固定为.utils.ts
- 函数名：**camelCase（小驼峰）**，语义化命名（如formatLocalList、validatePhone），禁止无意义命名

### 8. context目录命名
- 目录名：固定为**context**（全小写），禁止自定义（如contexts）
- Context文件：**组件名+Context.tsx**，与根目录名称一致，后缀固定为.tsx
- 下属`index.ts`：固定命名，仅用于导出Context相关资源

### 9. 类型定义命名
- 类型名：**PascalCase**，语义化命名，如`ACompProps`、`ACompState`、`OnConfirmCallback`、`ACompContextType`
- 禁止模糊命名，禁止无类型后缀的命名

### 10. 样式类名命名
- 样式类名：**kebab-case（短横线命名）**，与元素功能对应（如.container、.title、.btn-confirm），禁止无意义命名（如.class1、.box）
- 预处理器变量：**kebab-case**，前缀标注用途（如$color-、$spacing-）
- 混合宏：**kebab-case**，语义化命名（如border-radius、absolute-center）