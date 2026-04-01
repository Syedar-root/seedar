---
name: "react-ts-component-design"

description: "专为AI开发场景定制，提供React+TS组件开发的完整约束体系，包含1个总领规范（覆盖数据流、组件设计流程、AI生成强制约束）与8个专项子规范（含目录结构、命名、根目录文件、子组件、hooks、store、utils、context），用于规范AI开发中React+TS组件的全流程开发、代码校验与规范引用；Invoke when user performs React+TS component development for AI, needs to reference component design specifications during AI development, verifies whether AI-generated React+TS component code complies with the specifications, or consults relevant rules of React+TS component design for AI development."
---

# React+TS 组件设计规范（AI 开发专用）

本规范为 React+TS 组件开发的统一约束，为适配 Agent Skills 规范，已拆分为 1 个总领规范+8 个专项子规范，总领规范包含全局通用规则，子规范为各模块的专项约束，可按需引用。

## 专项子规范列表

| 子规范                                                               | 说明                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------- |
| [组件目录结构规范](./references/01-component-directory-structure.md) | 定义组件强制闭环目录结构，明确目录层级与存在规则         |
| [组件命名规范](./references/02-component-naming.md)                  | 统一全链路命名规则，覆盖目录、文件、类型、样式等全环节   |
| [根目录核心文件规范](./references/03-root-core-files.md)             | 根目录下 index.ts、tsx、样式、types 文件的使用与书写规范 |
| [私有子组件/页面子模块规范](./references/04-sub-components-pages.md) | 私有子组件、页面子模块的专项约束与数据传递规则           |
| [组件 hooks 层规范](./references/05-component-hooks.md)              | 自定义 Hook 的逻辑封装、书写与异步处理规范               |
| [组件 store 层规范](./references/06-component-store.md)              | 内部私有状态管理、状态定义与操作的完整约束               |
| [组件 utils 层规范](./references/07-component-utils.md)              | 纯工具函数的封装、书写与约束规范                         |
| [组件 context 层规范](./references/08-component-context.md)          | 内部跨层通信 Context 的创建、封装与消费规则              |

---

## 全局通用规则

### 一、数据流设计规范

数据流核心原则：**单向流动、源头唯一、职责清晰**，所有数据流转必须贴合组件目录结构，明确“数据从哪里来、到哪里去、如何操作”，禁止任何反向数据流、隐式数据流。

#### 1. 数据流分类

- 外部数据流：组件与外部的交互，仅通过 Props 传入、onXxx 回调抛出
- 内部纵向数据流：父 → 子/子 → 父的交互，仅通过 Props 传递、回调抛出
- 内部跨层数据流：多层子组件的通信，仅通过当前组件的 context 传递
- 状态数据流：组件内部状态的流转，仅在 hooks→store→ 视图间流转
- 数据获取数据流：接口请求统一收敛在 hooks 中处理

#### 2. 外部数据流规范

- 数据流入：仅通过 Props 传入，所有数据定义类型，可选 Props 设置默认值，仅传入最小粒度数据
- 数据流出：仅通过 onXxx 回调抛出，仅抛出外部需要的数据，禁止抛出内部资源

#### 3. 内部纵向数据流规范

- 父 → 子：共用数据通过 Props 传递，子组件仅读取，不修改；方法通过 Props 传递，子组件仅调用
- 子 → 父：仅通过父组件传递的回调抛出数据，禁止子组件直接操作父组件 store、Props

#### 4. 内部跨层数据流规范

- 仅使用当前组件的 context 实现，禁止全局 context；仅传递跨层必需的数据，禁止滥用
- 禁止 Props 多层透传，超过 2 层的通信必须使用 context

#### 5. 状态数据流规范

- 状态修改必须通过 store 的方法，异步操作在 hooks 中处理，禁止在 store 中处理异步
- 视图层仅读取状态，禁止修改状态，复杂渲染通过 utils 或 useMemo 处理

#### 6. 数据获取数据流规范

- 共用数据由父组件 hooks 统一获取，存入父组件 store，分发给子组件
- 子组件独有数据由自身 hooks 获取，禁止重复请求共用数据
- 禁止在视图层处理数据获取逻辑

#### 7. 禁止行为

- 禁止反向数据流、隐式数据流
- 禁止重复数据获取、数据冗余
- 禁止在视图层处理业务逻辑、修改状态

---

### 二、组件设计流程步骤

组件设计遵循 8 步流程，严格按顺序执行：

1. **需求拆解**：明确组件类型、拆解功能、识别共用数据、拆分子组件、梳理数据流
2. **创建目录**：按规范创建组件根目录、子目录与基础文件
3. **定义类型**：在 types.ts 中收敛所有类型，类型先行
4. **设计 store**：初始化状态、编写状态修改方法，完成状态管理
5. **数据获取**：在 hooks 中处理数据获取、异步逻辑，共用数据上提父组件
6. **开发主组件**：编排 UI、绑定事件、提供 context，仅做视图组装
7. **开发子组件/子页面**：递归执行整套规范，子组件仅处理自身独有逻辑
8. **测试优化**：校验类型、数据流、store、结构，完成性能优化

---

### 三、AI 生成强制约束

所有 AI 生成代码必须严格遵循以下规则，不可违背：

1. 严格遵循所有目录、命名、文件、store、数据流规范，禁止自定义结构
2. 共用数据必须上提父组件，子组件禁止重复请求、存储共用数据
3. store 仅管理内部私有状态，禁止全局状态，禁止直接修改状态
4. 所有文件严格按模板书写，禁止遗漏核心约束
5. types.ts 收敛所有类型，禁止 any、隐式类型
6. hooks 遵循单一职责，异步操作必须完善清理函数
7. 视图层仅做 UI 编排，禁止写业务逻辑、接口请求
8. 导入导出使用相对路径，禁止循环导入、冗余导入
9. 禁止调试代码、冗余代码，保持代码简洁规范
