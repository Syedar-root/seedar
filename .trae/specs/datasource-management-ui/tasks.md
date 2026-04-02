# 数据源管理界面实现 Tasks

## 前置任务

- [x] Task 0: 分析现有组件结构和设计规范
  - [x] Task 0.1: 分析 CreateDashboardDialog 组件结构和样式
  - [x] Task 0.2: 分析 DashboardAside 列表组件实现
  - [x] Task 0.3: 理解项目 CSS 变量使用方式
  - [x] Task 0.4: 理解 useDatasources, useCreateDatasource, useDeleteDatasource hooks 的使用

## 核心任务

### 页面结构

- [x] Task 1: 创建数据源模块目录结构
  - [x] Task 1.1: 创建 apps/web-client/src/modules/datasource/ 目录
  - [x] Task 1.2: 创建 pages/ 子目录
  - [x] Task 1.3: 创建 components/ 子目录
  - [x] Task 1.4: 创建 styles/ 子目录

### 数据源列表页面

- [x] Task 2: 创建数据源列表页面组件
  - [x] Task 2.1: 创建 datasourcePage.tsx，包含页面标题和创建按钮
  - [x] Task 2.2: 使用 useDatasources hook 获取数据源列表
  - [x] Task 2.3: 实现加载状态和错误处理
  - [x] Task 2.4: 创建 datasource.module.scss 样式文件

- [x] Task 3: 创建数据源卡片组件
  - [x] Task 3.1: 创建 DatasourceCard.tsx 组件
  - [x] Task 3.2: 显示数据源基本信息（名称、类型、连接信息、创建时间、状态）
  - [x] Task 3.3: 添加操作按钮（查看详情、删除）
  - [x] Task 3.4: 创建 datasourceCard.module.scss 样式文件
  - [x] Task 3.5: 实现悬停效果和过渡动画

- [x] Task 4: 创建数据源列表组件
  - [x] Task 4.1: 创建 DatasourceList.tsx 组件
  - [x] Task 4.2: 使用 ScrollArea 组件包裹列表
  - [x] Task 4.3: 实现空状态显示
  - [x] Task 4.4: 创建 datasourceList.module.scss 样式文件
  - [x] Task 4.5: 实现响应式布局（桌面端、平板端、移动端）

### 创建数据源弹窗

- [x] Task 5: 创建数据源类型选择组件
  - [x] Task 5.1: 创建 DatasourceTypeSelector.tsx 组件
  - [x] Task 5.2: 实现三种数据源类型卡片（MySQL、PostgreSQL、ClickHouse）
  - [x] Task 5.3: 添加图标和描述文字
  - [x] Task 5.4: 实现选择状态样式
  - [x] Task 5.5: 创建 datasourceTypeSelector.module.scss 样式文件

- [x] Task 6: 创建连接配置表单组件
  - [x] Task 6.1: 创建 ConnectionForm.tsx 组件
  - [x] Task 6.2: 实现表单字段（数据源名称、主机地址、端口号、数据库名称、用户名、密码）
  - [x] Task 6.3: 实现端口号根据数据源类型自动填充默认值
  - [x] Task 6.4: 实现密码显示/隐藏切换
  - [x] Task 6.5: 实现实时表单验证
  - [x] Task 6.6: 创建 connectionForm.module.scss 样式文件

- [x] Task 7: 创建连接测试组件
  - [x] Task 7.1: 创建 ConnectionTest.tsx 组件
  - [x] Task 7.2: 实现测试连接按钮
  - [x] Task 7.3: 实现加载状态显示（⏳ 正在测试连接...）
  - [x] Task 7.4: 实现成功状态显示（✅ 连接成功！用时 X.Xs）
  - [x] Task 7.5: 实现失败状态显示（❌ 连接失败：[错误信息]）
  - [x] Task 7.6: 创建 connectionTest.module.scss 样式文件

