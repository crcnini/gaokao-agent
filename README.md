# GaoKao-Agent 🎓

> 面向浙江高考的多 Agent AI 备考助手，基于 OpenClaw Skill 构建

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 简介

GaoKao-Agent 是专为**浙江省高考**设计的 AI 学习辅助系统。浙江高考采用"3+3"选考制度（语数英必考 + 7 选 3），科目多、考纲细，本系统针对每个选考科目配置了专项 Agent，自动识别学科并给出差异化的教学指导。

## 系统架构

```
学生输入
    │
    ▼
调度 Agent（dispatcher.js）
  · 识别学科（11 类）
  · 判断问题类型（solve / concept / review / plan）
    │
    ▼
专项 Agent（agents/*.md）
  数学  语文  英语  物理  化学  生物
  历史  地理  政治  技术（信息+通用）
    │
    ▼
记忆模块（tools/memory.js）
  · 错题持久化（mistakes.json）
  · 薄弱点画像（profile.json）
    │
    ▼
个性化回复
```

**核心特性**：
1. **自动路由**：识别 11 个浙江选考学科，无需手动切换
2. **浙江特化**：每科 Agent 基于浙江自主命题考纲，覆盖浙江独有题型（英语翻译、技术科、3+3 选考策略等）
3. **持久记忆**：跨对话保存错题记录，积累 3 次以上自动标记薄弱点
4. **OpenClaw 集成**：以 Skill 形式接入，支持多平台部署

## 支持的学科

| 科目 | 文件 | 浙江特色内容 |
|------|------|-------------|
| 数学 | `agents/math.md` | 导数压轴分析、解析几何斜率讨论陷阱 |
| 语文 | `agents/chinese.md` | 60 分议论文写作、论述类文本判断技巧 |
| 英语 | `agents/english.md` | 中译英翻译题（浙江独有）、读后续写、两次考试策略 |
| 物理 | `agents/physics.md` | 实验题规范、电磁感应 εBLv 应用 |
| 化学 | `agents/chemistry.md` | 有机推断、电化学原电池 vs 电解池 |
| 生物 | `agents/biology.md` | 遗传题棋盘格法、减数分裂图像辨析 |
| 历史 | `agents/history.md` | 史料分析答题结构、时空定位法 |
| 地理 | `agents/geography.md` | 读图分析、舟山渔场等浙江本地题 |
| 政治 | `agents/politics.md` | 观点辨析模板、哲学矛盾观应用 |
| 技术 | `agents/technology.md` | Python 算法调试、通用技术设计思维（浙江独有科目） |

## 快速开始

### 前置要求

- Node.js ≥ 18
- MiniMax API Key（[Coding Plan 申请](https://platform.minimaxi.com)）或其他兼容 OpenAI 格式的模型

### 安装

```bash
git clone https://github.com/crcnini/gaokao-agent
cd gaokao-agent
npm install
```

### 配置

```bash
cp .env.example .env
# 编辑 .env，填入你的 API Key：
# MINIMAX_API_KEY=your_key_here
```

### 在 OpenClaw 中使用

在 OpenClaw 中加载 `skill.md`，然后直接对话：

```
这道导数题怎么做：f(x)=x³-3x+1 求极值
帮我复习化学电化学的薄弱点
距离浙江选考还有 60 天，我选了物化生，帮我制定计划
把这句话译成英文：随着科技的发展，人们的生活发生了深刻变化
```

### 独立运行（不依赖 OpenClaw）

```bash
node -e "
const { handleMessage } = require('./index');
const { apiCall } = require('./tools/api');
handleMessage('浙江高考解析几何斜率不存在怎么讨论', apiCall)
  .then(r => console.log(r.response));
"
```

## 评估结果

在 54 道覆盖全学科的测试用例上（基于浙江 2021-2023 年真题题型）：

```bash
node eval/eval.js
```

| 指标 | 结果 |
|------|------|
| 调度准确率 | 80%（54 用例，使用 MiniMax M2.5） |
| 覆盖学科数 | 11（含浙江独有的技术科） |
| 测试用例数 | 54 |

> 调度错误主要集中在跨学科边界问题（如"分析作文写得不好"归类为 solve vs review），此类歧义案例本身在浙江考试中也属于复合型问题，已在论文评估部分做详细讨论。

## 文件结构

```
gaokao-agent/
├── skill.md              # OpenClaw Skill 入口
├── dispatcher.js         # 调度 Agent（学科路由 + 问题类型判断）
├── index.js              # 主处理逻辑（调度 + 加载 Agent + 记忆注入）
├── agents/
│   ├── math.md           # 数学 Agent（浙江卷）
│   ├── chinese.md        # 语文 Agent（浙江卷）
│   ├── english.md        # 英语 Agent（含翻译题、读后续写）
│   ├── physics.md        # 物理 Agent
│   ├── chemistry.md      # 化学 Agent
│   ├── biology.md        # 生物 Agent
│   ├── history.md        # 历史 Agent
│   ├── geography.md      # 地理 Agent
│   ├── politics.md       # 政治 Agent
│   └── technology.md     # 技术 Agent（信息技术 + 通用技术）
├── tools/
│   ├── api.js            # MiniMax / OpenAI 兼容 API 适配
│   └── memory.js         # 错题记忆与薄弱点画像
├── memory/
│   ├── mistakes.json     # 错题记录（本地存储，gitignore）
│   └── profile.json      # 学生薄弱点画像（本地存储，gitignore）
├── eval/
│   ├── eval.js           # 调度准确率评估脚本
│   └── test_cases.json   # 54 道浙江真题题型测试用例
└── docs/
    ├── plans/            # 设计文档与实现计划
    └── paper/            # arXiv 论文草稿
```

## 论文

本项目对应 arXiv 预印本：[待发布]

## License

MIT © 2026 [crcnini](https://github.com/crcnini)
