const { dispatch } = require('../dispatcher');
const testCases = require('./test_cases.json');

async function mockApiCall(systemPrompt, userInput) {
  // 真实调用时替换为 DeepSeek API：
  // const OpenAI = require('openai');
  // const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com' });
  // const resp = await client.chat.completions.create({
  //   model: 'deepseek-chat',
  //   messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userInput }]
  // });
  // return resp.choices[0].message.content;
  return '{"subject": "math", "queryType": "solve"}'; // placeholder
}

async function runEval() {
  let correct = 0;
  const results = [];
  for (const tc of testCases) {
    const result = await dispatch(tc.input, mockApiCall);
    const subjectOk = result.subject === tc.expected_subject;
    const typeOk = result.queryType === tc.expected_type;
    if (subjectOk && typeOk) correct++;
    results.push({
      input: tc.input,
      expected: `${tc.expected_subject}/${tc.expected_type}`,
      got: `${result.subject}/${result.queryType}`,
      pass: subjectOk && typeOk
    });
  }
  console.log(`\n调度准确率: ${correct}/${testCases.length} (${(correct/testCases.length*100).toFixed(1)}%)\n`);
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✗';
    console.log(`${icon} [${r.expected}] "${r.input.slice(0, 30)}..."`);
    if (!r.pass) console.log(`    → 实际: ${r.got}`);
  });
}

runEval().catch(console.error);