- [x] Task 8: 创建创建数据源弹窗组件
  - [x] Task 8.1: 创建 CreateDatasourceDialog.tsx 组件
  - [x] Task 8.2: 使用 @base-ui/react Dialog 组件
  - [x] Task 8.3: 集成 DatasourceTypeSelector、ConnectionForm、ConnectionTest 组件
  - [x] Task 8.4: 实现弹窗状态管理（打开/关闭）
  - [x] Task 8.5: 实现表单数据管理
  - [x] Task 8.6: 实现创建数据源逻辑（调用 useCreateDatasource）
  - [x] Task 8.7: 实现成功提示（使用 sonner toast）
  - [x] Task 8.8: 创建 createDatasourceDialog.module.scss 样式文件
  - [x] Task 8.9: 实现弹窗动画（参考 CreateDashboardDialog）

### 数据源详情页面

- [x] Task 9: 创建数据源详情页面组件
  - [x] Task 9.1: 创建 datasourceDetailPage.tsx 组件
  - [x] Task 9.2: 使用 useDatasource hook 获取数据源详情
  - [x] Task 9.3: 显示数据源基本信息（名称、类型、连接信息、状态）
  - [x] Task 9.4: 显示表结构列表
  - [x] Task 9.5: 显示每个表的列信息
  - [x] Task 9.6: 显示外键关系列表
  - [x] Task 9.7: 创建 datasourceDetailPage.module.scss 样式文件

- [x] Task 10: 创建表结构展示组件
  - [x] Task 10.1: 创建 TableStructure.tsx 组件
  - [x] Task 10.2: 显示表名和表注释
  - [x] Task 10.3: 显示列信息表格（列名、数据类型、是否可空、是否主键）
  - [x] Task 10.4: 显示外键关系
  - [x] Task 10.5: 创建 tableStructure.module.scss 样式文件

### 删除数据源功能

- [x] Task 11: 实现删除数据源功能
  - [x] Task 11.1: 在 DatasourceCard 组件中添加删除按钮点击事件
  - [x] Task 11.2: 创建删除确认弹窗（使用 @base-ui/react Dialog）
  - [x] Task 11.3: 实现删除逻辑（调用 useDeleteDatasource）
  - [x] Task 11.4: 实现删除成功提示（使用 sonner toast）
  - [x] Task 11.5: 实现删除失败提示（显示错误信息）

### 路由配置

- [x] Task 12: 添加数据源管理路由
  - [x] Task 12.1: 在路由配置中添加 /datasource 路由（数据源列表）
  - [x] Task 12.2: 在路由配置中添加 /datasource/:id 路由（数据源详情）
  - [x] Task 12.3: 在导航栏中添加数据源管理入口（如果需要）

### 导出和集成

- [x] Task 13: 创建模块导出文件
  - [x] Task 13.1: 创建 pages/index.ts 导出页面组件
  - [x] Task 13.2: 创建 components/index.ts 导出组件
  - [x] Task 13.3: 创建模块根目录的 index.ts

- [x] Task 14: 集成到应用
  - [x] Task 14.1: 在 App.tsx 或适当位置导入数据源模块
  - [x] Task 14.2: 测试路由跳转
  - [x] Task 14.3: 测试弹窗打开和关闭

## 验证任务

- [x] Task 15: 手动测试数据源管理功能
  - [x] Task 15.1: 测试数据源列表页面加载
  - [x] Task 15.2: 测试空状态显示
  - [x] Task 15.3: 测试创建数据源流程（选择类型、填写表单、测试连接、创建）
  - [x] Task 15.4: 测试数据源详情页面
  - [x] Task 15.5: 测试删除数据源功能（未使用和已使用两种情况）
  - [x] Task 15.6: 测试响应式布局（桌面端、平板端、移动端）
  - [x] Task 15.7: 测试键盘导航和可访问性
  - [x] Task 15.8: 测试错误处理和提示信息

## 任务依赖

- Task 0 完成后才能做 Task 1
- Task 1 完成后才能做 Task 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- Task 2, 3, 4 完成后才能做 Task 12
- Task 5, 6, 7, 8 完成后才能做 Task 12
- Task 9, 10 完成后才能做 Task 12
- Task 11 完成后才能做 Task 12
- Task 12 完成后才能做 Task 13, 14
- Task 13, 14 完成后才能做 Task 15
