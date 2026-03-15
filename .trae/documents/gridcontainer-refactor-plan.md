# GridContainer 组件复用重构计划

## 目标
将 `gridContainer.tsx` 改造为通用组件，让 `seedarDashboard.tsx` 直接复用它，消除重复代码。

## 当前问题
- `gridContainer.tsx` 和 `seedarDashboard.tsx` 存在大量重复代码
- 网格配置（COLS、MARGIN）、响应式逻辑、compactor 配置完全相同
- `seedarDashboard.tsx` 无法复用 `gridContainer.tsx` 的逻辑

## 重构步骤

### 步骤 1: 重构 `gridContainer.tsx` 为通用组件

**文件**: `d:\projects\seedar\packages\ui-react\src\components\gridContainer\gridContainter.tsx`

**改动内容**:
1. 添加 props 接口定义：
   ```typescript
   interface GridContainerProps {
     layouts: Layouts;
     children: React.ReactNode;
   }
   ```

2. 将硬编码的 `layouts` 改为通过 props 传入

3. 将 `children` 改为通过 props 传入（替换当前的 `<SeedarPanel panelId="1" key="1" />`）

4. 保持所有网格配置不变：
   - COLS_RATE, COLS, MARGIN 常量
   - currentCols 和 rowHeight 计算逻辑
   - compactor 配置
   - Responsive 组件配置

### 步骤 2: 重构 `seedarDashboard.tsx` 使用通用组件

**文件**: `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedarDashboard.tsx`

**改动内容**:
1. 移除重复的网格配置代码：
   - COLS_RATE, COLS, MARGIN 常量
   - currentCols 和 rowHeight 计算逻辑
   - compactor 配置
   - Responsive 组件及相关导入

2. 导入并使用 `GridContainer` 组件

3. 简化为：
   ```typescript
   const SeedarDashboard: React.FC<SeedarDashboardProps> = ({ dashboardId }) => {
     const { data: dashboardData, isPending, isError } = useDashboard(dashboardId);
     
     if (isPending || isError || !dashboardData) {
       return <LoadingOrError />;
     }
     
     return (
       <GridContainer layouts={dashboardData.layout}>
         {dashboardData.panels.map((panel) => (
           <SeedarPanel key={panel.id} panelId={panel.id} panel={panel} />
         ))}
       </GridContainer>
     );
   };
   ```

## 预期收益
- ✅ 消除 ~60 行重复代码
- ✅ 统一网格布局逻辑
- ✅ `gridContainer.tsx` 成为可复用的通用组件
- ✅ `seedarDashboard.tsx` 代码量减少约 50%
- ✅ 更易维护和扩展

## 风险评估
- 低风险：仅涉及代码重构，不改变功能逻辑
- 需要测试：确保两个组件重构后功能正常
