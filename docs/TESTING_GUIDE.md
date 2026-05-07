# Seedar 项目测试指南

## 📋 目录
- [项目现状](#项目现状)
- [快速开始](#快速开始)
- [测试命令](#测试命令)
- [测试结构](#测试结构)
- [如何添加新测试](#如何添加新测试)
- [常见问题](#常见问题)

## 🎯 项目现状

**当前测试状态**：
- ✅ `metric_engine` 包：39个测试全部通过
- ✅ `server` 包：46个测试通过，1个模板测试失败（可忽略）

**测试覆盖率**：可通过 `pnpm test:cov` 生成报告

## 🚀 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 运行所有测试
```bash
# 从根目录运行所有测试
pnpm test
```

### 3. 运行单个包测试
```bash
# 只运行 metric_engine 测试
pnpm test:metric

# 只运行 server 测试
pnpm test:server
```

## 📝 测试命令

### 根目录命令

| 命令 | 说明 |
|------|------|
| `pnpm test` | 运行所有包的测试 |
| `pnpm test:metric` | 只运行 metric_engine 测试 |
| `pnpm test:server` | 只运行 server 测试 |
| `pnpm test:cov` | 生成所有包的测试覆盖率报告 |
| `pnpm test:cov:metric` | 只生成 metric_engine 覆盖率 |
| `pnpm test:cov:server` | 只生成 server 覆盖率 |

### 各包独立命令

#### metric_engine 包
```bash
cd packages/metric_engine
pnpm test          # 运行测试
pnpm test:watch    # 监听模式运行
pnpm test:cov      # 生成覆盖率报告
```

#### server 包
```bash
cd apps/server
pnpm test          # 运行测试
pnpm test:watch    # 监听模式运行
pnpm test:cov      # 生成覆盖率报告
```

## 📁 测试结构

```
/workspace
├── apps/
│   └── server/
│       ├── src/
│       │   └── module/
│       │       └── query/
│       │           └── dsl-transformer/
│       │               ├── dsl-transformer.spec.ts
│       │               ├── dsl-transformer.ts
│       │               └── dsl-transformer.v2.ts
│       └── jest.config.js
├── packages/
│   └── metric_engine/
│       ├── src/
│       ├── test/
│       │   ├── v2/
│       │   │   ├── expr/
│       │   │   │   ├── comparison-aggregate.spec.ts
│       │   │   │   └── period-comparison.spec.ts
│       │   │   └── sql/
│       │   │       ├── derived-dimensions.spec.ts
│       │   │       └── period-comparison.spec.ts
│       │   └── v2-filter-expr.spec.ts
│       └── jest.config.js
└── docs/
    └── TESTING_GUIDE.md (本文件)
```

## ✅ 如何添加新测试

### 1. 在 metric_engine 中添加测试

1. 在 `packages/metric_engine/test/` 目录下创建新的测试文件
2. 命名规范：`*.spec.ts`
3. 示例：

```typescript
import { YourComponent } from '../src/your-component';

describe('YourComponent', () => {
  it('should do something', () => {
    // 测试逻辑
    const result = YourComponent.doSomething();
    expect(result).toEqual(expected);
  });
});
```

### 2. 在 server 中添加测试

1. 在对应的模块目录下创建 `*.spec.ts` 文件
2. 示例：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## 📊 测试覆盖率报告

运行 `pnpm test:cov` 后，覆盖率报告将生成在：
- `packages/metric_engine/coverage/`
- `apps/server/coverage/`

在浏览器中打开 `index.html` 查看详细报告。

## 🔍 测试重点区域

### 1. metric_engine 核心测试区域
- DSL 解析与转换
- SQL 生成
- 过滤表达式（IN, BETWEEN, LIKE, NULL）
- 期间比较
- 派生维度
- 聚合函数

### 2. server 核心测试区域
- DSL 转换器（v1 & v2）
- API 端点测试（可扩展）
- 服务层测试

## 💡 最佳实践

1. **测试命名**：使用描述性的测试名称
   ```typescript
   it('should generate correct SQL for IN filter', () => { ... })
   ```

2. **测试组织**：使用 `describe` 块组织相关测试
   ```typescript
   describe('Filter Expression', () => {
     describe('IN Expression', () => { ... })
     describe('BETWEEN Expression', () => { ... })
   })
   ```

3. **独立测试**：每个测试应该独立运行，不依赖其他测试

4. **Mock 外部依赖**：对于外部服务，使用 mock 避免真实调用

## ❓ 常见问题

### Q: server 测试失败怎么办？
A: 大部分失败是配置问题，检查：
1. 依赖是否正确安装
2. Jest 配置是否正确
3. 环境变量是否配置

### Q: 如何只运行特定测试？
A: 使用 `.only` 或 `grep`：
```typescript
it.only('should run only this test', () => { ... })
```
或：
```bash
pnpm test -- -t "specific test name"
```

### Q: 测试太慢怎么办？
A: 
- 使用 `pnpm test:watch` 监听模式
- 只运行相关包的测试
- 使用 `.only` 聚焦特定测试

## 📚 更多资源

- [Jest 官方文档](https://jestjs.io/)
- [NestJS 测试指南](https://docs.nestjs.com/fundamentals/testing)
- [项目文档目录](../docs/v2/dev-docs/)
