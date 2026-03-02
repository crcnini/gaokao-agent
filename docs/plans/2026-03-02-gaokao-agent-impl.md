# GaoKao-Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建基于 OpenClaw 的多 Agent 高考备考系统，支持学科路由、专项辅导、错题记忆。

**Architecture:** 调度 Agent 解析用户输入并路由到对应学科 Agent；各学科 Agent 使用专门的 system prompt；记忆模块用本地 JSON 文件持久化错题和薄弱点画像。

**Tech Stack:** OpenClaw Skills、JavaScript (Node.js)、DeepSeek API、本地 JSON 文件

---

## 前置准备（手动完成，约10分钟）

1. 确认 OpenClaw 已安装：终端运行 `openclaw --version`，若未安装参考 https://openclaw.ai
2. 准备 DeepSeek API Key：前往 https://platform.deepseek.com 注册获取
3. 在 OpenClaw 中配置 DeepSeek 为默认模型
4. 工作目录：`~/Desktop/gaokao-agent/`（已创建）

---

## Task 1: 初始化项目结构

**Files:**
- Create: `memory/mistakes.json`
- Create: `memory/profile.json`
- Create: `agents/math.md`
- Create: `agents/chinese.md`
- Create: `agents/science.md`
- Create: `agents/english.md`
- Create: `tools/memory.js`
- Create: `eval/test_cases.json`
- Create: `skill.md`
- Create: `dispatcher.js`

**Step 1: 创建目录结构**

```bash
cd ~/Desktop/gaokao-agent
mkdir -p agents memory tools eval docs/paper
```

**Step 2: 创建空的记忆文件**

`memory/mistakes.json`:
```json
{
  "mistakes": []
}
```

`memory/profile.json`:
```json
{
  "weak_topics": {
    "math": [],
    "chinese": [],
    "science": [],
    "english": []
  },
  "total_sessions": 0,
  "last_active": ""
}
```

**Step 3: 验证目录结构**

```bash
find ~/Desktop/gaokao-agent -type f | sort
```
预期输出：列出所有新建文件

**Step 4: Commit**

```bash
cd ~/Desktop/gaokao-agent
git add .
git commit -m "feat: initialize project structure"
```

---

## Task 2: 记忆模块工具函数

**Files:**
- Create: `tools/memory.js`

**Step 1: 写 memory.js**

`tools/memory.js`:
```javascript
const fs = require('fs');
const path = require('path');

const MISTAKES_PATH = path.join(__dirname, '../memory/mistakes.json');
const PROFILE_PATH = path.join(__dirname, '../memory/profile.json');

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 添加一条错题记录
function addMistake(subject, topic, question, errorType) {
  const data = readJSON(MISTAKES_PATH);
  const newMistake = {
    id: String(data.mistakes.length + 1).padStart(3, '0'),
    date: new Date().toISOString().slice(0, 10),
    subject,
    topic,
    question,
    error_type: errorType,
    reviewed: false
  };
  data.mistakes.push(newMistake);
  writeJSON(MISTAKES_PATH, data);
  return newMistake;
}

// 获取某学科的未复习错题
function getPendingMistakes(subject) {
  const data = readJSON(MISTAKES_PATH);
  return data.mistakes.filter(m => m.subject === subject && !m.reviewed);
}

// 更新薄弱点（topic 出现3次以上加入薄弱点）
function updateWeakTopics(subject, topic) {
  const profile = readJSON(PROFILE_PATH);
  if (!profile.weak_topics[subject].includes(topic)) {
    const count = readJSON(MISTAKES_PATH).mistakes
      .filter(m => m.subject === subject && m.topic === topic).length;
    if (count >= 3) {
      profile.weak_topics[subject].push(topic);
      writeJSON(PROFILE_PATH, profile);
    }
  }
}

// 获取学生画像摘要（用于注入 Agent prompt）
function getProfileSummary() {
  const profile = readJSON(PROFILE_PATH);
  const lines = [];
  for (const [subject, topics] of Object.entries(profile.weak_topics)) {
    if (topics.length > 0) {
      lines.push(`${subject}: ${topics.join('、')}`);
    }
  }
  return lines.length > 0
    ? `该学生薄弱点：\n${lines.join('\n')}`
    : '暂无薄弱点记录';
}

module.exports = { addMistake, getPendingMistakes, updateWeakTopics, getProfileSummary };
```

