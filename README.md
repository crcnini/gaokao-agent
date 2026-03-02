# GaoKao-Agent 🎓

> 基于 OpenClaw 的多 Agent 高考备考助手

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 系统架构

GaoKao-Agent 采用多 Agent 协作架构：

```
学生输入 → 调度Agent → 专项Agent（数/语/理/英）→ 记忆模块 → 回复
```

**核心创新**：
1. 自动识别学科并路由，无需用户手动切换
2. 跨对话持久化错题记录和薄弱点画像
3. 各学科差异化教学策略（引导式 vs 分析式）

## 快速开始

### 前置要求
- 安装 OpenClaw：`curl -fsSL https://openclaw.ai/install.sh | bash`
- DeepSeek API Key（[申请地址](https://platform.deepseek.com)）

### 安装
```bash
git clone https://github.com/crcnini/gaokao-agent
cd gaokao-agent
```

### 使用
在 OpenClaw 中加载此 Skill，然后直接对话：

- `这道数学题怎么做：sin²x + cos²x = ?`
- `帮我复习三角函数的薄弱点`
- `距离高考60天，帮我制定复习计划`

## 评估结果

| 指标 | 结果 |
|------|------|
| 调度准确率 | 待测试（需配置 DeepSeek API Key 后运行 `node eval/eval.js`） |
| 用户评分（1-5分）| 待用户研究 |
| 测试用户数 | 待招募 |

## 文件说明

| 文件 | 说明 |
|------|------|
| `skill.md` | OpenClaw Skill 入口 |
| `dispatcher.js` | 调度 Agent 路由逻辑 |
| `agents/*.md` | 各科 Agent system prompt（TODO：根据最新考纲完善） |
| `tools/memory.js` | 错题记忆模块 |
| `memory/mistakes.json` | 错题记录（本地存储） |
| `memory/profile.json` | 学生薄弱点画像（本地存储） |
| `eval/eval.js` | 调度准确率评估脚本 |
| `docs/paper/draft.md` | arXiv 论文草稿 |

## 论文

本项目对应 arXiv 预印本：[待发布]

## License

MIT
