# Dashboard 模块文件命名重构计划

## 目标
将 Dashboard 模块的 DTO 文件命名调整为与 datasource/query 模块一致的风格。

## 调整内容
只重命名 DTO 文件，保持 services 和 controller 的现有结构。

## 重构步骤

### Step 1: 重命名 DTO 文件
- [x] 将 `dto/create-dashboard.dto.ts` 重命名为 `dto/create-dashboard.request.ts`
- [x] 将 `dto/update-dashboard.dto.ts` 重命名为 `dto/update-dashboard.request.ts`
- [x] 将 `dto/create-panel.dto.ts` 重命名为 `dto/create-panel.request.ts`
- [x] 将 `dto/update-panel.dto.ts` 重命名为 `dto/update-panel.request.ts`
- [x] 将 `dto/dashboard.response.ts` 重命名为 `dto/dashboard.response.ts`（保持不变）
- [x] 将 `dto/panel.response.ts` 重命名为 `dto/panel.response.ts`（保持不变）

### Step 2: 更新导入路径
- [x] 更新 `dashboard.controller.ts` 中的 DTO 导入路径
- [x] 更新 `panel.controller.ts` 中的 DTO 导入路径
- [x] 更新 `services/dashboard.service.ts` 中的 DTO 导入路径
- [x] 更新 `services/panel.service.ts` 中的 DTO 导入路径

### Step 3: 删除旧的 DTO 文件
- [x] 删除旧的 `.dto.ts` 文件

### Step 4: 删除重复文件
- [x] 删除根目录下的 `dashboard.service.ts`（重复文件）

## 保持不变
- `services/` 目录保持不变（包含 dashboard.service.ts 和 panel.service.ts）
- `dashboard.controller.ts` 和 `panel.controller.ts` 保持独立文件
- 其他文件结构保持不变

## 最终文件结构
```
dashboard/
├── entities/
│   ├── dashboard.entity.ts
│   ├── dashboard-panel.entity.ts
│   └── dashboard-panel-relation.entity.ts
├── dto/
│   ├── create-dashboard.request.ts
│   ├── update-dashboard.request.ts
│   ├── dashboard.response.ts
│   ├── create-panel.request.ts
│   ├── update-panel.request.ts
│   └── panel.response.ts
├── services/
│   ├── dashboard.service.ts
│   └── panel.service.ts
├── dashboard.controller.ts
├── panel.controller.ts
├── dashboard.module.ts
└── panel-type.enum.ts
```

## 构建验证
- [x] 构建成功，无错误
