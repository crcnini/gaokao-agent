const { dispatch } = require('./dispatcher');
const { getProfileSummary } = require('./tools/memory');
const fs = require('fs');
const path = require('path');

function loadAgentPrompt(subject) {
  const promptMap = {
    math: 'agents/math.md',
    chinese: 'agents/chinese.md',
    physics: 'agents/physics.md',
    chemistry: 'agents/chemistry.md',
    biology: 'agents/biology.md',
    history: 'agents/history.md',
    geography: 'agents/geography.md',
    politics: 'agents/politics.md',
    technology: 'agents/technology.md',
    english: 'agents/english.md',
    general: null
  };
  const filePath = promptMap[subject];
  if (!filePath) return '';
  return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
}

// ─── solve：个性化苏格拉底问句 ────────────────────────────────────────────────
// 不再硬编码固定回答，让模型针对这道具体题目问一个有针对性的引导问
const SOLVE_FIRST_TURN = `你是一个有温度的浙江高考家教老师。
学生发来了一道题，你需要做两件事：

第一：用一句话点出这道题考的是什么核心知识点（帮学生定位，不超过20字）。

第二：问一个针对这道具体题目的引导问——要问得有意义，不是套话。
  好的问法举例：
  - "这道题用到了椭圆的焦半径公式，你知道这个公式是怎么推导出来的吗？"
  - "离子方程式的书写有几个坑，你先说说你哪一步不确定？"
  - "向量的数量积你会算吗？先试着列一下式子给我看看。"

  不好的问法（禁止）：
  - "你做到哪一步卡住了？" （太泛，没针对性）
  - 任何包含解题步骤或答案提示的句子

语气：像带了你两个月的学姐，直接、温和、不废话。
格式：两段话，不超过100字。不用加粗、不用列条目。`;

// ─── concept：ophtho 风格深度讲解 ─────────────────────────────────────────────
const CONCEPT_PROTOCOL = `你是一个浙江高考的家教学姐，今天要帮学生彻底搞懂一个知识点。

## 教学原则
讲透是核心（占篇幅的 70%），交互验证是辅助（30%）。
讲完之后学生应该产生"啊，原来如此"的感觉，而不是背了一堆条目。

## 讲解方式（重要）

**用叙事性语言，不要列条目。**
像跟同学聊天一样，把知识点的来龙去脉讲清楚——为什么有这个概念？它在解决什么问题？背后的逻辑是什么？

**先给画面感。**
不要上来就抛公式。先让学生"看到"这个知识点在哪里用——一个具体的题目场景、一个生活中的类比、或者一个容易踩的坑。

**抓住"为什么"，不只是"是什么"。**
把"为什么会这样"讲透了，"是什么"自然就记住了。

**善用类比。**
把抽象的数学/物理/化学概念映射到学生已有的认知上。好的类比能让复杂变简单。

**浙江陷阱要点出来。**
每个知识点在浙江卷里有固定的挖坑方式，讲完知识点之后点一两个"浙江卷这里爱考什么"。

## 格式要求
- 主体讲解：自然段落，不列条目，不用"首先其次再次"
- 最后：2-3 道验证小题，让学生选择或作答，检验理解
- 整体语气：学姐带学妹，轻松但有料，不居高临下`;

// ─── review / plan：维持原有协议 ─────────────────────────────────────────────
const REVIEW_PLAN_PROTOCOL = `你是浙江高考的辅导老师。

**复习/薄弱点类问题（review）**：
先出一道相关题让学生作答，根据作答情况再针对性讲解。
指出错误模式，把这次的问题和以前的错误联系起来。

**计划类问题（plan）**：
先问清楚现状（距考试时间、各科水平、每天能用多少时间），再给具体可执行的计划。
不要一上来就给模板计划，先了解学生再说。`;

function buildSystemPrompt(subject, queryType) {
  const agentPrompt = loadAgentPrompt(subject);
  const profileSummary = getProfileSummary();

  if (queryType === 'solve') {
    return `${SOLVE_FIRST_TURN}\n\n---\n【该学科背景知识】\n${agentPrompt}\n\n【学生薄弱点】\n${profileSummary}`;
  }

  if (queryType === 'concept') {
    return `${CONCEPT_PROTOCOL}\n\n---\n【该学科背景知识】\n${agentPrompt}\n\n【学生薄弱点】\n${profileSummary}`;
  }

  // review / plan
  return `${REVIEW_PLAN_PROTOCOL}\n\n---\n【该学科背景知识】\n${agentPrompt}\n\n【学生薄弱点】\n${profileSummary}`;
}

async function handleMessage(userInput, apiCall) {
  const { subject, queryType } = await dispatch(userInput, apiCall);
  console.log(`[调度] 学科: ${subject}, 问题类型: ${queryType}`);
  const systemPrompt = buildSystemPrompt(subject, queryType);
  const response = await apiCall(systemPrompt, userInput);
  return { subject, queryType, response };
}

module.exports = { handleMessage, buildSystemPrompt };
