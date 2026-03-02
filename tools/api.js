// MiniMax M2.5 API 适配器
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimaxi.com/v1',
});

/**
 * 标准 apiCall 函数，供 dispatcher 和 index.js 调用
 * @param {string} systemPrompt - system prompt
 * @param {string} userInput - 用户输入
 * @returns {Promise<string>} - 模型回复文本
 */
async function apiCall(systemPrompt, userInput) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userInput });

  const resp = await client.chat.completions.create({
    model: 'MiniMax-M2.5',
    messages,
  });

  return resp.choices[0].message.content;
}

/**
 * 多轮对话调用，传入完整 messages 数组（含历史）
 * @param {string} systemPrompt
 * @param {Array<{role:string, content:string}>} messages - 包含历史的完整消息列表
 */
async function apiCallWithHistory(systemPrompt, messages) {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];
  const resp = await client.chat.completions.create({
    model: 'MiniMax-M2.5',
    messages: allMessages,
  });
  return resp.choices[0].message.content;
}

module.exports = { apiCall, apiCallWithHistory };
