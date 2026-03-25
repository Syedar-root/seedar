# ScrollArea 组件实现计划

## 目标
在 `apps\web-client\src\core\components\ui\ScrollArea\` 创建基于 Base UI 的可复用滚动区域组件，并在 panelEditor 中使用。

## 实现步骤

### 1. 创建 ScrollArea 组件目录结构
- `src/core/components/ui/ScrollArea/index.ts`
- `src/core/components/ui/ScrollArea/ScrollArea.tsx`
- `src/core/components/ui/ScrollArea/ScrollArea.module.scss`

### 2. 实现 ScrollArea 组件
- 使用 `@base-ui/react/scroll-area` 作为基础
- 创建 `ScrollArea.tsx` 组件文件
- 创建 `ScrollArea.module.scss` 样式文件，使用主题变量：
  - scrollbar 宽度、颜色
  - thumb 圆角、背景色
  - 滚动条 hover 效果
- 创建 `index.ts` 导出文件

### 3. 在 panelEditor 中使用
- 修改 `panelEditor.tsx` 导入并使用 ScrollArea 组件
- 更新 `panelEditor.module.scss` 移除 `overflow-y: auto`

## 文件内容预览

### ScrollArea.tsx
```tsx
import * as React from "@base-ui/react/scroll-area";
import styles from "./ScrollArea.module.scss";
import clsx from "clsx";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  style,
}) => {
  return (
    <React.ScrollArea.Root className={clsx(styles.root, className)} style={style}>
      <React.ScrollArea.Viewport className={styles.viewport}>
        <React.ScrollArea.Content className={styles.content}>
          {children}
        </React.ScrollArea.Content>
      </React.ScrollArea.Viewport>
      <React.ScrollArea.Scrollbar
        className={styles.scrollbar}
        orientation="vertical"
      >
        <React.ScrollArea.Thumb className={styles.thumb} />
      </React.ScrollArea.Scrollbar>
      <React.ScrollArea.Corner className={styles.corner} />
    </React.ScrollArea.Root>
  );
};
```

### ScrollArea.module.scss (使用主题变量)
```scss
.root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.viewport {
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.content {
  min-width: 100%;
  min-height: 100%;
}

.scrollbar {
  display: flex;
  user-select: none;
  touch-action: none;
  padding: 2px;
  background: transparent;
  transition: background-color var(--transition-fast);
  
  &[data-orientation="vertical"] {
    width: var(--spacing-sm);
  }
  
  &:hover {
    background: var(--bg-hover);
  }
}

.thumb {
  flex: 1;
  background: var(--border-base);
  border-radius: var(--radius-lg);
  position: relative;
  
  &:hover {
    background: var(--border-hover);
  }
  
  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    min-width: 44px;
    min-height: 44px;
  }
}

.corner {
  background: transparent;
}
```

### panelEditor.tsx 修改
- 导入: `import { ScrollArea } from "@/core/components/ui/ScrollArea";`
- 将外层 `div` 替换为 `ScrollArea`

### panelEditor.module.scss 修改
- 移除 `overflow-y: auto;`
