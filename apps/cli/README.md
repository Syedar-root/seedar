# @syedar/seedar-cli

Seedar 生产部署 CLI。

## 安装

```bash
npx @syedar/seedar-cli@latest install
```

或者全局安装：

```bash
npm install -g @syedar/seedar-cli
seedar --help
```

## 常用命令

```bash
seedar install [version] [-y]
seedar update [version]
seedar start
seedar stop
seedar status
seedar logs [service] [-f]
seedar doctor
seedar uninstall [--remove-data] [--all] [--force]
seedar remove --force
seedar purge --force
```

## 说明

- `service` 可选值：`mysql`、`server`、`web`、`migrate`
- `--help` 和 `help` 都可查看帮助
- 全局 flag 也可以放在命令前面，例如 `seedar -y install`
