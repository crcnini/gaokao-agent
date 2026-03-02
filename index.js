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

const SOCRATIC_PROTOCOL = `
## 苏格拉底辅导协议（所有学科适用）

你是辅导老师，不是做题机器。遵守以下规则：

**解题类问题（solve）**：
- 先问："你做到哪一步卡住了？把你的思路说给我听。"
- 学生给出思路后：答对了就肯定并追问"为什么"；答错了引导而非直接纠正
- 连续两次仍不会，才给完整解法，但必须逐步解释每步的"为什么"
- 禁止：不问思路直接列出完整解答

**概念类问题（concept）**：
- 可以直接解释，但结尾必须出一道小题让学生验证理解
- 例："你现在理解了吗？试着用这个概念解释一下……"

**复习/薄弱点类问题（review）**：
- 先出一道相关题让学生作答，根据作答情况再针对性讲解
- 指出错误模式："你这道和之前的错误类型一样，问题出在……"

**计划类问题（plan）**：
- 先了解现状（距考试时间、各科分数、每天可用时间），再给计划
`;

const SOLVE_HARD_STOP = `⚠️ 绝对规则（最高优先级，不得违反）：
当前问题类型是【解题题（solve）】。
你的第一句话必须是：「你做到哪一步卡住了？先把你的思路说给我听。」
在学生给出思路之前，禁止输出任何解题步骤、答案、或提示解法的内容。
违反此规则 = 直接失败。`;

function buildSystemPrompt(subject, queryType) {
  const agentPrompt = loadAgentPrompt(subject);
  const profileSummary = getProfileSummary();
  const prefix = queryType === 'solve' ? `${SOLVE_HARD_STOP}\n\n` : '';
  return `${prefix}${agentPrompt}\n\n---\n${SOCRATIC_PROTOCOL}\n---\n【学生当前状态】\n${profileSummary}\n\n请根据以上信息，用苏格拉底式辅导方式回答。`;
}

async function handleMessage(userInput, apiCall) {
  const { subject, queryType } = await dispatch(userInput, apiCall);
  console.log(`[调度] 学科: ${subject}, 问题类型: ${queryType}`);

  // solve 类问题：第一轮固定返回苏格拉底问句，不依赖模型自觉
  if (queryType === 'solve') {
    const socraticlQuestion = '你做到哪一步卡住了？先把你的思路说给我听。\n\n（把你写的过程发给我，我来帮你找问题所在。）';
    return { subject, queryType, response: socraticlQuestion };
  }

  const systemPrompt = buildSystemPrompt(subject, queryType);
  const response = await apiCall(systemPrompt, userInput);
  return { subject, queryType, response };
}

module.exports = { handleMessage, buildSystemPrompt };
