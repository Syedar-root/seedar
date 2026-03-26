# Dashboard Aside 组件开发计划

## 目标
为 Dashboard 页面创建一个侧边栏组件，用于展示看板列表，支持切换和新建看板。

## 数据结构
```typescript
interface DashboardResponse {
  id: string;
  name: string;
  layout: Layouts;
  panels: PanelResponse[];
  createdAt: Date;
  updatedAt: Date;
}
```

## 路由配置
- 路径: `dashboard/:dashboardId?`
- `/dashboard` - 未选中看板
- `/dashboard/{id}` - 选中指定看板

---

## 任务列表

### Task 1: 创建 DashboardAside 组件
**文件**: `apps/web-client/src/modules/dashboard/components/aside/DashboardAside.tsx`

**功能点**:
1. 调用 `useDashboards()` 获取看板列表
2. 调用 `useParams()` 获取当前 `dashboardId`
3. 调用 `useNavigate()` 实现路由跳转
4. 调用 `useCreateDashboard()` 实现新建看板
5. 列表项点击跳转到 `/dashboard/${id}`
6. 当前选中的看板高亮显示
7. 顶部显示标题"看板列表"
8. 顶部右侧添加新建按钮
9. 使用 `ScrollArea` 组件实现滚动
10. 空状态显示"暂无看板"

**依赖**:
- `lucide-react` 图标: `Plus`, `LayoutDashboard`
- `@/core/components/ui/ScrollArea`
- `clsx` 用于条件样式

---

### Task 2: 创建样式文件
**文件**: `apps/web-client/src/modules/dashboard/components/aside/DashboardAside.module.scss`

**样式结构**:
```
.aside          - 容器，固定宽度 200px
  .header       - 头部，包含标题和新建按钮
    .title      - 标题文字
    .addButton  - 新建按钮
  .list         - 列表容器 (ScrollArea)
    .item       - 列表项
      .icon     - 图标
      .name     - 名称
    .active     - 选中状态
    .empty      - 空状态
```

**样式要点**:
- 使用 CSS 变量: `--bg-color`, `--border-color`, `--text-color`, `--primary-color` 等
- 选中项: 背景色高亮 + 右侧边框指示
- Hover 状态: 背景色变化
- 新建按钮: 透明背景 + hover 时显示边框和颜色

---

### Task 3: 更新导出文件
**文件**: `apps/web-client/src/modules/dashboard/components/aside/index.ts`

**内容**:
```typescript
export { DashboardAside } from "./DashboardAside";
```

---

### Task 4: 更新 dashboardPage.tsx
**文件**: `apps/web-client/src/modules/dashboard/pages/dashboardPage.tsx`

**修改内容**:
1. 导入 `DashboardAside` 组件
2. 将空的 `<aside></aside>` 替换为 `<DashboardAside />`
3. 移除页面中不再需要的 `useDashboards()` 调用（移至 Aside 组件内部）

---

### Task 5: 更新样式文件
**文件**: `apps/web-client/src/modules/dashboard/pages/styles/dashboard.module.scss`

**修改内容**:
- 移除 `aside` 的样式定义（由组件内部样式接管）

---

## 文件变更摘要

| 操作 | 文件路径 |
|------|----------|
| 新建 | `apps/web-client/src/modules/dashboard/components/aside/DashboardAside.tsx` |
| 新建 | `apps/web-client/src/modules/dashboard/components/aside/DashboardAside.module.scss` |
| 修改 | `apps/web-client/src/modules/dashboard/components/aside/index.ts` |
| 修改 | `apps/web-client/src/modules/dashboard/pages/dashboardPage.tsx` |
| 修改 | `apps/web-client/src/modules/dashboard/pages/styles/dashboard.module.scss` |

---

## 验证步骤
1. 启动开发服务器
2. 访问 `/dashboard` 页面
3. 验证侧边栏正确显示看板列表
4. 验证点击列表项可切换看板
5. 验证当前看板高亮显示
6. 验证新建按钮可创建看板并跳转
7. 验证空状态正确显示
