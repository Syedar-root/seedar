# CLI 模块文档

## 1. 模块目标

CLI 模块负责把 Seedar 的安装、升级、运行与诊断收敛成统一入口。

它让 Seedar 不再只是“开发仓库”，而是具备真正交付能力的系统。

## 2. 模块价值

CLI 的出现意味着：

- 安装不再依赖人工脚本知识
- 升级流程被标准化
- 运维入口更可控
- 发布体系更完整

## 3. 文档列表

- [overview.md](./overview.md)
- [install-and-update.md](./install-and-update.md)
- [runtime-layout.md](./runtime-layout.md)
- [maintenance.md](./maintenance.md)

## 4. 适合谁阅读

- 需要部署或交付系统的同学
- 需要改 CLI 命令逻辑的开发者
- 需要写“系统部署与运维设计”的论文作者

## 5. 关键代码入口

- [cli.ts](/D:/Program/projects/seedar/apps/cli/src/cli.ts)
- [install.ts](/D:/Program/projects/seedar/apps/cli/src/commands/install.ts)
- [lifecycle.ts](/D:/Program/projects/seedar/apps/cli/src/commands/lifecycle.ts)
- [doctor.ts](/D:/Program/projects/seedar/apps/cli/src/commands/doctor.ts)
- [runtime/index.ts](/D:/Program/projects/seedar/apps/cli/src/runtime/index.ts)
