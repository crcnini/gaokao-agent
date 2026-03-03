#!/usr/bin/env node
/**
 * 学习报告生成器
 * 用法：node report.js
 */

const fs = require('fs');
const path = require('path');

const MISTAKES_PATH = path.join(__dirname, 'memory/mistakes.json');
const PROFILE_PATH = path.join(__dirname, 'memory/profile.json');

const SUBJECT_ZH = {
  math: '数学', chinese: '语文', english: '英语', physics: '物理',
  chemistry: '化学', biology: '生物', history: '历史',
  geography: '地理', politics: '政治', technology: '技术'
};

const ERROR_TYPE_ZH = {
  '概念混淆': '🔵', '计算失误': '🔴', '审题错误': '🟡', '方法不熟': '🟣'
};

function print() {
  const mistakesData = JSON.parse(fs.readFileSync(MISTAKES_PATH, 'utf-8'));
  const profile = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'));
  const mistakes = mistakesData.mistakes;

  const today = new Date().toISOString().slice(0, 10);
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  📊 浙江高考学习报告  ${today}`);
  console.log(`${'═'.repeat(50)}\n`);

  if (mistakes.length === 0) {
    console.log('暂无错题记录。开始答题后系统会自动积累。\n');
    return;
  }

  // 总览
  const pending = mistakes.filter(m => !m.reviewed).length;
  console.log(`错题总数：${mistakes.length}  待复习：${pending}  已复习：${mistakes.length - pending}\n`);

  // 各科分布
  const bySubject = {};
  for (const m of mistakes) {
    if (!bySubject[m.subject]) bySubject[m.subject] = [];
    bySubject[m.subject].push(m);
  }

  console.log('── 各科错题分布 ──');
  for (const [subj, list] of Object.entries(bySubject).sort((a, b) => b[1].length - a[1].length)) {
    const name = SUBJECT_ZH[subj] || subj;
    const bar = '█'.repeat(list.length);
    console.log(`  ${name.padEnd(4)} ${bar} ${list.length}题`);
  }

  // 错误类型分布
  console.log('\n── 错误类型分析 ──');
  const byType = {};
  for (const m of mistakes) {
    byType[m.error_type] = (byType[m.error_type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    const icon = ERROR_TYPE_ZH[type] || '⚪';
    console.log(`  ${icon} ${type}：${count} 次`);
  }

  // 高频错题考点
  console.log('\n── 高频错题考点（出错≥2次）──');
  const topicCount = {};
  for (const m of mistakes) {
    const key = `${m.subject}|${m.topic}`;
    topicCount[key] = (topicCount[key] || 0) + 1;
  }
  const hotTopics = Object.entries(topicCount)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1]);

  if (hotTopics.length === 0) {
    console.log('  暂无高频错点（需积累更多错题）');
  } else {
    for (const [key, count] of hotTopics) {
      const [subj, topic] = key.split('|');
      const name = SUBJECT_ZH[subj] || subj;
      const star = count >= 3 ? ' ⚠️ 已标记弱点' : '';
      console.log(`  ${name} > ${topic}：${count} 次${star}`);
    }
  }

  // 薄弱点画像
  const weakTopics = Object.entries(profile.weak_topics)
    .flatMap(([subj, topics]) => topics.map(t => `${SUBJECT_ZH[subj] || subj} > ${t}`));

  console.log('\n── 薄弱点画像（出错≥3次自动标记）──');
  if (weakTopics.length === 0) {
    console.log('  暂无（继续积累错题后自动生成）');
  } else {
    for (const w of weakTopics) console.log(`  ⚠️  ${w}`);
  }

  // 最近 5 道错题
  console.log('\n── 最近错题 ──');
  const recent = [...mistakes].reverse().slice(0, 5);
  for (const m of recent) {
    const name = SUBJECT_ZH[m.subject] || m.subject;
    const icon = ERROR_TYPE_ZH[m.error_type] || '⚪';
    console.log(`  [${m.date}] ${name} > ${m.topic}  ${icon}${m.error_type}`);
    console.log(`    "${m.question.slice(0, 50)}${m.question.length > 50 ? '...' : ''}"`);
  }

  console.log(`\n${'═'.repeat(50)}\n`);
}

if (require.main === module) {
  try { print(); } catch (e) { console.error('读取数据失败:', e.message); }
}

module.exports = { print };
