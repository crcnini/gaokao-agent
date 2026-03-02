const DISPATCH_PROMPT = `你是一个高中学习助手的调度系统（浙江选考）。
分析用户输入，返回 JSON 格式：
{"subject": "math|chinese|physics|chemistry|biology|history|geography|politics|technology|english|general", "queryType": "solve|concept|review|plan"}

学科判断规则：
- math: 数学符号、方程、函数、导数、几何、概率、数列等
- chinese: 古诗词、文言文、作文、语文阅读理解（中文文学类）
- physics: 力学、电磁、热学、光学、原子核、物理实验
- chemistry: 化学方程式、离子反应、有机物、元素周期表、化学实验
- biology: 细胞、遗传、进化、生态系统、光合作用、神经调节
- history: 中国史、世界史、朝代、战争、条约、历史人物
- geography: 地图、气候、地形、人口、城市、区域地理、经纬度
- politics: 哲学、经济学、政治学、时政、马克思主义、辩证法
- technology: Python、算法、程序、代码、通用技术、信息技术、设计、系统
- english: 英语语法、英语作文、英文阅读、英语翻译、单词
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
