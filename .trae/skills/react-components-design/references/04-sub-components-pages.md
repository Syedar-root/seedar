# React+TS私有子组件/页面子模块规范
## 核心职责
定义components（私有子组件）、pages（页面子模块）目录的使用场景、递归规范、导出规则、数据传递约束
## 边界范围
仅聚焦components/pages目录，不涉及hooks/store/utils/context
## 强制规范
### 1. components目录（私有子组件）
#### 使用规范
- 核心职责：存放仅当前组件可使用的私有子组件，子组件不对外暴露，仅供父组件内部调用；禁止存放全局组件、其他组件的子组件
- 递归约束：子组件必须完全复用整套组件规范（目录结构、命名、文件规则），递归执行
- 目录约束：禁止将子组件直接放在components根目录，必须为每个子组件创建独立根目录
- 空目录约束：无私有子组件时可删除该文件夹，禁止为空文件夹

#### 导出规范
components下的`index.ts`仅用于导出当前目录下的所有子组件，无多余代码，格式固定：
```typescript
// 导出components下所有子组件（按需导出）
export { default as BComp } from './BComp';
export { default as CComp } from './CComp';
// 按需导出子组件Props类型（可选）
export type { BCompProps, CCompProps } from './BComp/types';
```

#### 数据传递约束
- 子组件仅接收父组件传递的Props，禁止直接引用父组件的store、hooks
- 子组件如需引用父组件类型，通过相对路径导入，禁止循环导入
- 子组件的store仅管理自身独有状态，共用状态从父组件Props获取

### 2. pages目录（页面子模块）
#### 使用规范
- 核心职责：仅用于「页面级组件」（可独立路由访问的组件），存放该页面的子页面模块；普通组件禁止创建该目录
- 递归约束：子页面必须完全复用整套组件规范，递归执行
- 目录约束：禁止将子页面直接放在pages根目录，必须为每个子页面创建独立根目录
- 空目录约束：无子页面时可删除该文件夹，禁止为空文件夹

#### 导出规范
pages下的`index.ts`仅用于导出当前目录下的所有子页面，无多余代码，格式固定：
```typescript
// 导出pages下所有子页面（按需导出）
export { default as A1Page } from './A1';
export { default as A2Page } from './A2';
// 按需导出子页面Props类型（可选）
export type { A1PageProps, A2PageProps } from './A1/types';
```

#### 数据传递约束
- 子页面仅接收父页面传递的Props，不直接对接外部接口
- 共用数据由父页面hooks统一获取，存入父页面store，通过Props传递给子页面
- 子页面的store仅存储自身独有状态，禁止重复存储父页面的共用数据
- 子页面如需修改父页面状态，通过父页面传递的回调函数触发，禁止直接操作父页面store