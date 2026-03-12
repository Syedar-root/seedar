# 将 @seedar/ui-core 改为源码引用模式

## 目标
将 `@seedar/ui-core` 包修改为像 shadcn 一样直接使用源代码，无需构建步骤。

## 修改内容

### 1. 修改 package.json
**文件路径**: `d:\projects\seedar\packages\ui-core\package.json`

#### 1.1 移除构建相关字段
删除以下字段：
- `"main": "dist/index.js"`
- `"module": "dist/index.mjs"`
- `"types": "dist/index.d.ts"`

#### 1.2 修改 exports 字段
将所有路径从 `./dist/` 改为 `./src/`：

**修改前**:
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.js"
  }
}
```

**修改后**:
```json
"exports": {
  ".": {
    "types": "./src/index.ts",
    "import": "./src/index.ts",
    "require": "./src/index.ts"
  }
}
```

#### 1.3 简化 scripts 字段
移除不需要的构建脚本：

**修改前**:
```json
"scripts": {
  "build": "tsc",
  "type-check": "tsc --noEmit",
  "clean": "rimraf dist"
}
```

**修改后**:
```json
"scripts": {
  "type-check": "tsc --noEmit"
}
```

### 2. 验证修改
运行开发服务器，确认 Vite 能够正确解析 `@seedar/ui-core` 包：

```bash
cd d:\projects\seedar
pnpm dev
```

### 3. 可选清理（如果之前构建过）
如果 `dist` 目录存在，可以删除它：

```bash
pnpm --filter @seedar/ui-core clean
```

或者手动删除：
```bash
Remove-Item -Recurse -Force d:\projects\seedar\packages\ui-core\dist
```

## 预期结果

修改完成后：
- ✅ 无需运行 `pnpm build` 即可启动开发服务器
- ✅ Vite 能够直接解析 `@seedar/ui-core` 的 TypeScript 源代码
- ✅ 开发体验与 shadcn 一致
- ✅ 类型检查仍然可用（通过 `type-check` 脚本）

## 注意事项

1. **导入扩展名**: 由于 package.json 中设置了 `"type": "module"`，源代码中的导入必须使用 `.js` 扩展名（当前代码已正确使用）
2. **TypeScript 支持**: Vite 会自动处理 TypeScript 文件，无需预编译
3. **类型定义**: 直接引用 `.ts` 文件，Vite 会自动处理类型信息

## 回滚方案

如果需要回滚到构建模式，可以恢复原始的 package.json 配置并运行 `pnpm build`。
