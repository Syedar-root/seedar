# 计划：使用 Base UI Popover 替换 FormulaSuggestion 中的 cmdk

## 目标
将 `FormulaSuggestion.tsx` 中的 cmdk 替换为 Base UI 的 Popover 组件，减少依赖并利用其定位功能。

## 实施步骤

### 1. 修改 FormulaSuggestion.tsx

#### 1.1 导入更改
- 移除 `Command` 导入 (cmdk)
- 添加 `Popover` 导入 (`@base-ui/react/popover`)
- 保留其他必要的导入

#### 1.2 创建 Popover Handle
- 使用 `Popover.createHandle()` 创建一个 handle 用于控制 popover

#### 1.3 组件结构调整
- 使用 `Popover.Root` 作为根组件，使用 controlled mode (`open={visible}`, `onOpenChange={onVisibleChange}`)
- 不需要 `Popover.Trigger`（因为是根据文本输入自动显示）
- 使用 `Popover.Portal` 包裹弹出内容
- 使用 `Popover.Positioner` 替代手动位置计算，设置 `anchor` 指向输入框
- 使用 `Popover.Popup` 作为弹出内容容器
- 内部使用 `<ul>` 和 `<li>` 替代 `<Command.List>` 和 `<Command.Item>`

#### 1.4 移除手动定位逻辑
- 移除 `position` state
- 移除 `updatePosition` 函数
- 移除相关的 useEffect（scroll/resize 监听）
- `Popover.Positioner` 会自动处理定位

#### 1.5 保留键盘导航逻辑
- 保留 ArrowUp/ArrowDown/Enter/Escape 的键盘处理
- 移除 console.log 调试语句

### 2. 调整样式（如需要）
- 保留原有样式，Popover 组件会渲染 div，不需要大幅度修改

### 3. 验证
- 确认建议列表在输入框下方正确显示
- 确认键盘导航正常
- 确认点击外部可以关闭
