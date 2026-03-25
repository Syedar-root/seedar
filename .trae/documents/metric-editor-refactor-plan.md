# 指标编辑器重构计划

## 目标
将现有的分步式指标配置界面重构为统一的公式编辑器，参考 Excel 公式输入体验，支持：
1. 直接输入表达式（如 `SUM(amount) * price`）
2. 通过智能提示插入字段/指标/函数
3. KaTeX 公式预览
4. 内部转换为 `#Fxxx` / `#Mxxx` 格式提交后端

---

## 实现步骤

### 步骤 1: 安装依赖

```bash
cd d:\Program\projects\seedar\apps\web-client
npm install cmdk katex @types/katex
```

### 步骤 2: 创建公式解析 Hook

**文件**: `apps/web-client/src/modules/panel/components/metricEditor/useFormulaParser.ts`

功能：
- `toDisplay` - 将 `#F92` 转换为 `amount`（显示用）
- `toStorage` - 将 `amount` 转换为 `#F92`（提交用）
- `extractReferences` - 提取表达式中的字段/指标引用

### 步骤 3: 创建智能提示组件

**文件**: `apps/web-client/src/modules/panel/components/metricEditor/FormulaSuggestion.tsx`

使用 cmdk 实现：
- 输入 `#F` 弹出字段列表
- 输入 `#M` 弹出指标列表  
- 输入函数名开头（如 `SU`）弹出函数列表
- 支持键盘上下导航和回车选中
- 点击列表项插入到光标位置

### 步骤 4: 创建公式编辑器组件

**文件**: `apps/web-client/src/modules/panel/components/metricEditor/FormulaEditor.tsx`

功能：
- 可编辑的公式输入框
- 左侧/下方显示可用字段列表、指标列表、函数列表
- 点击列表项插入表达式
- KaTeX 实时预览

### 步骤 5: 重构主对话框

**文件**: `apps/web-client/src/modules/panel/components/metricEditor/metricEditorDialog.tsx`

修改：
- 移除指标类型选择（统一为公式输入）
- 移除原有的分步配置 UI
- 整合新的 FormulaEditor 组件
- 简化提交数据结构为 `{ name, businessName, description, expression }`

### 步骤 6: 更新样式

**文件**: `apps/web-client/src/modules/panel/components/metricEditor/metricEditorDialog.module.scss`

添加：
- 公式输入框样式
- 智能提示列表样式（cmdk 样式覆盖）
- KaTeX 预览区域样式

---

## UI 结构预览

```
┌─────────────────────────────────────────────────────────┐
│  创建指标                                              │
├─────────────────────────────────────────────────────────┤
│  指标名称: [____________________]                      │
│  业务名称: [____________________]                      │
│  描述:     [____________________]                      │
├─────────────────────────────────────────────────────────┤
│  公式编辑                                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  SUM(amount) * price                              │  │
│  │                              [KaTeX 预览]          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  可用函数    │  可用字段              │  可用指标       │
│  ┌────────┐ │  ┌─────────────────┐   │  ┌──────────┐   │
│  │ SUM    │ │  │ 💰 amount (F92) │   │  │ 📊 total │   │
│  │ COUNT  │ │  │ 💰 price (F100) │   │  │ 📊 cost  │   │
│  │ AVG    │ │  │ 💰 qty  (F101)  │   │  └──────────┘   │
│  │ MAX    │ │  └─────────────────┘   │                 │
│  │ MIN    │ │      [点击插入]        │  [点击插入]    │
│  └────────┘ │                        │                 │
├─────────────────────────────────────────────────────────┤
│  [取消]                              [创建]             │
└─────────────────────────────────────────────────────────┘
```

---

## 数据转换

| 场景 | 用户输入 | 存储格式 |
|------|----------|----------|
| 字段 | `amount` | `#F92` |
| 指标 | `revenue` | `#M100` |
| 函数 | `SUM` | `SUM` |
| 组合 | `SUM(amount) * revenue` | `SUM(#F92) * #M100` |

---

## 验收标准

1. ✅ 用户可以直接输入公式表达式
2. ✅ 输入 `#F` 弹出字段列表，选中后插入 `#Fxx`
3. ✅ 输入 `#M` 弹出指标列表，选中后插入 `#Mxx`  
4. ✅ 点击侧边字段/指标/函数列表可插入表达式
5. ✅ KaTeX 实时预览公式外观
6. ✅ 提交时自动转换为 `#Fxx/#Mxx` 格式
7. ✅ 表单验证（名称必填、表达式合法）
