# Title 组件重构与扩展实施计划

## 📋 任务概述

基于 Impeccable 技能包的设计原则，重构 title 组件架构，新增 editorial 和 brutalist 两种风格，并建立可扩展的组件体系。

## 🎯 目标

1. 重构 title 组件为策略模式架构
2. 新增 editorial（编辑/杂志风格）和 brutalist（粗野主义风格）两种类型
3. 提取可复用的 Tooltip 逻辑为 Hook
4. 建立清晰的类型系统
5. 保持向后兼容，不影响现有使用

## 📐 架构设计

### 当前架构问题
- 使用 if-else 链式判断类型，扩展性差
- Tooltip 逻辑在每个类型中重复
- 类型定义不够清晰，缺少分层

### 目标架构
```
title/
├── index.ts                    # 统一导出（类型 + 组件）
├── title.tsx                   # 主组件（策略模式路由）
└── title.module.css            # 样式文件（新增 editorial/brutalist 样式）
```

### 核心设计原则（基于 Impeccable extract 子技能）
1. **Clear props API** - 分层类型定义（BaseTitleProps + 具体类型 Props）
2. **Proper variants** - 策略模式实现类型映射
3. **Extract patterns** - Hook 复用 Tooltip 逻辑
4. **Type safety** - 完整的类型导出

## 🔧 实施步骤

### 步骤 1：扩展类型定义
**文件**: `title.tsx`

**操作**:
- 定义 `TitleType` 类型（plain | flag | editorial | brutalist）
- 创建 `BaseTitleProps` 基础接口
- 创建各类型的 Props 接口：
  - `PlainTitleProps` - 继承 BaseTitleProps
  - `FlagTitleProps` - 继承 BaseTitleProps + flagColor
  - `EditorialTitleProps` - 继承 BaseTitleProps + subtitle + accentText
  - `BrutalistTitleProps` - 继承 BaseTitleProps + flagColor + subtitle
- 更新 `TitleProps` 继承 BaseTitleProps 并包含所有可选属性

**验证**: TypeScript 编译通过，无类型错误

---

### 步骤 2：提取 Tooltip 逻辑为 Hook
**文件**: `title.tsx`

**操作**:
- 创建 `useTitleTooltip` 函数
- 参数: `content`, `enableTooltip`, `maxTitleWidth`, `children`
- 返回: 包裹 Tooltip 的 ReactNode 或原始 children
- 逻辑:
  - 如果 `enableTooltip` 为 false 或 `content` 为空，直接返回 children
  - 否则返回 Tooltip.Provider 包裹的结构

**验证**: Hook 可被所有类型组件复用

---

### 步骤 3：实现独立的类型组件
**文件**: `title.tsx`

**操作**:

#### 3.1 PlainTitle 组件
- 接收 `PlainTitleProps`
- 返回 `<h3 className={styles.plain}>{content}</h3>`

#### 3.2 FlagTitle 组件（重构现有逻辑）
- 接收 `FlagTitleProps`
- 默认值: `flagColor = "#008ffa"`, `maxTitleWidth = "100%"`
- 返回现有的 flag 结构（保留原有样式）

#### 3.3 EditorialTitle 组件（新增）
- 接收 `EditorialTitleProps`
- 默认值: `maxTitleWidth = "100%"`
- 结构:
  ```tsx
  <div className={styles.editorialContainer}>
    {accentText && <span className={styles.editorialAccent}>{accentText}</span>}
    <h2 className={styles.editorialTitle}>{content}</h2>
    {subtitle && <p className={styles.editorialSubtitle}>{subtitle}</p>}
  </div>
  ```

#### 3.4 BrutalistTitle 组件（新增）
- 接收 `BrutalistTitleProps`
- 默认值: `flagColor = "#008ffa"`, `maxTitleWidth = "100%"`
- 结构:
  ```tsx
  <div className={styles.brutalistContainer}>
    <div className={styles.brutalistHeader}>
      <span className={styles.brutalistNumber} />
      <h3 className={styles.brutalistTitle}>{content}</h3>
    </div>
    {subtitle && <p className={styles.brutalistSubtitle}>{subtitle}</p>}
  </div>
  ```

**验证**: 每个组件独立工作正常

---

### 步骤 4：实现策略模式映射
**文件**: `title.tsx`

**操作**:
- 创建 `titleRenderers` 映射表:
  ```typescript
  const titleRenderers: Record<TitleType, (props: any) => React.ReactElement> = {
    plain: PlainTitle,
    flag: FlagTitle,
    editorial: EditorialTitle,
    brutalist: BrutalistTitle,
  };
  ```

