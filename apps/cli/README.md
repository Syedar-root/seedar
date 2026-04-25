# @syedar/seedar-cli

Seedar 的安装与运维命令行工具。

## 使用

```bash
npx @syedar/seedar-cli@latest install
```

或全局安装：

```bash
npm install -g @syedar/seedar-cli
seedar status
```

## 常用命令

```bash
# 保留配置与备份（可选删除 data）
seedar uninstall --remove-data --force

# 彻底删除安装目录（配置/数据/日志/备份全部删除）
seedar purge --force
```
