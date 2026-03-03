/**
 * 错题自动检测器
 * 在学生给出回答后（续轮），快速判断是否暴露了知识点错误
 * 使用独立 API 调用，与辅导响应分离，确保可靠性
 */

const DETECTOR_PROMPT = `你是一个错题检测器，只做一件事：判断学生的回答是否包含明确的知识点错误。

规则：
- 只关注学生说出了明确错误的知识（如公式用错、概念混淆、错误推断）
- "不知道"、"没想到"、"不确定" 不算错误
- 只有学生明确说出了错误的内容才算

必须用 JSON 回复，格式如下：
如果有错误：{"hasMistake": true, "topic": "考点名称（不超过8字）", "errorType": "概念混淆|计算失误|审题错误|方法不熟"}
如果没有错误：{"hasMistake": false}

只返回 JSON，不要其他内容。`;

async function detectMistake(studentInput, subject, apiCall) {
  try {
    const raw = await apiCall(DETECTOR_PROMPT, `学科：${subject}\n学生的回答："${studentInput}"`);
    const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const result = JSON.parse(match[0]);
    return result.hasMistake ? result : null;
  } catch {
    return null; // 检测失败时静默跳过，不影响主流程
  }
}

module.exports = { detectMistake };
