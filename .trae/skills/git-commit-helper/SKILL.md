---
name: 'git-commit-helper'
description: '按照项目规范帮助用户进行Git提交，包括更新commit_msg.txt、使用正确的提交格式等。Invoke when user asks to commit code, or when preparing git commits.'
---

# Git Commit Helper

此技能帮助你按照项目规范进行 Git 提交。

## 使用步骤

1. **更新 commit_msg.txt**

   - 编写极简中文内容
   - 内容需与当前变更契合
   - 格式：`feat/fix/chore/docs/refactor/init: 内容`
   - 按需分点，最多 3 点，每点不超过 20 字
   - 若中文乱码，改用简单英文

2. **执行提交**

   ```bash
   git commit -F commit_msg.txt
   ```

3. **提交完成后**
   - 清空 commit_msg.txt 中的内容

## 注意事项

- 禁止删除 commit_msg.txt
- 禁止未更新文件直接提交
- 推荐使用 Git Bash 终端操作
- 无需推送到远程仓库

## commit_msg.txt 示例

```
feat: 添加数据集管理模块
- 实现数据集CRUD功能
- 添加字段配置界面
```
