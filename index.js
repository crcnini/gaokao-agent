const { dispatch } = require('./dispatcher');
const { getProfileSummary } = require('./tools/memory');
const fs = require('fs');
const path = require('path');

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

function buildSystemPrompt(subject) {
  const agentPrompt = loadAgentPrompt(subject);
  const profileSummary = getProfileSummary();
  return `${agentPrompt}\n\n---\n【学生当前状态】\n${profileSummary}\n\n请根据以上信息，给出个性化的回答。`;
}

async function handleMessage(userInput, apiCall) {
  const { subject, queryType } = await dispatch(userInput, apiCall);
  console.log(`[调度] 学科: ${subject}, 问题类型: ${queryType}`);
  const systemPrompt = buildSystemPrompt(subject);
  const response = await apiCall(systemPrompt, userInput);
  return { subject, queryType, response };
}

module.exports = { handleMessage, buildSystemPrompt };
