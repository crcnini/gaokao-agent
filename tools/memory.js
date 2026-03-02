const fs = require('fs');
const path = require('path');

const MISTAKES_PATH = path.join(__dirname, '../memory/mistakes.json');
const PROFILE_PATH = path.join(__dirname, '../memory/profile.json');

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function addMistake(subject, topic, question, errorType) {
  const data = readJSON(MISTAKES_PATH);
  const newMistake = {
    id: String(data.mistakes.length + 1).padStart(3, '0'),
    date: new Date().toISOString().slice(0, 10),
    subject,
    topic,
    question,
    error_type: errorType,
    reviewed: false
  };
  data.mistakes.push(newMistake);
  writeJSON(MISTAKES_PATH, data);
  return newMistake;
}

function getPendingMistakes(subject) {
  const data = readJSON(MISTAKES_PATH);
  return data.mistakes.filter(m => m.subject === subject && !m.reviewed);
}

function updateWeakTopics(subject, topic) {
  const profile = readJSON(PROFILE_PATH);
  if (!profile.weak_topics[subject].includes(topic)) {
    const count = readJSON(MISTAKES_PATH).mistakes
      .filter(m => m.subject === subject && m.topic === topic).length;
    if (count >= 3) {
      profile.weak_topics[subject].push(topic);
      writeJSON(PROFILE_PATH, profile);
    }
  }
}

function getProfileSummary() {
  const profile = readJSON(PROFILE_PATH);
  const lines = [];
  for (const [subject, topics] of Object.entries(profile.weak_topics)) {
    if (topics.length > 0) {
      lines.push(`${subject}: ${topics.join('、')}`);
    }
  }
  return lines.length > 0
    ? `该学生薄弱点：\n${lines.join('\n')}`
    : '暂无薄弱点记录';
}

module.exports = { addMistake, getPendingMistakes, updateWeakTopics, getProfileSummary };
