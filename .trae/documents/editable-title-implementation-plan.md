# 可编辑标题功能实现计划

## 功能概述
在面板编辑页面添加可编辑标题功能，支持内联编辑，点击保存按钮时一起保存到后端。

## 需求确认
- 标题存储位置：`panelData.title`
- 默认标题："未命名面板"
- 编辑方式：内联编辑（点击编辑图标后在原位置变成输入框）
- 保存时机：点击"保存"按钮时一起保存
- 显示位置：`panelPage.tsx` 第80行（标题区域）
- 图标库：lucide-react

## 实现步骤

### 步骤1：创建 EditableTitle 组件
**文件路径**：`d:\Program\projects\seedar\apps\web-client\src\modules\panel\components\editableTitle\editableTitle.tsx`

**功能实现**：
- 导入必要的图标：`Pencil`, `Check`, `X` from `lucide-react`
- 定义组件 Props 接口：
  - `title: string` - 当前标题
  - `onTitleChange: (title: string) => void` - 标题变更回调
- 组件状态：
  - `isEditing: boolean` - 是否处于编辑状态
  - `editValue: string` - 编辑中的标题值
- 展示状态渲染：
  - 显示标题文本
  - 悬停时显示编辑图标（Pencil）
  - 点击编辑图标进入编辑模式
- 编辑状态渲染：
  - 显示输入框
  - 显示确认图标（Check）
  - 显示取消图标（X）
- 交互逻辑：
  - 点击编辑图标：设置 `isEditing = true`，`editValue = title`
  - 点击确认图标：调用 `onTitleChange(editValue)`，设置 `isEditing = false`
  - 点击取消图标：设置 `isEditing = false`
  - 输入框按 Enter：同确认图标
  - 输入框按 Esc：同取消图标
  - 输入框失去焦点：同确认图标

### 步骤2：创建 EditableTitle 组件样式
**文件路径**：`d:\Program\projects\seedar\apps\web-client\src\modules\panel\components\editableTitle\editableTitle.module.scss`

**样式定义**：
- `.editableTitle` - 容器样式
  - `display: flex`
  - `align-items: center`
  - `gap: 8px`
- `.title` - 标题文本样式
  - `font-size: 18px`
  - `font-weight: 600`
  - `color: #333`
- `.editIcon` - 编辑图标样式
  - `opacity: 0` - 默认隐藏
  - `cursor: pointer`
  - `transition: opacity 0.2s`
  - `&:hover` - 颜色变化
- `.editableTitle:hover .editIcon` - 悬停时显示编辑图标
- `.input` - 输入框样式
  - `font-size: 18px`
  - `font-weight: 600`
  - `padding: 4px 8px`
  - `border: 1px solid #007bff`
  - `border-radius: 4px`
  - `outline: none`
  - `min-width: 200px`
- `.actionIcon` - 操作图标样式
  - `cursor: pointer`
  - `transition: color 0.2s`
  - `&:hover` - 颜色变化

### 步骤3：创建 EditableTitle 组件导出
**文件路径**：`d:\Program\projects\seedar\apps\web-client\src\modules\panel\components\editableTitle\index.ts`

**内容**：
```typescript
export { EditableTitle } from "./editableTitle";
```

### 步骤4：修改 usePanelEditorState hook
**文件路径**：`d:\Program\projects\seedar\apps\web-client\src\modules\panel\hooks\usePanelEditorState.ts`

**修改内容**：
1. 在 `UsePanelEditorStateReturn` 接口中添加：
   - `title: string` - 当前标题
   - `handleTitleChange: (title: string) => void` - 标题变更处理函数

2. 在 `usePanelEditorState` 函数中添加状态：
   ```typescript
   const [title, setTitle] = useState<string>("未命名面板");
   ```

3. 添加 useEffect，当 panelData 变化时同步标题：
   ```typescript
   useEffect(() => {
     if (panelData?.title) {
       setTitle(panelData.title);
     }
   }, [panelData]);
   ```

4. 添加标题变更处理函数：
   ```typescript
   const handleTitleChange = useCallback((newTitle: string) => {
     setTitle(newTitle);
   }, []);
   ```

5. 在 return 中添加新状态和函数：
   ```typescript
   return {
     // ... 现有返回值
     title,
     handleTitleChange,
   };
   ```

