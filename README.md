# GaoKao-Agent 🎓

> 面向浙江高考的多 Agent AI 辅导助手，基于苏格拉底式教学法，支持 OpenClaw 一键接入 Telegram

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 简介

GaoKao-Agent 是专为**浙江省高考**设计的 AI 学习辅助系统。浙江高考采用「3+3」选考制度（语数英必考 + 7 选 3），本系统针对全部 10 个选考科目配置了专项 Agent，自动识别学科、用**苏格拉底式引导**替代直接给答案。

**核心理念**：不做做题机器，做引导思考的老师。

## 系统架构

```
学生提问（Telegram / 命令行）
    │
    ▼
OpenClaw Skill（skill.md）
    │ 检测到高考问题 → 调用 CLI
    ▼
cli.js（命令行入口）
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
MiniMax M2.5 API
    │
    ▼
苏格拉底式回复
  · solve 类：先问「你做到哪一步卡住了？」
  · concept 类：解释概念 + 末尾出验证题
  · review 类：先出题，再针对性讲解
  · plan 类：先了解现状，再给计划
```

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
- MiniMax API Key（[MiniMax 平台申请](https://platform.minimaxi.com)，支持 Coding Plan 免费额度）
- （可选）[OpenClaw](https://openclaw.ai) — 用于接入 Telegram / Discord

### 方式一：一键安装（推荐）

```bash
git clone https://github.com/crcnini/gaokao-agent
cd gaokao-agent
bash install.sh
```

脚本会自动：
1. 安装 Node.js 依赖
2. 创建 `.env` 配置文件
3. 注册 OpenClaw Skill（如果已安装 OpenClaw）
4. 重启 OpenClaw 使 skill 生效

安装后编辑 `.env`，填入 API Key：

```
MINIMAX_API_KEY=your_key_here
```

### 方式二：手动安装

```bash
git clone https://github.com/crcnini/gaokao-agent
cd gaokao-agent
npm install
cp .env.example .env
# 编辑 .env，填入 MINIMAX_API_KEY
```

### 命令行直接使用

```bash
# 解题题（会先问你的思路）
node cli.js "直线 y=2x+1 与 y=x² 的交点坐标是什么？"

# 概念题（直接解释 + 末尾验证）
node cli.js "什么是离心率？"

# 学习计划
node cli.js "距浙江高考还有 60 天，我选了物化生，请帮我制定复习计划"

# 翻译题（英语浙江独有题型）
node cli.js "把这句话译成英文：随着科技的发展，人们的生活发生了深刻变化"
```

### OpenClaw 集成（接入 Telegram）

如果你已安装 OpenClaw 并配置了 Telegram Bot，`install.sh` 会自动注册 skill。验证是否成功：

```bash
openclaw skills list | grep gaokao
# 应显示：✓ ready  gaokao-agent
```

之后在 Telegram 直接发问即可，OpenClaw 会自动调用本系统：

```
# Telegram 对话示例
你：这道导数题怎么做：f(x)=x³-3x+1 求极值
Bot：你做到哪一步卡住了？先把你的思路说给我听。

你：什么是椭圆的焦点？
Bot：焦点是椭圆的两个特殊点，到椭圆上任意一点的距离之和等于长轴...（解释 + 末尾出验证题）
```

**手动注册 OpenClaw Skill（不用 install.sh）**：

```bash
PROJECT_DIR=$(pwd)
mkdir -p ~/.openclaw/skills/gaokao-agent
sed "s|PROJECT_PATH|$PROJECT_DIR|g" skill.md > ~/.openclaw/skills/gaokao-agent/skill.md
openclaw gateway restart
```

## 苏格拉底辅导原则

| 问题类型 | 判断依据 | 系统行为 |
|---------|---------|---------|
| `solve` | 需要解一道具体的题 | 先问「你做到哪一步卡住了？」不给解法 |
| `concept` | 询问知识点/概念 | 直接解释，末尾出一道小题验证理解 |
| `review` | 复习错题/薄弱点 | 先出一道相关题，根据作答情况讲解 |
| `plan` | 制定学习计划 | 先了解现状（剩余时间/各科水平/每日时间），再给建议 |

## 评估结果

在 54 道覆盖全学科的测试用例上（基于浙江 2021-2023 年真题题型）：

```bash
node eval/eval.js
```

| 指标 | 结果 |
|------|------|
| 调度准确率 | 80%（54 用例，MiniMax M2.5） |
| 覆盖学科数 | 11（含浙江独有技术科） |
| 测试用例数 | 54 |

> 调度错误主要集中在跨学科边界问题（如「分析作文写得不好」归类为 solve vs review），此类歧义案例本身在浙江考试中也属于复合型问题。

## 文件结构

```
gaokao-agent/
├── install.sh            # 一键安装脚本
├── skill.md              # OpenClaw Skill 模板（install.sh 会将路径替换后注册）
├── cli.js                # 命令行入口（接受问题字符串，输出辅导回复）
├── dispatcher.js         # 调度 Agent（学科路由 + 问题类型判断）
├── index.js              # 主逻辑（调度 → 加载专项 Agent → 苏格拉底协议）
├── .env.example          # 环境变量模板
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
│   ├── mistakes.json     # 错题记录（本地存储，随使用积累）
│   └── profile.json      # 学生薄弱点画像（本地存储）
└── eval/
    ├── eval.js           # 调度准确率评估脚本
    └── test_cases.json   # 54 道浙江真题题型测试用例
```

## 更换模型

默认使用 MiniMax M2.5（`tools/api.js`），兼容所有 OpenAI 格式的 API：

```js
// tools/api.js
const client = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimaxi.com/v1', // 替换为其他模型的 baseURL
});
```

换成 Deepseek / 通义千问等只需修改 `baseURL` 和对应的 `apiKey` 环境变量名。

## License

MIT © 2026 [crcnini](https://github.com/crcnini)
