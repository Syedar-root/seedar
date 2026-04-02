# React+TS组件context层规范
## 核心职责
定义context目录下跨层通信Context的创建、命名、Provider封装、消费规则、使用约束
## 边界范围
仅覆盖context目录及Context相关实现，不涉及其他目录
## 强制规范
### 使用规范
- 核心职责：存放当前组件内部跨层通信的Context，用于同一组件下多层子组件/子页面间的通信，避免Props透传；禁止跨组件使用，禁止全局Context
- 存储约束：仅存储跨层需要共享的数据、方法，禁止存储子组件独有数据、视图无关数据，禁止传递大量数据
- 作用域：Context仅供当前组件内部使用，不对外暴露；无跨层需求时可删除该文件夹，禁止为空文件夹

### 书写规范
- 导入顺序：1. React相关；2. 内部类型；3. 其他内部资源
- Context创建：使用`createContext`创建，默认值符合类型，禁止any类型
- Provider封装：创建Context.Provider组件，仅传递跨层必需的数据和方法，在父组件tsx中包裹子组件
- 消费封装：封装自定义Hook消费Context，添加非空校验，避免直接使用`useContext`
- 导出：context下的`index.ts`仅导出Context、Provider、自定义Hook，无多余代码

### 禁止行为
- 禁止在Context中存储大量数据、子组件独有数据
- 禁止在Context中写业务逻辑、修改store状态
- 禁止跨组件使用当前组件的Context
- 禁止滥用Context，仅用于跨层通信的必要场景，可通过Props传递的禁止用Context