**验证**: 映射表覆盖所有 TitleType

---

### 步骤 5：重构主组件
**文件**: `title.tsx`

**操作**:
- 重构 `Title` 组件:
  ```typescript
  export const Title: React.FC<TitleProps> = ({
    content,
    type = "flag",
    enableTooltip = true,
    maxTitleWidth = "100%",
    ...props
  }) => {
    const TitleComponent = titleRenderers[type];
    const titleElement = (
      <TitleComponent
        content={content}
        maxTitleWidth={maxTitleWidth}
        {...props}
      />
    );

    return useTitleTooltip(content, enableTooltip, maxTitleWidth, titleElement);
  };
  ```

**验证**: 
- 保持向后兼容（默认 type="flag"）
- 所有现有使用不受影响

---

### 步骤 6：添加新样式
**文件**: `title.module.css`

**操作**:

#### 6.1 Editorial 样式
```css
.editorialContainer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: var(--max-title-width);
  padding-block: 4px;
}

.editorialAccent {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6b7280;
  font-family: "SF Mono", "Fira Code", monospace;
}

.editorialTitle {
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 300;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0;
  font-family: "Playfair Display", "Crimson Pro", Georgia, serif;
}

.editorialSubtitle {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: #64748b;
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
```

#### 6.2 Brutalist 样式
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
}

.brutalistHeader {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.brutalistNumber {
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
  color: var(--accent-color);
  font-family: "Space Grotesk", "JetBrains Mono", monospace;
  opacity: 0.3;
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
}

.brutalistSubtitle {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: #404040;
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  text-transform: none;
  letter-spacing: 0;
}
```

**验证**: 样式符合 Impeccable 设计原则
- 使用 `clamp()` 实现流体字号
- 避免常用字体（Inter, Roboto）
- 避免圆角卡片 + 单侧粗边框的 AI 模式

---

### 步骤 7：更新导出文件
**文件**: `index.ts`

**操作**:
```typescript
export {
  Title,
  type TitleType,
  type TitleProps,
  type BaseTitleProps,
  type PlainTitleProps,
  type FlagTitleProps,
  type EditorialTitleProps,
  type BrutalistTitleProps,
} from './title';
```

**验证**: 外部可正确导入所有类型和组件

---

### 步骤 8：类型检查与测试
**操作**:
- 运行 TypeScript 编译检查
- 验证现有使用不受影响
- 测试新增类型的渲染效果

**验证命令**:
```bash
npm run typecheck
# 或
npm run build
```

---

## ✅ 验收标准

1. **功能完整性**
   - [ ] 现有 plain 和 flag 类型正常工作
   - [ ] editorial 类型正确渲染（accent + title + subtitle）
   - [ ] brutalist 类型正确渲染（number + title + subtitle）
   - [ ] Tooltip 功能对所有类型生效

2. **类型安全**
   - [ ] TypeScript 编译无错误
   - [ ] 所有类型正确导出
   - [ ] Props 类型检查完整

3. **向后兼容**
   - [ ] 现有代码无需修改即可运行
   - [ ] 默认行为保持不变（type="flag"）

4. **设计质量**
   - [ ] 遵循 Impeccable 设计原则
   - [ ] 避免 AI 同质化模式
   - [ ] 字体选择独特（衬线字体 + 等宽字体）
   - [ ] 使用流体字号（clamp）

5. **代码质量**
   - [ ] 无重复代码
   - [ ] Hook 逻辑复用
   - [ ] 策略模式清晰
   - [ ] 注释适当

---

## 📝 使用示例

```tsx
// 基础使用（向后兼容）
<Title content="数据概览" />

// Flag 类型
<Title type="flag" content="数据概览" flagColor="#3b82f6" />

// Editorial 类型
<Title 
  type="editorial" 
  content="季度报告" 
  accentText="Q4 2024"
  subtitle="核心业务指标分析"
/>

// Brutalist 类型
<Title 
  type="brutalist" 
  content="系统监控" 
  flagColor="#ef4444"
  subtitle="实时性能追踪"
/>
```

---

## 🚀 后续扩展建议

当需要新增类型时：
1. 定义新的 Props 类型（如 `MinimalTitleProps`）
2. 实现对应的组件（如 `MinimalTitle`）
3. 添加到 `titleRenderers` 映射表
4. 添加对应的 CSS 样式
5. 更新 `TitleType` 类型定义

---

## 📚 参考文档

- Impeccable `frontend-design` 子技能：设计原则和反模式
- Impeccable `extract` 子技能：组件提取和设计系统构建
