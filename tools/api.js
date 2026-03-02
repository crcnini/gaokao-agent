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

module.exports = { apiCall };
