# GaoKao-Agent: A Multi-Agent System for Chinese High School Exam Preparation Using LLM Tool Use

**Authors:** [待填写]
**Date:** 2026
**arXiv category:** cs.AI, cs.CL

---

## Abstract

We present GaoKao-Agent, an open-source multi-agent system designed to assist
Chinese high school students in preparing for the National College Entrance
Examination (Gaokao). Unlike general-purpose AI assistants, GaoKao-Agent
employs a dispatcher agent that automatically routes student queries to
subject-specialized agents (mathematics, Chinese language, science, English),
each equipped with exam-specific teaching strategies and pedagogical guidelines.
A local memory module persists mistake records and weakness profiles across
sessions, enabling personalized tutoring without cloud dependency. We evaluate
the system through automated routing accuracy tests (N=50) and a user study
(N=TBD) comparing against baseline LLM usage. The system is open-sourced at
https://github.com/crcnini/gaokao-agent.

**Keywords:** LLM Agents, Educational AI, Multi-Agent Systems, Gaokao, Personalized Learning

---

## 1. Introduction

[TODO: ~800字]

高中生面临的核心挑战：
1. 通用 AI 工具不了解高考考纲，回答缺乏针对性
2. 每次对话从零开始，无法记忆薄弱点
3. 多学科需要频繁手动切换工具，体验割裂

本文贡献：
1. 设计并实现了面向高考场景的多 Agent 路由系统
2. 针对数学/语文/理综/英语开发了差异化教学策略 prompt
3. 实现了基于本地 JSON 的跨对话记忆模块
4. 基于开源 Agent 框架（OpenClaw）实现，完全本地运行，保护数据隐私
5. 开源发布，附评估脚本和论文

---

## 2. Related Work

[TODO: ~600字]

### 2.1 LLM-based Educational Systems
- 现有工作：Khanmigo (Khan Academy)、Socratic (Google)
- 局限：不针对中国高考、无跨对话记忆

### 2.2 Multi-Agent Frameworks
- 代表工作：AutoGPT、MetaGPT、OpenClaw
- 本文如何借鉴：使用 OpenClaw 的 Skills 体系和工具调用能力

### 2.3 Personalized Learning Systems
- 代表工作：知识追踪（Knowledge Tracing）、间隔重复（Spaced Repetition）
- 本文简化版：基于错题频率的薄弱点识别

---

## 3. System Design

### 3.1 Architecture Overview

```
Student Input (via OpenClaw interface)
          ↓
  [Dispatcher Agent]
  Subject: math|chinese|science|english|general
  QueryType: solve|concept|review|plan
          ↓
  [Subject Agent Pool]
  - Math Agent (Socratic guidance, exam-point annotation)
  - Chinese Agent (literary analysis, writing strategy)
  - Science Agent (Physics/Chemistry/Biology, formula derivation)
  - English Agent (grammar explanation, essay feedback)
          ↓
  [Memory Module]
  mistakes.json + profile.json (local persistence)
          ↓
  Personalized Response to Student
```

### 3.2 Dispatcher Agent

调度 Agent 使用单次 LLM 调用分类用户输入，输出结构化 JSON：
```json
{"subject": "math", "queryType": "solve"}
```

设计决策：
- 单独调用调度而非在 system prompt 中隐式路由，保证透明度和可测试性
- 提供 fallback 默认值（general/concept）确保鲁棒性

### 3.3 Subject-Specialized Agents

各科 Agent 的核心差异化策略：

| Agent | 核心策略 | 教学特点 |
|-------|---------|---------|
| Math | 苏格拉底式引导 | 不直接给答案，逐步提示，标注考点 |
| Chinese | 层次化分析 | 字→意象→主旨，规范答题格式 |
| Science | 过程强制规范 | 受力图、配平、单位，不跳步骤 |
| English | 三维批改 | 内容/语言/结构，中文解释+英文例句 |

### 3.4 Memory Module

本地 JSON 持久化设计：
- `mistakes.json`：记录每次错题（学科、考点、错误类型）
- `profile.json`：统计薄弱点（同一考点出现≥3次则标记）
- 每次对话时将 profile 注入 system prompt，实现个性化

---

## 4. Implementation

### 4.1 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Agent Framework | OpenClaw | Open-source, Skills system, multi-platform |
| LLM Backend | DeepSeek API | Cost-effective (~¥1/1M tokens), China-accessible |
| Tool Use | OpenClaw MCP | Web search, file I/O |
| Persistence | Local JSON | Zero cost, zero server, student-controlled data |
| Language | JavaScript (Node.js) | OpenClaw native support |

### 4.2 OpenClaw Skill Integration

[描述 skill.md 格式和加载机制]

### 4.3 Deployment

```bash
git clone https://github.com/crcnini/gaokao-agent
# Configure DeepSeek API key in OpenClaw
# Load skill.md as OpenClaw Skill
```

---

## 5. Evaluation

### 5.1 Dispatcher Routing Accuracy

**Setup:** 50 test cases (手动标注，各学科均匀分布)
**Metric:** Exact match on (subject, queryType)
**Baseline:** Random routing (20% accuracy)

[TODO: 配置真实 API Key 后运行 eval/eval.js，填入结果表格]

| Subject | N | Correct | Accuracy |
|---------|---|---------|---------|
| Math | 10 | TBD | TBD% |
| Chinese | 10 | TBD | TBD% |
| Science | 10 | TBD | TBD% |
| English | 10 | TBD | TBD% |
| General | 10 | TBD | TBD% |
| **Total** | **50** | **TBD** | **TBD%** |

### 5.2 User Study

**Participants:** N=TBD 高中生（同班同学招募）
**Duration:** 2 weeks
**Condition A:** GaoKao-Agent
**Condition B:** 直接使用 DeepSeek/ChatGPT（baseline）

**Measures:**
1. 每周使用频率
2. 回复质量主观评分（1-5分李克特量表）
3. 最常使用学科
4. 与基线相比的感知改进

[TODO: 填入问卷结果]

---

## 6. Discussion

### 6.1 Limitations

1. **Prompt 质量依赖人工**：各科 Agent prompt 需要领域专家持续更新
2. **无自动评估回复质量**：目前只评估路由准确率，未评估教学效果
3. **记忆模块简单**：基于频率的薄弱点识别优于无记忆，但不如知识追踪模型

### 6.2 Future Work

1. 扩展测试题库至 200+ 条（覆盖更多边界情况）
2. 加入图片输入支持（手写题目识别）
3. 引入知识图谱结构化考点关系
4. 开发移动端界面

---

## 7. Conclusion

本文提出 GaoKao-Agent，一个基于 OpenClaw 框架的开源多 Agent 高考备考系统。
通过调度 Agent 实现学科自动路由，通过专项 Agent 提供差异化教学策略，
通过本地记忆模块实现跨对话个性化。系统已开源，附完整评估脚本。

---

## References

[TODO: 15-20篇，建议包含以下方向]

1. OpenAI. (2023). GPT-4 Technical Report.
2. Wei, J., et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in LLMs.
3. Park, J.S., et al. (2023). Generative Agents: Interactive Simulacra of Human Behavior.
4. Hong, S., et al. (2023). MetaGPT: Meta Programming for Multi-Agent Collaborative Framework.
5. Nye, M., et al. (2021). Show Your Work: Scratchpads for Intermediate Computation.
6. [OpenClaw GitHub] Steinberger, P. (2025). OpenClaw: Open-source Personal AI Agent.
7. [高考相关] 教育部. (2024). 普通高中课程方案和课程标准（2017年版2020年修订）.
[更多文献待补充]
