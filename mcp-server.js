const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const { handleMessage } = require('./index');
const { addMistake, getPendingMistakes, getProfileSummary, updateWeakTopics } = require('./tools/memory');
const { apiCall } = require('./tools/api');
const { loadSession, saveSession } = require('./tools/session');
const { detectMistake } = require('./tools/detector');

const server = new Server(
  { name: 'gaokao-agent', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'ask_gaokao',
      description: '向浙江高考 AI 助手提问。自动识别学科（数学/语文/物理/化学/生物/历史/地理/政治/技术/英语），给出针对浙江考纲的专项回答。',
      inputSchema: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: '学生的问题，例如"这道导数题怎么解"或"英语翻译题有什么技巧"'
          }
        },
        required: ['question']
      }
    },
    {
      name: 'record_mistake',
      description: '记录一道错题，用于积累薄弱点画像，下次复习时自动提醒。',
      inputSchema: {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
            description: '学科：math/chinese/physics/chemistry/biology/history/geography/politics/technology/english'
          },
          topic: {
            type: 'string',
            description: '考点，例如"导数极值"、"有机推断"、"遗传概率"'
          },
          question: {
            type: 'string',
            description: '题目内容（可以是题目截图描述或原文）'
          },
          error_type: {
            type: 'string',
            description: '错误类型，例如"概念混淆"、"计算失误"、"审题错误"、"方法不熟"'
          }
        },
        required: ['subject', 'topic', 'question', 'error_type']
      }
    },
    {
      name: 'get_profile',
      description: '查看当前学生的薄弱点画像，了解哪些科目/考点错误次数最多，用于制定复习计划。',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_pending_mistakes',
      description: '获取某学科未复习的错题列表，用于错题回顾。',
      inputSchema: {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
            description: '学科：math/chinese/physics/chemistry/biology/history/geography/politics/technology/english'
          }
        },
        required: ['subject']
      }
    }
  ]
}));

// 工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'ask_gaokao') {
      const session = loadSession();
      const isContinuation = session.messages.length > 0;
      const { subject, response } = await handleMessage(args.question, apiCall, session.messages);
      const clean = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      const display = clean.replace(/\n?\[MISTAKE:[^\]]+\]/, '').trim();
      saveSession([...session.messages, { role: 'user', content: args.question }, { role: 'assistant', content: display }], subject);
      // 续轮时异步检测错误（不阻塞 MCP 响应）
      if (isContinuation) {
        detectMistake(args.question, subject, apiCall).then(result => {
          if (result) {
            addMistake(subject, result.topic, args.question.slice(0, 100), result.errorType);
            updateWeakTopics(subject, result.topic);
          }
        }).catch(() => {});
      }
      return {
        content: [{ type: 'text', text: display }]
      };
    }

    if (name === 'record_mistake') {
      const mistake = addMistake(args.subject, args.topic, args.question, args.error_type);
      return {
        content: [
          {
            type: 'text',
            text: `✅ 已记录错题 #${mistake.id}\n科目：${args.subject}\n考点：${args.topic}\n错误类型：${args.error_type}`
          }
        ]
      };
    }

    if (name === 'get_profile') {
      const summary = getProfileSummary();
      return {
        content: [{ type: 'text', text: summary }]
      };
    }

    if (name === 'get_pending_mistakes') {
      const mistakes = getPendingMistakes(args.subject);
      if (mistakes.length === 0) {
        return {
          content: [{ type: 'text', text: `${args.subject} 暂无未复习的错题` }]
        };
      }
      const list = mistakes.map(m =>
        `#${m.id} [${m.date}] ${m.topic}（${m.error_type}）\n  ${m.question.slice(0, 60)}...`
      ).join('\n\n');
      return {
        content: [{ type: 'text', text: `${args.subject} 待复习错题（${mistakes.length} 道）：\n\n${list}` }]
      };
    }

    throw new Error(`未知工具：${name}`);
  } catch (err) {
    return {
      content: [{ type: 'text', text: `❌ 出错了：${err.message}` }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
