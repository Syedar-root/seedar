# CLI 模块文档

## 模块目标

CLI 模块负责把 Seedar 的安装、升级、运行与诊断收敛成统一入口。

## 文档列表

- [overview.md](./overview.md)
- [install-and-update.md](./install-and-update.md)
- [runtime-layout.md](./runtime-layout.md)
- [maintenance.md](./maintenance.md)

## 关键代码入口

- [cli.ts](/D:/Program/projects/seedar/apps/cli/src/cli.ts)
- [install.ts](/D:/Program/projects/seedar/apps/cli/src/commands/install.ts)
- [lifecycle.ts](/D:/Program/projects/seedar/apps/cli/src/commands/lifecycle.ts)
- [doctor.ts](/D:/Program/projects/seedar/apps/cli/src/commands/doctor.ts)
- [runtime/index.ts](/D:/Program/projects/seedar/apps/cli/src/runtime/index.ts)