### 步骤5：修改 usePanelActions hook
**文件路径**：`d:\Program\projects\seedar\apps\web-client\src\modules\panel\hooks\usePanelActions.ts`

**修改内容**：
1. 在 `UsePanelActionsParams` 接口中添加：
   - `title: string` - 当前标题

2. 在 `handleSave` 函数中，调用 `updatePanel` 时添加 `title` 字段：
   ```typescript
   updatePanel(
     {
       id: panelId,
       data: {
         title,
         type: panelType as any,
         config,
       },
     },
     // ...
   );
   ```

3. 在 `handleSaveAs` 函数中，使用当前标题：
   ```typescript
   createPanel(
     {
       title: title || "未命名面板",
       queryId: data.id,
       type: panelType as PanelType,
       config,
     },
     // ...
   );
   ```

### 步骤6：在 panelPage.tsx 中集成 EditableTitle 组件
**文件路径**：`d:\Program\projects\seedar\apps\web-client\src\modules\panel\pages\panelPage.tsx`

**修改内容**：
1. 导入 EditableTitle 组件：
   ```typescript
   import { EditableTitle } from "../components/editableTitle";
   ```

2. 从 `usePanelEditorState` 中解构获取新状态：
   ```typescript
   const {
     // ... 现有解构
     title,
     handleTitleChange,
   } = usePanelEditorState(panelId);
   ```

3. 将 `title` 传递给 `usePanelActions`：
   ```typescript
   const { handleSave, handleSaveAs } = usePanelActions({
     // ... 现有参数
     title,
   });
   ```

4. 在第80行（标题区域）添加 EditableTitle 组件：
   ```typescript
   <header className={styles.mainHeader}>
     <div className={styles.titleArea}>
       <EditableTitle
         title={title}
         onTitleChange={handleTitleChange}
       />
     </div>
     <QueryZone
       // ... 现有 props
     />
   </header>
   ```

### 步骤7：添加标题区域样式
**文件路径**：`d:\Program\projects\seedar\apps\web-client\src\modules\panel\pages\styles\panel.module.scss`

**修改内容**：
在 `.mainHeader` 样式中添加：
```scss
.mainHeader {
  position: relative;
  height: var(--mainHeaderHeight);
  background: #f5f5f5;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .titleArea {
    display: flex;
    align-items: center;
    padding: 0 8px;
  }
}
```

## 技术要点

### 状态管理
- 使用 React useState 管理编辑状态和编辑值
- 使用 useCallback 优化回调函数性能
- 使用 useEffect 同步 panelData.title 到本地状态

### 交互设计
- 内联编辑，用户体验流畅
- 支持键盘快捷键（Enter 确认，Esc 取消）
- 失去焦点自动保存，符合用户习惯
- 悬停显示编辑图标，减少视觉干扰

### 数据流
1. 用户编辑标题 → 更新本地 title 状态
2. 用户点击保存 → 将 title 传递给 usePanelActions
3. usePanelActions 调用 updatePanel API → 保存到后端
4. 保存成功后，panelData 更新 → useEffect 同步到本地状态

### 样式一致性
- 与现有 QueryZone 组件风格保持一致
- 使用相同的颜色方案和交互效果
- 响应式设计，适配不同屏幕尺寸

## 验证要点

### 功能验证
- [ ] 默认显示"未命名面板"
- [ ] 点击编辑图标进入编辑模式
- [ ] 输入框显示当前标题
- [ ] 点击确认图标保存标题
- [ ] 点击取消图标恢复原标题
- [ ] 按 Enter 保存标题
- [ ] 按 Esc 取消编辑
- [ ] 失去焦点自动保存
- [ ] 点击保存按钮时标题一起保存到后端

### 样式验证
- [ ] 标题样式与设计一致
- [ ] 编辑图标悬停时显示
- [ ] 编辑状态下输入框样式正确
- [ ] 操作图标悬停效果正常
- [ ] 整体布局协调

### 边界情况
- [ ] 空标题处理
- [ ] 长标题显示
- [ ] 特殊字符处理
- [ ] 快速连续编辑

## 预期效果
用户可以在面板编辑页面方便地编辑标题，编辑体验流畅，标题会在点击保存按钮时正确保存到后端。
