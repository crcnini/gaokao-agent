const fs = require('fs');
const path = require('path');

const SESSION_PATH = path.join(__dirname, '../memory/session.json');
const TIMEOUT_MS = 30 * 60 * 1000; // 30 分钟无活动 → 新话题
const MAX_HISTORY = 10;             // 最多保留 5 轮（10 条消息）

function loadSession() {
  try {
    const data = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf-8'));
    const idle = Date.now() - new Date(data.lastActivity).getTime();
    if (idle > TIMEOUT_MS) return emptySession();
    return data;
  } catch {
    return emptySession();
  }
}

function saveSession(messages, subject) {
  const trimmed = messages.slice(-MAX_HISTORY); // 只保留最近 N 条
  fs.writeFileSync(SESSION_PATH, JSON.stringify({
    messages: trimmed,
    subject,
    lastActivity: new Date().toISOString(),
  }, null, 2), 'utf-8');
}

function clearSession() {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(emptySession(), null, 2), 'utf-8');
}

function emptySession() {
  return { messages: [], subject: null, lastActivity: new Date().toISOString() };
}

module.exports = { loadSession, saveSession, clearSession };
