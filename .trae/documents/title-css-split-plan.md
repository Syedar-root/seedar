# Title 组件 CSS 拆分实施计划

## 📋 任务概述

将 `title.module.css` 中的样式拆分到各个独立的组件 CSS 模块文件中，提高代码的可维护性和清晰度。

## 🎯 核心目标

- 每个 Title 组件拥有独立的 CSS 模块文件
- 保持样式隔离，避免样式冲突
- 提高代码可维护性
- 遵循项目现有的组件结构

## 📁 涉及文件

### 需要创建的文件
1. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/PlainTitle.module.css`
2. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/FlagTitle.module.css`
3. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/EditorialTitle.module.css`
4. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/BrutalistTitle.module.css`
5. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/Tooltip.module.css`（可选，用于 tooltip 样式）

### 需要修改的文件
6. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/PlainTitle.tsx`
7. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/FlagTitle.tsx`
8. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/EditorialTitle.tsx`
9. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/BrutalistTitle.tsx`
10. `packages/ui-react/src/components/gridContainer/seedar/components/title/components/useTitleTooltip.tsx`（如果使用 tooltip）
11. `packages/ui-react/src/components/gridContainer/seedar/components/title/title.module.css`（删除或保留通用样式）

## 🔧 实施步骤

### 步骤 1：创建 PlainTitle.module.css

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/PlainTitle.module.css`

**内容**:
```css
.plain {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**说明**: 从 `title.module.css` 中提取 `.plain` 样式

---

### 步骤 2：创建 FlagTitle.module.css

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/FlagTitle.module.css`

**内容**:
```css
.flagContainer {
  height: 100%;
  min-height: 32px;
  padding-inline: 8px;
  display: flex;
  align-items: center;
  background-color: color-mix(in srgb, var(--flag-color), transparent 88%);
  max-width: var(--max-title-width);
  border-left: 8px solid var(--flag-color);
}

.flagContent {
  height: 100%;
  padding-block: 4px;
  margin-inline: 4px;
  line-height: 1.5;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  text-align: left;
}
```

**说明**: 从 `title.module.css` 中提取 `.flagContainer` 和 `.flagContent` 样式

---

### 步骤 3：创建 EditorialTitle.module.css

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/EditorialTitle.module.css`

**内容**:
```css
.editorialContainer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: var(--max-title-width);
  padding-block: 4px;
  overflow: hidden;
}

.editorialAccent {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6b7280;
  font-family: "SF Mono", "Fira Code", monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editorialTitle {
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 300;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0;
  font-family: "Playfair Display", "Crimson Pro", Georgia, serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.editorialSubtitle {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: #64748b;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**说明**: 从 `title.module.css` 中提取 `.editorialContainer`、`.editorialAccent`、`.editorialTitle` 和 `.editorialSubtitle` 样式

---

### 步骤 4：创建 BrutalistTitle.module.css

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/BrutalistTitle.module.css`

**内容**:
```css
.brutalistContainer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: var(--max-title-width);
  border-left: 3px solid var(--accent-color);
  padding-left: 16px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.02) 0%, transparent 100%);
  counter-increment: brutalist-counter;
  overflow: hidden;
}

.brutalistHeader {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
}

.brutalistNumber {
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
  color: var(--accent-color);
  font-family: "Space Grotesk", "JetBrains Mono", monospace;
  opacity: 0.3;
  flex-shrink: 0;
}

.brutalistNumber::before {
  content: counter(brutalist-counter);
  counter-increment: brutalist-counter;
}

