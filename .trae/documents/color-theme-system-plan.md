# 颜色主题系统实现计划

## 目标
将 `panelEditor` 的配色方案抽离为可复用的颜色主题系统，支持运行时切换主题。

## 实现步骤

### 1. 创建主题变量文件
**文件**: `d:\Program\projects\seedar\apps\web-client\src\core\assets\styles\global.variable.scss`

**内容结构**:
- 定义 mixin `output-css-vars` 用于循环输出 CSS 变量
- 定义各分类变量 map：
  - `$cv-primary` - 主色系
  - `$cv-text` - 文字色
  - `$cv-bg` - 背景色
  - `$cv-border` - 边框色
  - `$cv-semantic` - 功能色
  - `$cv-accent` - 辅助色
  - `$cv-shadow` - 阴影
  - `$cv-radius` - 圆角
  - `$cv-spacing` - 间距
  - `$cv-font` - 字体
  - `$cv-transition` - 过渡
- 使用 mixin 输出 `:root` CSS 变量

### 2. 创建主题目录结构
**目录**: `d:\Program\projects\seedar\apps\web-client\src\core\assets\styles\themes\`

**文件**:
- `_modern-blue.scss` - 现代蓝色主题（panelEditor 现有配色）

### 3. 配置构建输出
确保主题文件可独立打包，支持懒加载。

## 文件清单
| 文件路径 | 操作 |
|---------|------|
| `src/core/assets/styles/global.variable.scss` | 创建 |
| `src/core/assets/styles/themes/_modern-blue.scss` | 创建 |
