#!/usr/bin/env node
/**
 * gaokao-agent CLI
 * 用法：node cli.js "<用户问题>"
 * 支持多轮对话：session 自动保存在 memory/session.json，30 分钟无活动自动清空
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { handleMessage } = require('./index');
const { apiCall } = require('./tools/api');
const { loadSession, saveSession } = require('./tools/session');

const question = process.argv[2];

if (!question) {
  console.error('用法: node cli.js "<用户问题>"');
  process.exit(1);
}

if (!process.env.MINIMAX_API_KEY) {
  console.error('错误: 未设置 MINIMAX_API_KEY');
  process.exit(1);
}

(async () => {
  // 加载历史（30 分钟内的对话）
  const session = loadSession();

  const { subject, queryType, response } = await handleMessage(
    question,
    apiCall,
    session.messages
  );

  // 去除 <think>...</think> 推理块
  const clean = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // 保存本轮到 session
  const updatedMessages = [
    ...session.messages,
    { role: 'user', content: question },
    { role: 'assistant', content: clean },
  ];
  saveSession(updatedMessages, subject);

  process.stdout.write(clean + '\n');
})().catch(err => {
  console.error('错误:', err.message);
  process.exit(1);
});
