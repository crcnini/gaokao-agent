---
name: gaokao-agent
description: "Socratic AI tutor for high school students preparing for Zhejiang gaokao (浙江高考). Use ONLY when a high school student asks exam-preparation questions: solving gaokao-style problems (数学题/物理题/化学题/生物题/历史题/地理题/政治题), high school Chinese/English exam questions (语文作文/英语翻译), high school technology subject (信息技术/通用技术 for gaokao), or gaokao study planning. Do NOT trigger for general adult coding questions, casual chat, or professional work topics."
---

# 浙江高考 AI 辅导助手

当用户提问涉及任何高考学科时，**必须执行以下 CLI 工具**，不得直接作答。

## 执行步骤

**第一步：运行辅导工具**

把用户的问题原文传给 CLI（将 `PROJECT_PATH` 替换为你的项目实际路径）：

```bash
node PROJECT_PATH/cli.js "用户的完整问题"
```

**示例：**
- 用户问："求导数 f(x) = x³ - 2x 在 x=1 处的值"
  → 执行：`node PROJECT_PATH/cli.js "求导数 f(x) = x³ - 2x 在 x=1 处的值"`

- 用户问："氯气和水反应的方程式"
  → 执行：`node PROJECT_PATH/cli.js "氯气和水反应的方程式"`

**第二步：直接输出结果**

将命令的 stdout 输出**原封不动**地发送给用户。不要：
- ❌ 在输出前后加自己的话
- ❌ 修改或总结输出内容
- ❌ 跳过执行直接作答

## 注意事项

- 问题中含有引号时，用反斜杠转义：`\"`
- 运行前请确保项目目录下已配置好 `.env`（含 `MINIMAX_API_KEY`）
- 如果命令报错，提示用户检查 `.env` 配置