**Step 2: 手动测试**

```bash
cd ~/Desktop/gaokao-agent
node -e "
const m = require('./tools/memory');
m.addMistake('math', '三角函数', 'sin(π/6)=?', '概念混淆');
console.log(m.getPendingMistakes('math'));
console.log(m.getProfileSummary());
"
```
预期输出：打印出刚添加的错题对象

**Step 3: Commit**

```bash
git add tools/memory.js memory/
git commit -m "feat: add memory module for mistakes and profile tracking"
```

---

## Task 3: 调度 Agent

**Files:**
- Create: `dispatcher.js`

**Step 1: 写 dispatcher.js**

`dispatcher.js`:
```javascript
// 调度 Agent：分析输入，返回 { subject, queryType }
// subject: 'math' | 'chinese' | 'science' | 'english' | 'general'
// queryType: 'solve' | 'concept' | 'review' | 'plan'

const DISPATCH_PROMPT = `你是一个高中学习助手的调度系统。
分析用户输入，返回 JSON 格式：
{"subject": "math|chinese|science|english|general", "queryType": "solve|concept|review|plan"}

学科判断规则：
- math: 含有数学符号、方程、函数、几何、概率等
- chinese: 古诗词、文言文、作文、阅读理解（中文文学类）
- science: 物理、化学、生物、力学、化学方程式、细胞
- english: 英语语法、英语作文、英文阅读、单词
- general: 学习规划、薄弱点分析、跨学科或不明确

问题类型判断：
- solve: 用户要解一道题
- concept: 用户要理解某个知识点
- review: 用户要复习错题或薄弱点
- plan: 用户要制定学习计划

只输出 JSON，不要其他内容。`;

async function dispatch(userInput, apiCall) {
  const response = await apiCall(DISPATCH_PROMPT, userInput);
  try {
    return JSON.parse(response.trim());
  } catch {
    // 解析失败时的默认值
    return { subject: 'general', queryType: 'concept' };
  }
}

module.exports = { dispatch, DISPATCH_PROMPT };
```

**Step 2: 写测试用例文件**

`eval/test_cases.json`:
```json
[
  {"input": "这道三角函数题怎么做：sin²x + cos²x = ?", "expected_subject": "math", "expected_type": "solve"},
  {"input": "请解释二次函数的对称轴公式", "expected_subject": "math", "expected_type": "concept"},
  {"input": "赤壁赋里苏轼表达了什么思想", "expected_subject": "chinese", "expected_type": "concept"},
  {"input": "帮我分析这篇作文哪里写得不好", "expected_subject": "chinese", "expected_type": "solve"},
  {"input": "牛顿第二定律F=ma如何用到这道题", "expected_subject": "science", "expected_type": "solve"},
  {"input": "光合作用的暗反应在哪里进行", "expected_subject": "science", "expected_type": "concept"},
  {"input": "这个英语从句为什么用虚拟语气", "expected_subject": "english", "expected_type": "concept"},
  {"input": "距离高考还有100天，帮我制定复习计划", "expected_subject": "general", "expected_type": "plan"},
  {"input": "我数学老错，帮我看看薄弱点", "expected_subject": "general", "expected_type": "review"},
  {"input": "化学中氧化还原反应的电子转移怎么计算", "expected_subject": "science", "expected_type": "concept"}
]
```

**Step 3: Commit**

```bash
git add dispatcher.js eval/test_cases.json
git commit -m "feat: add dispatcher agent with subject routing logic"
```

---

## Task 4: 各科 Agent System Prompts

**Files:**
- Create: `agents/math.md`
- Create: `agents/chinese.md`
- Create: `agents/science.md`
- Create: `agents/english.md`

> ⚠️ **这一步最重要，需要你亲自写或大量修改。**
> 以下是模板，请根据你的高中学科知识补充"高频考点""易错点""解题策略"等内容。

**Step 1: 写 agents/math.md**

