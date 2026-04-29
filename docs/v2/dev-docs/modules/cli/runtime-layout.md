# CLI 运行时目录

## 1. 运行时结构

运行时目录由 [runtime/index.ts](/D:/Program/projects/seedar/apps/cli/src/runtime/index.ts) 统一管理。

核心结构：

- `runtime/docker-compose.yml`
- `runtime/.env`
- `runtime/.installed-version`
- `runtime/.install-state`
- `data/mysql`
- `logs`
- `backups`

## 2. 关键类型

相关类型定义见 [shared/types.ts](/D:/Program/projects/seedar/apps/cli/src/shared/types.ts)。

最关键的两个对象是：

- `RuntimeLayout`
- `EnvConfig`

## 3. 设计意义

这套目录结构让 CLI 可以：

- 读取当前状态
- 执行备份
- 做幂等安装
- 在升级失败时恢复配置
