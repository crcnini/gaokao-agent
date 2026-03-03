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
const { addMistake, updateWeakTopics } = require('./tools/memory');
const { detectMistake } = require('./tools/detector');

if (!process.env.MINIMAX_API_KEY) {
  console.error('错误: 未设置 MINIMAX_API_KEY（检查 .env 文件）');
  process.exit(1);
}

/**
 * 解析并剥除模型嵌入的 [MISTAKE:{...}] 标记，同时静默记录错题
 * @returns 干净的显示文本
 */
function processResponse(raw, subject, question) {
  const clean = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const match = clean.match(/\[MISTAKE:(\{[^}]+\})\]/);
  if (!match) return clean;
  try {
    const { topic, errorType } = JSON.parse(match[1]);
    addMistake(subject, topic, question.slice(0, 100), errorType);
    updateWeakTopics(subject, topic);
    process.stderr.write(`[错题已记录] ${subject} > ${topic}（${errorType}）\n`);
  } catch {}
  return clean.replace(/\n?\[MISTAKE:[^\]]+\]/, '').trim();
}

// ── 单轮模式（OpenClaw 调用）────────────────────────────────────────────────
if (process.argv[2]) {
  const question = process.argv[2];
  (async () => {
    const session = loadSession();
    const isContinuation = session.messages.length > 0;
    const { subject, response } = await handleMessage(question, apiCall, session.messages);
    const display = processResponse(response, subject, question);
    saveSession(
      [...session.messages, { role: 'user', content: question }, { role: 'assistant', content: display }],
      subject
    );
    process.stdout.write(display + '\n');
    // 续轮时用独立检测器自动记录错题（在进程退出前 await）
    if (isContinuation) {
      const result = await detectMistake(question, subject, apiCall).catch(() => null);
      if (result) {
        addMistake(subject, result.topic, question.slice(0, 100), result.errorType);
        updateWeakTopics(subject, result.topic);
      }
    }
  })().catch(err => { console.error('错误:', err.message); process.exit(1); });
  return;
}

// ── 交互式 REPL 模式 ─────────────────────────────────────────────────────────
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('🎓 浙江高考辅导助手');
console.log('   直接输入问题开始对话');
console.log('   输入 /clear 清空对话记录（换话题）');
console.log('   输入 /report 查看学习报告');
console.log('   输入 /exit 或 Ctrl+C 退出\n');

function ask() {
  rl.question('你：', async (input) => {
    const text = input.trim();
    if (!text) { ask(); return; }

    if (text === '/exit' || text === 'exit') {
      console.log('\n再见，好好备考！');
      rl.close();
      return;
    }

    if (text === '/clear') {
      clearSession();
      console.log('✅ 对话记录已清空，开始新话题\n');
      ask();
      return;
    }

    if (text === '/report') {
      try { require('./report').print(); } catch { console.log('运行 node report.js 查看报告\n'); }
      ask();
      return;
    }

    try {
      const session = loadSession();
      const isContinuation = session.messages.length > 0;
      const { subject, response } = await handleMessage(text, apiCall, session.messages);
      const display = processResponse(response, subject, text);
      saveSession(
        [...session.messages, { role: 'user', content: text }, { role: 'assistant', content: display }],
        subject
      );
      console.log(`\n助手：${display}\n`);
      // 续轮时异步检测错误（不阻塞对话流）
      if (isContinuation) {
        detectMistake(text, subject, apiCall).then(result => {
          if (result) {
            addMistake(subject, result.topic, text.slice(0, 100), result.errorType);
            updateWeakTopics(subject, result.topic);
            process.stderr.write(`[错题自动记录] ${subject} > ${result.topic}（${result.errorType}）\n`);
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.error(`\n❌ 出错：${err.message}\n`);
    }

    ask();
  });
}

rl.on('close', () => process.exit(0));
ask();