.brutalistTitle {
  font-size: clamp(20px, 3vw, 26px);
  font-weight: 700;
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0a0a0a;
  margin: 0;
  font-family: "Space Grotesk", "Inter Tight", system-ui, sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.brutalistSubtitle {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: #404040;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
  text-transform: none;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**说明**: 从 `title.module.css` 中提取 `.brutalistContainer`、`.brutalistHeader`、`.brutalistNumber`、`.brutalistTitle` 和 `.brutalistSubtitle` 样式

---

### 步骤 5：创建 Tooltip.module.css（可选）

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/Tooltip.module.css`

**内容**:
```css
.tooltip {
  background-color: #1a1a1a;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

**说明**: 从 `title.module.css` 中提取 `.tooltip` 样式，如果 `useTitleTooltip.tsx` 使用了 tooltip 样式

---

### 步骤 6：更新 PlainTitle.tsx

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/PlainTitle.tsx`

**修改内容**:
```typescript
import React from "react";
import { PlainTitleProps } from "../types";
import styles from "./PlainTitle.module.css";  // 修改导入路径

export const PlainTitle: React.FC<PlainTitleProps> = ({ content }) => {
  return <h3 className={styles.plain}>{content}</h3>;
};
```

**说明**: 将 CSS 导入从 `../title.module.css` 改为 `./PlainTitle.module.css`

---

### 步骤 7：更新 FlagTitle.tsx

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/FlagTitle.tsx`

**修改内容**:
```typescript
import React from "react";
import { FlagTitleProps } from "../types";
import styles from "./FlagTitle.module.css";  // 修改导入路径

export const FlagTitle: React.FC<FlagTitleProps> = ({
  content,
  flagColor = "#008ffa",
  maxTitleWidth = "100%",
}) => {
  return (
    <div
      className={styles.flagContainer}
      style={
        {
          "--flag-color": flagColor,
          "--max-title-width": maxTitleWidth,
        } as React.CSSProperties
      }
    >
      <div className={styles.flagContent}>{content}</div>
    </div>
  );
};
```

**说明**: 将 CSS 导入从 `../title.module.css` 改为 `./FlagTitle.module.css`，移除注释掉的 `.flagMarker` div

---

### 步骤 8：更新 EditorialTitle.tsx

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/EditorialTitle.tsx`

**修改内容**:
```typescript
import React from "react";
import { EditorialTitleProps } from "../types";
import styles from "./EditorialTitle.module.css";  // 修改导入路径

export const EditorialTitle: React.FC<EditorialTitleProps> = ({
  content,
  subtitle,
  accentText,
  maxTitleWidth = "100%",
}) => {
  return (
    <div
      className={styles.editorialContainer}
      style={{ "--max-title-width": maxTitleWidth } as React.CSSProperties}
    >
      {accentText && <span className={styles.editorialAccent}>{accentText}</span>}
      <h2 className={styles.editorialTitle}>{content}</h2>
      {subtitle && <p className={styles.editorialSubtitle}>{subtitle}</p>}
    </div>
  );
};
```

**说明**: 将 CSS 导入从 `../title.module.css` 改为 `./EditorialTitle.module.css`

---

### 步骤 9：更新 BrutalistTitle.tsx

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/BrutalistTitle.tsx`

**修改内容**:
```typescript
import React from "react";
import { BrutalistTitleProps } from "../types";
import styles from "./BrutalistTitle.module.css";  // 修改导入路径

export const BrutalistTitle: React.FC<BrutalistTitleProps> = ({
  content,
  flagColor = "#008ffa",
  subtitle,
  maxTitleWidth = "100%",
}) => {
  return (
    <div
      className={styles.brutalistContainer}
      style={
        {
          "--max-title-width": maxTitleWidth,
          "--accent-color": flagColor,
        } as React.CSSProperties
      }
    >
      <div className={styles.brutalistHeader}>
        <span className={styles.brutalistNumber} />
        <h3 className={styles.brutalistTitle}>{content}</h3>
      </div>
      {subtitle && <p className={styles.brutalistSubtitle}>{subtitle}</p>}
    </div>
  );
};
```

**说明**: 将 CSS 导入从 `../title.module.css` 改为 `./BrutalistTitle.module.css`

---

### 步骤 10：更新 useTitleTooltip.tsx（如果存在）

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/hooks/useTitleTooltip.tsx`

**修改内容**:
```typescript
import { Tooltip } from "@base-ui/react/tooltip";
import styles from "../components/Tooltip.module.css";  // 修改导入路径

// ... 其他代码保持不变
```

**说明**: 如果该文件使用了 tooltip 样式，将导入路径改为新的 Tooltip.module.css

---

### 步骤 11：处理 title.module.css

**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/title.module.css`

**选项 1：删除文件**
- 如果所有样式都已拆分到各个组件，可以删除此文件
- 需要更新 `title.tsx` 中可能的导入

**选项 2：保留通用样式**
- 如果有其他地方使用了此文件，可以只保留通用样式（如 `.tooltip`）
- 或者创建一个 `index.css` 用于导出所有样式

**建议**: 先检查是否有其他地方引用了 `title.module.css`，如果没有，可以直接删除

---

## ✅ 验收标准

### 功能完整性
- ✅ 所有组件都使用自己的 CSS 模块文件
- ✅ 样式正确应用到各个组件
- ✅ CSS 变量（如 `--flag-color`、`--max-title-width`）正常工作
- ✅ 组件外观与拆分前保持一致

### 代码质量
- ✅ CSS 模块化，每个组件独立管理样式
- ✅ 导入路径正确
- ✅ 无样式冲突
- ✅ 代码风格与项目保持一致

### 可维护性
- ✅ 修改某个组件样式时只需修改对应的 CSS 文件
- ✅ 新增组件时可以参考现有结构
- ✅ 样式和组件代码在同一目录下，便于查找

---

## 📝 注意事项

1. **CSS 变量**: 确保 CSS 变量（如 `--flag-color`、`--max-title-width`）通过内联样式正确传递
2. **样式隔离**: CSS 模块会自动处理样式隔离，不需要担心类名冲突
3. **字体引用**: 保持原有的字体栈不变，确保视觉一致性
4. **响应式设计**: 保留原有的 `clamp()` 和 `vw` 单位，确保响应式效果
5. **文本截断**: 保留 `white-space: nowrap`、`overflow: hidden`、`text-overflow: ellipsis`，确保长文本正确截断
6. **计数器**: BrutalistTitle 的 `counter-increment` 和 `content: counter()` 保留，确保编号正常工作

---

## 🚀 后续优化建议

1. **CSS 变量统一**: 考虑将颜色、字体等通用变量提取到全局 CSS 变量中
2. **样式主题化**: 如果需要支持多主题，可以考虑使用 CSS 变量实现主题切换
3. **样式压缩**: 在构建时对 CSS 进行压缩，减少文件大小
4. **样式文档**: 为每个 CSS 模块添加注释，说明样式的作用和设计意图
