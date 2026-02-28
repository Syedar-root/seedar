# 快速入门指南生成规范

## 文档目标

帮助新人在 30 分钟内运行项目并看到效果，无需了解复杂配置和理论说明。

## 支持的编程语言

- Node.js、Python、Java、Go、Rust、C#、PHP、Ruby 等

## 支持的依赖服务

- PostgreSQL、MySQL、Redis、MongoDB 等

## 文档结构

1. 项目概述
2. 环境要求
3. 环境安装（根据编程语言提供）
4. 项目安装
5. 配置环境变量
6. 初始化数据库（如需要）
7. 启动项目
8. 首次使用示例
9. 验证安装

## 通用生成步骤

1. 识别项目类型（Web 应用、API 服务、CLI 工具、库/SDK 等）
2. 查找配置文件（package.json、requirements.txt、pom.xml、go.mod、Cargo.toml 等）
3. 提取环境要求（运行时版本、依赖服务、其他工具）
4. 提取安装和启动命令（从 scripts 字段、Makefile 等）
5. 提取使用示例（从 README.md、examples/、测试文件等）
6. 生成文档

## 注意事项

- 所有命令应可直接复制运行
- 示例值应真实可用
- 预期输出应准确
- 步骤顺序应合理
- 避免使用项目内部术语
- 根据项目类型选择合适的文档格式
- 支持多种编程语言和框架
- 提供多种安装方式（如包管理器、源码编译）

## 示例模板

基础示例模板请参考[base-quick-start.md](../template/quick-start/base.md)
