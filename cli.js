#!/usr/bin/env node
/**
 * gaokao-agent CLI
 * 用法：node cli.js "<用户问题>"
 * 输出：苏格拉底式辅导回复（纯文本，已去除 <think> 块）
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { handleMessage } = require('./index');
const { apiCall } = require('./tools/api');

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
  const { subject, queryType, response } = await handleMessage(question, apiCall);
  // 去除 <think>...</think> 推理块
  const clean = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  process.stdout.write(clean + '\n');
})().catch(err => {
  console.error('错误:', err.message);
  process.exit(1);
});
