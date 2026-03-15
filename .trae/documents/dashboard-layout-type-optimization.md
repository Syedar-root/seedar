# Dashboard Layout 类型优化和验证实施计划

## 目标
优化 Dashboard 的 layout 字段类型定义，从简单的 `Record<string, any>` 改为精确的 react-grid-layout 配置类型，并在 Service 层添加 panelId 存在性验证。

## 背景说明
- 当前 `layout` 字段类型过于宽泛（`Record<string, any>`）
- 需要精确描述 react-grid-layout 的配置结构
- Layout 中的 `i` 字段对应 panelId，需要验证这些 panelId 是否真实存在

## 实施步骤

### 步骤 1：修改 DTO 类型定义
**文件**: `d:\projects\seedar\apps\server\src\module\dashboard\dto\create-dashboard.request.ts`

**操作内容**:
1. 添加 `LayoutItem` 接口，定义单个布局项的类型：
   - `i: string` - 唯一标识符（对应 panelId）
   - `x: number` - x 坐标
   - `y: number` - y 坐标
   - `w: number` - 宽度（列数）
   - `h: number` - 高度（行数）
   - `minW?: number` - 最小宽度（可选）
   - `minH?: number` - 最小高度（可选）
   - `maxW?: number` - 最大宽度（可选）
   - `maxH?: number` - 最大高度（可选）
   - `static?: boolean` - 是否固定位置（可选）
   - `isDraggable?: boolean` - 是否可拖拽（可选）
   - `isResizable?: boolean` - 是否可调整大小（可选）

2. 添加 `Layouts` 接口，定义响应式布局配置：
   - `lg?: LayoutItem[]` - 大屏幕 (>= 1200px)
   - `md?: LayoutItem[]` - 中等屏幕 (>= 996px)
   - `sm?: LayoutItem[]` - 小屏幕 (>= 768px)
   - `xs?: LayoutItem[]` - 超小屏幕 (>= 480px)
   - `xxs?: LayoutItem[]` - 极小屏幕 (>= 0px)

3. 更新 `CreateDashboardRequest` 类中的 `layout` 字段类型为 `Layouts`

**预期结果**: DTO 类型定义精确，符合 react-grid-layout 的配置结构

---

### 步骤 2：修改 Service 层添加验证逻辑
**文件**: `d:\projects\seedar\apps\server\src\module\dashboard\services\dashboard.service.ts`

**操作内容**:
1. 导入必要的依赖：
   - `BadRequestException` from `@nestjs/common`
   - `PanelService` from `../services/panel.service`
   - `Layouts` 接口（从 DTO 导入）

2. 在 `DashboardService` 构造函数中注入 `PanelService`：
   ```typescript
   constructor(
     @InjectRepository(Dashboard)
     private readonly dashboardRepository: Repository<Dashboard>,
     @InjectRepository(DashboardPanelRelation)
     private readonly relationRepository: Repository<DashboardPanelRelation>,
     private readonly panelService: PanelService,
   ) {}
   ```

3. 创建私有方法 `validateLayoutPanelIds`：
   - 参数：`layout: Layouts | null | undefined`
   - 逻辑：
     a. 如果 layout 为空，直接返回
     b. 遍历所有断点（lg, md, sm, xs, xxs）
     c. 收集所有唯一的 panelId（即 LayoutItem 的 `i` 字段）
     d. 如果没有 panelId，直接返回
     e. 批量查询这些 panelId 是否存在
     f. 如果有 panelId 不存在，抛出 `BadRequestException` 并列出无效的 panelId

4. 在 `create` 方法中调用验证：
   - 在保存 dashboard 之前调用 `await this.validateLayoutPanelIds(createDashboardRequest.layout)`

5. 在 `updateLayout` 方法中调用验证：
   - 在更新 dashboard 之前调用 `await this.validateLayoutPanelIds(layout)`

**预期结果**: Service 层能够验证 layout 中的 panelId 是否存在，防止无效数据

---

### 步骤 3：修改 Entity 类型定义
**文件**: `d:\projects\seedar\apps\server\src\module\dashboard\entities\dashboard.entity.ts`

**操作内容**:
1. 导入 `Layouts` 接口（从 DTO 导入）

2. 更新 `layout` 字段的类型注解：
   - 从：`layout: Record<string, any> | null;`
   - 改为：`layout: Layouts | null;`

**预期结果**: Entity 类型定义与 DTO 保持一致

---

## 验证步骤

1. **类型检查**: 运行 TypeScript 类型检查，确保没有类型错误
2. **构建测试**: 运行项目构建，确保编译通过
3. **功能测试**:
   - 测试创建带有效 layout 的 dashboard
   - 测试创建带无效 panelId 的 layout（应抛出异常）
   - 测试更新 layout 为有效配置
   - 测试更新 layout 为无效 panelId（应抛出异常）

## 注意事项

1. **向后兼容性**: 由于 `Layouts` 接口是可选字段，现有数据不会受影响
2. **性能考虑**: 批量查询 panelId 时使用 `IN` 操作，避免 N+1 查询问题
3. **错误提示**: 抛出异常时提供清晰的错误信息，列出所有无效的 panelId
4. **循环依赖**: 确保 DTO 和 Entity 之间的导入不会造成循环依赖问题

## 预期影响

- **正面影响**:
  - 类型安全提升，减少运行时错误
  - 代码可读性增强，IDE 智能提示更准确
  - 数据一致性得到保障

- **潜在风险**:
  - 如果现有数据库中存在无效的 panelId，可能导致更新失败
  - 需要确保前端传递的 layout 数据符合新的类型定义
