const { dispatch } = require('../dispatcher');
const { apiCall } = require('../tools/api');
const testCases = require('./test_cases.json');

async function runEval() {
  if (!process.env.MINIMAX_API_KEY) {
    console.error('❌ 请先设置环境变量：export MINIMAX_API_KEY=your_key');
    process.exit(1);
  }

  console.log(`\n开始评估，共 ${testCases.length} 道测试题...\n`);
  let correct = 0;
  const results = [];

  for (const tc of testCases) {
    process.stdout.write(`  测试: "${tc.input.slice(0, 20)}..." `);
    const result = await dispatch(tc.input, apiCall);
    const subjectOk = result.subject === tc.expected_subject;
    const typeOk = result.queryType === tc.expected_type;
    if (subjectOk && typeOk) correct++;
    results.push({
      input: tc.input,
      expected: `${tc.expected_subject}/${tc.expected_type}`,
      got: `${result.subject}/${result.queryType}`,
      pass: subjectOk && typeOk
    });
    console.log(subjectOk && typeOk ? '✓' : '✗');
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`调度准确率: ${correct}/${testCases.length} (${(correct / testCases.length * 100).toFixed(1)}%)`);
  console.log('='.repeat(50));

  const failed = results.filter(r => !r.pass);
  if (failed.length > 0) {
    console.log('\n❌ 未通过的用例：');
    failed.forEach(r => {
      console.log(`  期望: ${r.expected}  实际: ${r.got}`);
      console.log(`  输入: "${r.input}"`);
    });
  }
}

runEval().catch(console.error);
