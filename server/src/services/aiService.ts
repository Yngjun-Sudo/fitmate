import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { AppError, ErrorCode } from '../types';
import * as dietService from './dietService';

const prisma = new PrismaClient();

// === Function Calling 工具定义 ===

interface DeepSeekTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/** AI 可调用的工具列表 */
const TOOLS: DeepSeekTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_workout_plan',
      description:
        '为用户创建一份健身训练计划。当用户要求制定训练计划、增肌计划、减脂计划、或安排一周训练时调用。先和用户确认目标、频率、偏好后再调用。',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '计划名称，例如「新手增肌计划」「四周减脂计划」',
          },
          description: {
            type: 'string',
            description: '计划简介，说明目标、适用人群、注意事项',
          },
          exercises: {
            type: 'array',
            description: '训练动作列表',
            items: {
              type: 'object',
              properties: {
                exerciseName: {
                  type: 'string',
                  description: '动作名称，如「杠铃卧推」「深蹲」「跑步」',
                },
                dayOfWeek: {
                  type: 'integer',
                  description: '星期几训练，1=周一...7=周日',
                  minimum: 1,
                  maximum: 7,
                },
                sets: {
                  type: 'integer',
                  description: '组数',
                },
                reps: {
                  type: 'integer',
                  description: '每组次数',
                },
                durationSeconds: {
                  type: 'integer',
                  description: '持续时间（秒），有氧运动用',
                },
                restSeconds: {
                  type: 'integer',
                  description: '组间休息秒数，默认60',
                },
                notes: {
                  type: 'string',
                  description: '备注，如动作要点或替代方案',
                },
              },
              required: ['exerciseName', 'dayOfWeek', 'sets', 'reps'],
            },
          },
        },
        required: ['name', 'exercises'],
      },
    },
  },
];

/** 工具调用请求 */
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/** 工具执行结果 */
interface ToolResult {
  role: 'tool';
  tool_call_id: string;
  content: string;
}

/**
 * 执行工具调用
 */
async function executeToolCall(
  toolCall: ToolCall,
  userId: string,
): Promise<ToolResult> {
  const args = JSON.parse(toolCall.function.arguments || '{}');

  if (toolCall.function.name === 'create_workout_plan') {
    const { name, description, exercises } = args as {
      name: string;
      description?: string;
      exercises: {
        exerciseName: string;
        dayOfWeek: number;
        sets: number;
        reps: number;
        durationSeconds?: number;
        restSeconds?: number;
        notes?: string;
      }[];
    };

    // 解析动作名称 → ID（模糊匹配，找不到就创建）
    const planExercises = await Promise.all(
      exercises.map(async (ex, idx) => {
        let exercise = await prisma.exercise.findFirst({
          where: { name: { contains: ex.exerciseName, mode: 'insensitive' } },
        });

        if (!exercise) {
          exercise = await prisma.exercise.create({
            data: {
              name: ex.exerciseName,
              category: 'full_body',
              muscleGroup: 'general',
              difficulty: 'beginner',
            },
          });
        }

        return {
          exerciseId: exercise.id,
          dayOfWeek: ex.dayOfWeek,
          sets: ex.sets,
          reps: ex.reps,
          durationSeconds: ex.durationSeconds || 0,
          restSeconds: ex.restSeconds || 60,
          sortOrder: idx,
          notes: ex.notes || '',
        };
      }),
    );

    const plan = await prisma.workoutPlan.create({
      data: {
        userId,
        name,
        description: description || '',
        exercises: { create: planExercises },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }],
        },
      },
    });

    const summary = plan.exercises
      .map(
        (ex) =>
          `星期${['一','二','三','四','五','六','日'][ex.dayOfWeek - 1]}: ${ex.exercise.name} ${ex.sets}×${ex.reps}`,
      )
      .join('\n');

    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: `计划「${plan.name}」已创建成功！\n\n计划内容：\n${summary}\n\n用户可在「训练」页面查看和使用。`,
    };
  }

  return {
    role: 'tool',
    tool_call_id: toolCall.id,
    content: `未知工具: ${toolCall.function.name}`,
  };
}

