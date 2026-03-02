#!/usr/bin/env node
/**
 * gaokao-agent CLI
 *
 * 两种用法：
 *   node cli.js "<问题>"        单轮（供 OpenClaw skill 调用）
 *   node cli.js               交互式 REPL，支持多轮对话
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { handleMessage } = require('./index');
const { apiCall } = require('./tools/api');
const { loadSession, saveSession, clearSession } = require('./tools/session');

if (!process.env.MINIMAX_API_KEY) {
  console.error('错误: 未设置 MINIMAX_API_KEY（检查 .env 文件）');
  process.exit(1);
}

// ── 单轮模式（OpenClaw 调用）────────────────────────────────────────────────
if (process.argv[2]) {
  const question = process.argv[2];
  (async () => {
    const session = loadSession();
    const { subject, queryType, response } = await handleMessage(question, apiCall, session.messages);
    const clean = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    saveSession([...session.messages, { role: 'user', content: question }, { role: 'assistant', content: clean }], subject);
    process.stdout.write(clean + '\n');
  })().catch(err => { console.error('错误:', err.message); process.exit(1); });
  return;
}

// ── 交互式 REPL 模式 ─────────────────────────────────────────────────────────
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('🎓 浙江高考辅导助手');
console.log('   直接输入问题开始对话');
console.log('   输入 /clear 清空对话记录（换话题）');
console.log('   输入 /exit 或 Ctrl+C 退出\n');

function ask() {
  rl.question('你：', async (input) => {
    const text = input.trim();
    if (!text) { ask(); return; }

    if (text === '/exit' || text === 'exit') {
      console.log('\n再见，好好备考！👋');
      rl.close();
      return;
    }

    if (text === '/clear') {
      clearSession();
      console.log('✅ 对话记录已清空，开始新话题\n');
      ask();
      return;
    }

    try {
      const session = loadSession();
      const { subject, queryType, response } = await handleMessage(text, apiCall, session.messages);
      const clean = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      saveSession([...session.messages, { role: 'user', content: text }, { role: 'assistant', content: clean }], subject);
      console.log(`\n助手：${clean}\n`);
    } catch (err) {
      console.error(`\n❌ 出错：${err.message}\n`);
    }

    ask();
  });
}

rl.on('close', () => process.exit(0));
ask();