```markdown
# 数学 Agent

## 角色
你是一位经验丰富的高中数学老师，专注于帮助学生备考高考数学。

## 教学原则
1. **不直接给答案**：引导学生一步步思考，用苏格拉底式提问
2. **标注考点**：每次解答后标注涉及的高考考点和近5年考频
3. **指出易错点**：提醒常见的计算错误或概念混淆
4. **公式确认**：用到公式时先问学生是否记得，再确认

## 高考高频考点（请补充）
- 函数与导数（约占25%）
- 三角函数与解三角形（约占15%）
- 数列（约占10%）
- 立体几何（约占15%）
- 概率与统计（约占10%）
- 解析几何（约占20%）

## 解题引导模板
当学生提出解题请求时：
1. 先问：「你目前思路走到哪一步了？」
2. 给出第一个提示而非完整解法
3. 等学生回应后再继续引导
4. 最后展示完整解法并总结方法论

## 错题分析格式
错误类型：[概念混淆 / 计算错误 / 读题失误 / 方法选择错误]
考点：[具体知识点]
建议：[下一步复习方向]
```

**Step 2: 写 agents/chinese.md**

```markdown
# 语文 Agent

## 角色
你是一位高中语文老师，专注于高考语文备考，尤其擅长古诗文鉴赏和现代文阅读。

## 教学原则
1. **古诗文**：先翻译字词，再分析意象，最后点明主旨
2. **作文**：从立意→结构→素材三个层次分析，不直接代写
3. **阅读理解**：教会学生找"关键词"和"答题规范"
4. **文言文**：重点关注实词虚词、句式特殊性

## 高频考点（请根据最新考纲补充）
- 名句名篇默写（必背篇目）
- 古诗词鉴赏
- 文言文阅读
- 现代文阅读（信息类 + 文学类）
- 语言文字运用
- 写作

## 答题规范提示
每次作答时提醒学生高考标准答题格式。
```

**Step 3: 写 agents/science.md**

```markdown
# 理综 Agent（物理/化学/生物）

## 角色
你是一位高中理综老师，覆盖物理、化学、生物三科。

## 教学原则
1. **物理**：强调受力分析图和公式推导过程，不跳步
2. **化学**：写化学方程式必须配平，标明反应条件
3. **生物**：区分"记忆型"和"理解型"知识点，分别对待
4. **单位**：解题时必须带单位，这是高考扣分重灾区

## 学科识别
收到问题后，先判断是物理/化学/生物，再用对应策略回答。

## 高频考点（请补充）
### 物理
- 力学（牛顿定律、动能定理、动量）
- 电磁学（电场、磁场、电磁感应）

### 化学
- 离子方程式书写
- 氧化还原反应
- 有机化学基础

### 生物
- 细胞结构与功能
- 遗传与进化
- 生态系统
```

**Step 4: 写 agents/english.md**

```markdown
# 英语 Agent

## 角色
你是一位高中英语老师，专注于高考英语备考。

## 教学原则
1. **语法**：用中文解释，给出正确和错误对比例句
2. **作文**：从内容、语言、结构三维度批改，给出修改建议
3. **阅读**：教会学生"略读找主旨、精读找细节"的技巧
4. **翻译**：先直译后意译，解释差异

## 高频考点（请补充）
- 书面表达（应用文 + 读后续写）
- 阅读理解（推理判断题最难）
- 语法填空
- 听力（如适用）

## 回复语言
默认用中文解释，英文例句附中文翻译。
```

**Step 5: Commit**

```bash
git add agents/
git commit -m "feat: add subject agent system prompts for math/chinese/science/english"
```

---

## Task 5: OpenClaw Skill 入口

**Files:**
- Create: `skill.md`

**Step 1: 写 skill.md**

```markdown
# GaoKao-Agent

高考备考 AI 助手，支持数学、语文、理综、英语四科辅导，自动记录错题和薄弱点。

## 使用方式

直接用自然语言提问，例如：
- "这道三角函数题怎么解：..."
- "帮我分析一下《赤壁赋》的主旨"
- "我的薄弱点有哪些？"
- "距离高考还有60天，帮我规划复习"

## 触发词
- 数学题、函数、方程、几何 → 数学 Agent
- 古诗、作文、文言文、阅读 → 语文 Agent
- 物理、化学、生物、力学 → 理综 Agent
- 英语、语法、英文 → 英语 Agent
- 复习计划、薄弱点、错题 → 通用 Agent

## 技术说明
基于 OpenClaw + DeepSeek API，本地运行，数据存储在 memory/ 目录。
```