// === DeepSeek API 封装 ===

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface DeepSeekStreamChunk {
  choices: {
    index: number;
    delta: {
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

/**
 * 调用 DeepSeek API（stream 模式），返回 ReadableStream
 */
export async function streamChat(messages: DeepSeekMessage[]): Promise<Response> {
  return callDeepSeek(messages, true);
}

/**
 * 调用 DeepSeek API（非 stream 模式），返回完整 JSON 响应
 */
async function callDeepSeekNonStream(messages: DeepSeekMessage[]): Promise<Record<string, unknown>> {
  const res = await callDeepSeek(messages, false);
  return res.json();
}

/**
 * 底层 DeepSeek API 调用
 */
async function callDeepSeek(messages: DeepSeekMessage[], stream: boolean): Promise<Response> {
  if (!config.deepseekApiKey) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, 'DeepSeek API Key 未配置');
  }

  const body: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages,
    stream,
    temperature: 0.7,
    max_tokens: 2000,
  };

  // 如果是非 streaming 请求，携带工具定义
  if (!stream) {
    body.tools = TOOLS;
    body.tool_choice = 'auto';
  }

  const response = await fetch(`${config.deepseekBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.deepseekApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new AppError(ErrorCode.INTERNAL_ERROR, `DeepSeek API 错误: ${response.status} ${errText}`);
  }

  return response;
}

/**
 * 处理用户消息（含工具调用回路）。
 * 返回最终可 stream 的消息列表（用户消息 + 历史 + AI 的工具调用 + 工具结果）。
 * 如果有工具调用，会在最后追加一轮 AI 的文字总结。
 */
export async function processToolCalls(
  messages: DeepSeekMessage[],
  userId: string,
): Promise<{
  messages: DeepSeekMessage[];
  toolResults: ToolResult[];
  hasToolCalls: boolean;
}> {
  const allToolResults: ToolResult[] = [];
  const maxIterations = 2;
  let hasToolCalls = false;

  for (let i = 0; i < maxIterations; i++) {
    const completion = await callDeepSeekNonStream(messages);
    const choice = (completion.choices as Array<Record<string, unknown>>)?.[0];
    const message = choice?.message as Record<string, unknown> | undefined;
    const toolCalls = message?.tool_calls as ToolCall[] | undefined;
    const content = message?.content as string | undefined;

    if (!toolCalls || toolCalls.length === 0) {
      // 没有工具调用 → 把 AI 的文本回复加入，返回
      if (content) {
        messages.push({ role: 'assistant', content } as DeepSeekMessage);
      }
      return { messages, toolResults: allToolResults, hasToolCalls };
    }

    // 有工具调用
    hasToolCalls = true;
    messages.push(message as unknown as DeepSeekMessage);

    // 执行工具
    for (const tc of toolCalls) {
      const result = await executeToolCall(tc, userId);
      allToolResults.push(result);
      messages.push({
        role: 'tool',
        tool_call_id: result.tool_call_id,
        content: result.content,
      } as DeepSeekMessage);
    }

    // 工具执行完后，再调一次 AI 获取文字总结
    const finalCompletion = await callDeepSeekNonStream(messages);
    const finalChoice = (finalCompletion.choices as Array<Record<string, unknown>>)?.[0];
    const finalContent = finalChoice?.message?.content as string | undefined;
    if (finalContent) {
      messages.push({ role: 'assistant', content: finalContent } as DeepSeekMessage);
    }
    return { messages, toolResults: allToolResults, hasToolCalls };
  }

  return { messages, toolResults: allToolResults, hasToolCalls };
}

// === 对话管理 ===

/**
 * 获取用户的对话会话列表
 */
export async function getSessions(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * 创建新对话会话
 */
export async function createSession(userId: string, title = '新对话') {
  return prisma.chatSession.create({
    data: { userId, title },
  });
}

/**
 * 获取会话的消息列表
 */
export async function getSessionMessages(sessionId: string) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * 保存消息
 */
export async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
  return prisma.chatMessage.create({
    data: { sessionId, role, content },
  });
}

/**
 * 更新会话标题（使用用户第一个问题的前20字）
 */
export async function updateSessionTitle(sessionId: string, title: string) {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { title: title.slice(0, 30) },
  });
}

// === 上下文构造 ===

/**
 * 构造系统 Prompt（注入用户身体数据 + 近7天训练/饮食摘要）
 */
export async function buildSystemPrompt(userId: string): Promise<string> {
  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      heightCm: true,
      weightKg: true,
      gender: true,
      goal: true,
      activityLevel: true,
    },
  });

  // 获取饮食摘要
  const dietSummary = await dietService.getRecentDietSummary(userId, 7);

  // 获取近7天训练摘要
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  fromDate.setHours(0, 0, 0, 0);

  const recentLogs = await prisma.workoutLog.findMany({
    where: {
      userId,
      date: { gte: fromDate },
    },
    include: {
      plan: { select: { name: true } },
      exercises: {
        include: {
          exercise: { select: { name: true } },
          sets: true,
        },
      },
    },
  });

  const trainingDays = recentLogs.map((l) => l.date.toISOString().split('T')[0]);
  const uniqueDays = [...new Set(trainingDays)];

  // 组装 prompt
  let prompt = `你是 FitMate 智能健身助手，一位专业且友好的健身教练。`;

  if (user) {
    prompt += `\n\n## 当前用户信息\n`;
    prompt += `- 姓名：${user.name}\n`;
    if (user.heightCm) prompt += `- 身高：${user.heightCm}cm\n`;
    if (user.weightKg) prompt += `- 体重：${user.weightKg}kg\n`;
    if (user.gender) prompt += `- 性别：${user.gender}\n`;
    if (user.goal) prompt += `- 健身目标：${user.goal}\n`;
    if (user.activityLevel) prompt += `- 活动水平：${user.activityLevel}\n`;
  }

  prompt += `\n## 近7天数据\n`;
  prompt += `- 训练天数：${uniqueDays.length}/7 天\n`;
  prompt += `- 饮食记录数：${dietSummary.recordCount} 条\n`;
  prompt += `- 日均摄入：约 ${dietSummary.avgCalories} kcal\n`;

  prompt += `\n请你基于以上数据，为用户提供个性化、专业、安全的健身和饮食建议。`;
  prompt += `\n回复要求：简洁有条理，使用中文，适当使用emoji增加亲和力。涉及具体训练建议时提醒用户注意安全。`;

  return prompt;
}

/**
 * 构造对话消息列表（system + 历史 + 新消息）
 */
export async function buildMessages(userId: string, sessionId: string, historyLimit = 10) {
  const systemPrompt = await buildSystemPrompt(userId);

  const history = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: historyLimit * 2, // user + assistant 各一轮算2条
  });

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of history) {
    messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
  }

  // 用户消息已在 chat.ts 中提前存入 DB，会被上面的 history 查询取出，
  // 无需再次 push，避免重复发送给 AI

  return messages;
}

/**
 * 自动生成会话标题
 */
export function generateSessionTitle(userMessage: string): string {
  return userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
}
