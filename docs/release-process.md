# Seedar 发布流程

## 目标

Seedar 采用两层发布模型：

1. `release-please` 负责版本号、Release PR、Git tag 和 GitHub Release。
2. `release.yml` 负责在 tag 创建后发布 DockerHub 镜像和 npm CLI。

## 标准流程

1. 功能分支开发并提交 PR 到 `master`
2. `verify` 在 `master` 合并后自动运行
3. `release-please` 自动创建或更新一个 Release PR
4. 确认 Release PR 中的版本号、changelog 和变更内容
5. 合并 Release PR
6. `release-please` 自动创建 `vX.Y.Z` tag 和 GitHub Release
7. `release.yml` 基于该 tag 发布：
   - `seedarhq/seedar-server:X.Y.Z`
   - `seedarhq/seedar-server:latest`
   - `seedarhq/seedar-web:X.Y.Z`
   - `seedarhq/seedar-web:latest`
   - `@seedar/cli@X.Y.Z`

## 版本来源

- 根目录 [package.json](/D:/Program/projects/seedar/package.json) 版本由 `release-please` 自动维护。
- [apps/cli/package.json](/D:/Program/projects/seedar/apps/cli/package.json) 版本与根版本同步。
- Git tag 采用 `vX.Y.Z`。

## 提交规范

为了让 `release-please` 正确判断版本变更，合入 `master` 的提交建议遵循 Conventional Commits：

- `feat:` 触发 minor 版本升级
- `fix:` 触发 patch 版本升级
- `feat!:` / `fix!:` 或正文包含 `BREAKING CHANGE:` 触发 major 版本升级
- `chore:` / `docs:` / `refactor:` 默认不会触发新版本

如果需要手工指定版本，可在提交信息或 PR squash 提交中加入：

```text
Release-As: 1.2.0
```

## 必要 Secrets

仓库 `Actions Secrets` 需要配置：

- `RELEASE_PLEASE_TOKEN`
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `NPM_TOKEN`

其中 `RELEASE_PLEASE_TOKEN` 应为具备 repo 权限的 PAT，用于让 `release-please` 创建的 tag 继续触发下游发布 workflow。
