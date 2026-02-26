# 查询结果格式化错误修复计划

## 任务分解与优先级

### [ ] 任务 1: 检查并修复类型定义问题
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 检查 KnexSQLGenerator 类的类型定义
  - 确保 generateSQLWithBindings 方法的返回类型包含 columnMappings 字段
  - 检查 @metric-engine/core 包的类型导出
- **成功标准**:
  - 类型错误消失，编译通过
- **测试要求**:
  - `programmatic` TR-1.1: 运行 TypeScript 编译，验证无类型错误

### [ ] 任务 2: 验证修复效果
- **优先级**: P0
- **依赖**: 任务 1
- **描述**:
  - 运行构建命令，验证所有类型错误已修复
  - 确保代码能够正常编译
- **成功标准**:
  - 构建成功，无错误
- **测试要求**:
  - `programmatic` TR-2.1: 运行 npm run build 或类似命令，验证构建成功

## 实现步骤

1. **任务 1**: 检查并修复类型定义
   - 检查 KnexSQLGenerator 类的 generateSQLWithBindings 方法返回类型
   - 确保类型定义正确导出
   - 检查 @metric-engine/core 包的类型定义

2. **任务 2**: 验证修复效果
   - 运行 TypeScript 编译命令
   - 运行构建命令

## 预期效果

- 类型错误消失，编译通过
- 代码能够正常构建
- 查询结果能够正确格式化并包含列映射信息