**Step 2: Commit**

```bash
git add skill.md
git commit -m "feat: add OpenClaw skill entry point"
```

---

## Task 6: 主程序整合

**Files:**
- Create: `index.js`

**Step 1: 写 index.js**

`index.js`:
```javascript
const { dispatch } = require('./dispatcher');
const { getProfileSummary, addMistake } = require('./tools/memory');
const fs = require('fs');
const path = require('path');

// 读取 Agent system prompt
function loadAgentPrompt(subject) {
  const promptMap = {
    math: 'agents/math.md',
    chinese: 'agents/chinese.md',
    science: 'agents/science.md',
    english: 'agents/english.md',
    general: null
  };
  const filePath = promptMap[subject];
  if (!filePath) return '';
  return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
}

// 构建最终发给 LLM 的 system prompt
function buildSystemPrompt(subject) {
  const agentPrompt = loadAgentPrompt(subject);
  const profileSummary = getProfileSummary();

  return `${agentPrompt}

---
【学生当前状态】
${profileSummary}

请根据以上信息，给出个性化的回答。`;
}

// 主入口：接收用户输入，返回回复
async function handleMessage(userInput, apiCall) {
  // Step 1: 调度
  const { subject, queryType } = await dispatch(userInput, apiCall);
  console.log(`[调度] 学科: ${subject}, 问题类型: ${queryType}`);

  // Step 2: 构建 system prompt
  const systemPrompt = buildSystemPrompt(subject);

  // Step 3: 调用专项 Agent
  const response = await apiCall(systemPrompt, userInput);

  return {
    subject,
    queryType,
    response
  };
}

module.exports = { handleMessage, buildSystemPrompt };
```

**Step 2: 手动测试整合**

```bash
cd ~/Desktop/gaokao-agent
node -e "
const { buildSystemPrompt } = require('./index');
const prompt = buildSystemPrompt('math');
console.log(prompt.slice(0, 200));  // 打印前200字确认格式
"
```

**Step 3: Commit**

```bash
git add index.js
git commit -m "feat: integrate dispatcher, agents, and memory in main handler"
```

---

## Task 7: 评估脚本

**Files:**
- Create: `eval/eval.js`

**Step 1: 写 eval.js**

`eval/eval.js`:
```javascript
// 自动评估调度准确率
// 运行前需设置环境变量 DEEPSEEK_API_KEY
const { dispatch } = require('../dispatcher');
const testCases = require('./test_cases.json');

// 模拟 API 调用（需替换为真实的 DeepSeek 调用）
async function mockApiCall(systemPrompt, userInput) {
  // TODO: 替换为真实 API 调用
  // const { default: OpenAI } = require('openai');
  // const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com' });
  // const resp = await client.chat.completions.create({...});
  // return resp.choices[0].message.content;
  return '{"subject": "math", "queryType": "solve"}'; // placeholder
}

async function runEval() {
  let correct = 0;
  const results = [];

  for (const tc of testCases) {
    const result = await dispatch(tc.input, mockApiCall);
    const subjectOk = result.subject === tc.expected_subject;
    const typeOk = result.queryType === tc.expected_type;
    if (subjectOk && typeOk) correct++;

    results.push({
      input: tc.input,
      expected: `${tc.expected_subject}/${tc.expected_type}`,
      got: `${result.subject}/${result.queryType}`,
      pass: subjectOk && typeOk
    });
  }

  console.log(`\n调度准确率: ${correct}/${testCases.length} (${(correct/testCases.length*100).toFixed(1)}%)\n`);
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✗';
    console.log(`${icon} [${r.expected}] "${r.input.slice(0, 30)}..."`);
    if (!r.pass) console.log(`    → 实际: ${r.got}`);
  });
}

runEval().catch(console.error);
```

**Step 2: Commit**

```bash
git add eval/eval.js
git commit -m "feat: add evaluation script for dispatcher accuracy"
```

---

## Task 8: README 和 GitHub 准备

**Files:**
- Create: `README.md`

