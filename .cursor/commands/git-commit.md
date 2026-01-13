# git-commit

尽可能尝试使用极简的中文进行规范的 git 提交，避免提交出现中文乱码，若乱码可以使用简单的英文
另外，如果内容很多，可以分点列出，但不超过 3 点，同时每点不超过 20 字
工作流程：

1. 编写提交信息，简洁明了
2. 检查中文显示，防止乱码
3. 如乱码,用简单英文替代

Try hardfully to use minimal Chinese for standardized git commits. If there is Chinese garbling, use simple English.
If there is a lot of content, you can list up to three points, each within 20 characters.
Workflow:

1. Write a concise commit message.
2. Check Chinese display, avoid garbled text.
3. If garbled, use simple English.

请尝试用 Git Bash 终端来提交，如果不行可以尝试借助 commit_msg.txt，使用 git commit -F commit_msg.txt 来提交中文 commit

你需要保证提交的格式符合 git 规范
如：feat/fix/chore/docs/refactor/init: xxxxxxxxx
