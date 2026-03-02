const DISPATCH_PROMPT = `你是一个高中学习助手的调度系统。
分析用户输入，返回 JSON 格式：
{"subject": "math|chinese|science|english|general", "queryType": "solve|concept|review|plan"}

学科判断规则：
- math: 含有数学符号、方程、函数、几何、概率等
- chinese: 古诗词、文言文、作文、阅读理解（中文文学类）
- science: 物理、化学、生物、力学、化学方程式、细胞
- english: 英语语法、英语作文、英文阅读、单词
- general: 学习规划、薄弱点分析、跨学科或不明确

问题类型判断：
- solve: 用户要解一道题
- concept: 用户要理解某个知识点
- review: 用户要复习错题或薄弱点
- plan: 用户要制定学习计划

只输出 JSON，不要其他内容。`;

async function dispatch(userInput, apiCall) {
  const response = await apiCall(DISPATCH_PROMPT, userInput);
  // 去除 <think>...</think> 推理块（MiniMax M2.5 等推理模型会输出）
  const cleaned = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // 尝试从文本中提取 JSON 对象
    const match = cleaned.match(/\{[^}]+\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return { subject: 'general', queryType: 'concept' };
  }
}

module.exports = { dispatch, DISPATCH_PROMPT };