**Step 1: 写 README.md**

```markdown
# GaoKao-Agent 🎓

> 基于 OpenClaw 的多 Agent 高考备考助手

[![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/gaokao-agent)](https://github.com/YOUR_USERNAME/gaokao-agent)
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
git clone https://github.com/YOUR_USERNAME/gaokao-agent
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
| 调度准确率 | XX% (XX/50) |
| 用户评分（1-5分）| X.X |
| 测试用户数 | X人 |

## 论文

本项目对应 arXiv 预印本：[链接待补充]

## 文件说明

| 文件 | 说明 |
|------|------|
| `skill.md` | OpenClaw Skill 入口 |
| `dispatcher.js` | 调度 Agent 路由逻辑 |
| `agents/*.md` | 各科 Agent system prompt |
| `tools/memory.js` | 错题记忆模块 |
| `eval/` | 自动评估脚本 |

## License

MIT
```

**Step 2: 创建 MIT License 文件**

```bash
cat > ~/Desktop/gaokao-agent/LICENSE << 'EOF'
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
EOF
```

**Step 3: Commit**

```bash
git add README.md LICENSE
git commit -m "docs: add README and MIT license for open source release"
```

---

## Task 9: 论文草稿（arXiv 投稿用）

**Files:**
- Create: `docs/paper/draft.md`

**Step 1: 写论文框架**

`docs/paper/draft.md`:
```markdown
# GaoKao-Agent: A Multi-Agent System for Chinese High School
# Exam Preparation Using LLM Tool Use

**Abstract**

We present GaoKao-Agent, an open-source multi-agent system designed to assist
Chinese high school students in preparing for the National College Entrance
Examination (Gaokao). Unlike general-purpose AI assistants, GaoKao-Agent
employs a dispatcher agent that automatically routes student queries to
subject-specialized agents (mathematics, Chinese, science, English), each
equipped with exam-specific teaching strategies and pedagogical guidelines.
A local memory module persists mistake records and weakness profiles across
sessions. We evaluate the system through automated routing accuracy tests
(N=50) and a user study (N=X) comparing against baseline LLM usage.
Our system achieves XX% routing accuracy and received an average user
satisfaction score of X.X/5.0. The system is open-sourced at [GitHub URL].

---

## 1. Introduction

[待补充：高中生AI学习工具现状，现有工具的3个核心不足，本文贡献]

## 2. Related Work

[待补充：LLM Agents综述，教育AI系统，OpenClaw介绍]

## 3. System Design

### 3.1 Architecture Overview
[插入架构图]

### 3.2 Dispatcher Agent
[描述路由逻辑和prompt设计]

### 3.3 Subject-Specialized Agents
[描述各科Agent的差异化教学策略]

### 3.4 Memory Module
[描述错题记录和薄弱点画像]

## 4. Implementation

[描述OpenClaw Skill实现，技术栈，部署方式]

## 5. Evaluation

### 5.1 Routing Accuracy
[插入50道测试题的结果表格]

### 5.2 User Study
[插入问卷结果和分析]

## 6. Conclusion

[贡献总结，局限性，未来工作]

## References

[15-20篇参考文献，用Claude Code辅助生成]
```

**Step 2: Commit**

```bash
git add docs/paper/
git commit -m "docs: add arXiv paper draft skeleton"
```

---

## 里程碑总结

| 阶段 | Tasks | 验收标准 |
|------|-------|---------|
| **Phase 1** 基础搭建 | Task 1-3 | 记忆模块可正常读写，调度逻辑可解析 |
| **Phase 2** Agent 完善 | Task 4-6 | 4科 Agent prompt 写好，主程序可运行 |
| **Phase 3** 评估 | Task 7 | 评估脚本跑通，准确率 ≥ 90% |
| **Phase 4** 发布 | Task 8-9 | GitHub 上线，论文框架完成 |

**推荐执行顺序**：Task 1 → 2 → 3 → 4（最花心思）→ 5 → 6 → 7 → 8 → 9

> **给执行者的提示**：Task 4（各科 Agent prompt）是整个项目最有价值的部分，也是论文的核心贡献。建议在这里投入最多时间，结合最新高考考纲来写，而不是依赖 AI 生成的模板。
