# GaoKao-Agent 系统设计文档

**日期**：2026-03-02
**作者**：待填写
**状态**：已批准，待实现

---

## 1. 项目概述

### 1.1 背景

现有 AI 学习工具（ChatGPT、文心一言等）对高中生的使用场景缺乏针对性：
- 不了解高考考纲和高频考点
- 无法记忆学生的薄弱点，每次对话从零开始
- 缺乏"引导思考"而非"直接给答案"的教学策略
- 多学科问题需要用户自行切换工具

### 1.2 目标

构建一个基于 OpenClaw 框架的多 Agent 高考备考系统，实现：
- 自动识别学科并路由到专项 Agent
- 记录错题和薄弱知识点，跨对话持久化
- 各科采用差异化的教学策略（数学引导推导、语文分析意境等）
- 通过 OpenClaw 支持飞书/钉钉/命令行多入口

---

## 2. 系统架构

### 2.1 整体架构图

```
学生输入（飞书 / 钉钉 / CLI）
         ↓
  ┌─────────────────┐
  │   调度 Agent    │  ← 分析学科 + 问题类型
  └────────┬────────┘
           ↓
  ┌────────────────────────────────┐
  │         专项 Agent 池           │
  │  数学Agent  │  语文Agent        │
  │  理综Agent  │  英语Agent        │
  │  通用学习Agent                  │
  └────────┬───────────────────────┘
           ↓
  ┌─────────────────┐
  │   记忆模块      │  ← 读写本地 JSON
  │ mistakes.json   │
  │ profile.json    │
  └─────────────────┘
           ↓
     回复学生 + 更新记录
```

### 2.2 组件说明

| 组件 | 职责 |
|------|------|
| 调度 Agent | 解析用户输入，判断学科（数学/语文/理综/英语）和问题类型（解题/知识点查询/错题回顾） |
| 数学 Agent | 引导式解题辅导，不直接给答案，标注高考考点和频率 |
| 语文 Agent | 古诗文解析、作文思路引导、阅读理解分析 |
| 理综 Agent | 物理/化学/生物，强调公式推导和实验逻辑 |
| 英语 Agent | 语法分析、作文批改、长阅读技巧 |
| 通用学习 Agent | 学习规划、跨学科问题、薄弱点总结报告 |
| 记忆模块 | 持久化存储错题记录和学生薄弱点画像 |

---

## 3. 数据模型

### 3.1 错题记录（mistakes.json）

```json
{
  "mistakes": [
    {
      "id": "001",
      "date": "2026-03-02",
      "subject": "math",
      "topic": "三角函数",
      "question": "题目内容...",
      "error_type": "计算错误",
      "reviewed": false
    }
  ]
}
```

### 3.2 学生画像（profile.json）

```json
{
  "weak_topics": {
    "math": ["三角函数", "数列"],
    "chinese": ["文言文翻译"],
    "english": ["长难句分析"]
  },
  "total_sessions": 12,
  "last_active": "2026-03-02"
}
```

---

## 4. 技术栈

| 层次 | 技术选型 | 理由 |
|------|---------|------|
| Agent 框架 | OpenClaw | 开源、支持 Skills、多平台接入 |
| 主模型 | DeepSeek API | 国内稳定、成本极低（约 ¥1/百万 token） |
| 工具调用 | OpenClaw 内置 MCP | 网页搜索、文件读写 |
| 持久化 | 本地 JSON 文件 | 零成本、零部署、学生自己控制数据 |
| 语言 | JavaScript（Node.js） | OpenClaw 原生支持 |
| 开源托管 | GitHub | README + 论文文档 |

---

## 5. 项目文件结构

```
gaokao-agent/
├── skill.md                  ← OpenClaw Skill 入口
├── dispatcher.js             ← 调度 Agent 核心逻辑
├── agents/
│   ├── math.md               ← 数学 Agent system prompt
│   ├── chinese.md            ← 语文 Agent system prompt
│   ├── science.md            ← 理综 Agent system prompt
│   └── english.md            ← 英语 Agent system prompt
├── memory/
│   ├── mistakes.json         ← 错题记录（初始为空）
│   └── profile.json          ← 学生画像（初始为空）
├── tools/
│   └── memory.js             ← 读写记忆模块的工具函数
├── eval/
│   ├── test_cases.json       ← 50道测试题（各科均有）
│   └── eval.js               ← 自动评估调度准确率
├── docs/
│   ├── plans/
│   │   └── 2026-03-02-gaokao-agent-design.md  ← 本文档
│   └── paper/
│       └── draft.md          ← arXiv 论文草稿
└── README.md                 ← 开源文档 + 使用说明
```

---

## 6. 评估方案

### 6.1 自动评估（调度准确率）

- 准备 50 道测试题，涵盖数学、语文、理综、英语
- 运行 `eval/eval.js`，统计调度 Agent 路由正确率
- 目标：正确率 ≥ 90%

### 6.2 用户研究（User Study）

- 招募 5-10 名同学试用 1-2 周
- 收集指标：
  - 使用频率（次/周）
  - 主观评分：回复质量（1-5分）
  - 对比基线（直接问 ChatGPT/DeepSeek）
  - 最有用的学科
- 工具：简单问卷（腾讯问卷 5 题）

---

## 7. 论文结构

```
标题：GaoKao-Agent: A Multi-Agent System for Chinese High School
      Exam Preparation Using LLM Tool Use

1. Introduction        （约800字）
   - 高中生 AI 学习工具现状
   - 现有工具的三个核心不足
   - 本文贡献

2. Related Work        （约600字）
   - LLM Agents 综述
   - 教育类 AI 系统

3. System Design       （约1200字）
   - 架构图 + 组件说明
   - 调度策略设计
   - 各科 Agent 教学策略差异

4. Implementation      （约800字）
   - OpenClaw Skill 实现
   - 记忆模块设计
   - 部署方式

5. Evaluation          （约1000字）
   - 调度准确率实验结果
   - 用户研究结果（表格 + 分析）

6. Conclusion          （约400字）
   - 贡献总结
   - 局限性
   - 未来工作

参考文献：约15-20篇
```

**总字数**：约 4800 字（英文），适合 arXiv cs.AI 投稿

---

## 8. 里程碑

| 阶段 | 目标 | 预计用时 |
|------|------|---------|
| Phase 1 | 调度 Agent + 1个专项 Agent（数学）可运行 | 1周 |
| Phase 2 | 全部 4 个专项 Agent + 记忆模块完成 | 2周 |
| Phase 3 | 评估脚本 + 用户研究 | 1-2周 |
| Phase 4 | 论文初稿 + GitHub README | 1周 |
| **总计** | **MVP 到 arXiv 提交** | **约 5-6 周** |
