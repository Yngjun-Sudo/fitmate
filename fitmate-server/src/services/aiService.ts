import { getDatabase } from '../db';
import {
  chatSessions,
  chatMessages,
  exercises,
  workoutPlans,
  workoutPlanExercises,
  workoutLogs,
  mealRecords,
  foodItems,
  users,
} from '../../d1/schema';
import { eq, asc, desc, like, sql, and, gte, lte } from 'drizzle-orm';
import type { Env, JwtPayload } from '../types';
import * as dietService from './dietService';

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
        '创建并保存训练计划到用户账户。必须在用户第一次提出计划需求时调用，不要先文字描述。缺失信息用合理默认值。',
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
  env: Env
): Promise<ToolResult> {
  try {
    const args = JSON.parse(toolCall.function.arguments || '{}');
    const db = getDatabase(env.DB);

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

      // 解析动作名称 → ID（精确匹配，trim 后比较；找不到则创建）
      const planExercises = await Promise.all(
        exercises.map(async (ex, idx) => {
          const cleanName = ex.exerciseName.trim();
          const existing = await db.select()
            .from(exercises)
            .where(like(exercises.name, `%${cleanName}%`))
            .limit(1);

          let exerciseId: string;

          if (existing.length > 0) {
            exerciseId = existing[0].id;
          } else {
            // 创建新动作
            const [newExercise] = await db.insert(exercises).values({
              id: crypto.randomUUID(),
              name: cleanName,
              description: '',
              category: 'full_body',
              muscleGroup: 'general',
              equipment: '',
              difficulty: 'beginner',
              instructions: '',
            }).returning();
            exerciseId = newExercise.id;
          }

          return {
            id: crypto.randomUUID(),
            planId: '', // 将在外层设置
            exerciseId,
            dayOfWeek: ex.dayOfWeek,
            sets: ex.sets,
            reps: ex.reps,
            durationSeconds: ex.durationSeconds || 0,
            restSeconds: ex.restSeconds || 60,
            sortOrder: idx,
            notes: ex.notes || '',
          };
        })
      );

      // 创建训练计划
      const [plan] = await db.insert(workoutPlans).values({
        id: crypto.randomUUID(),
        userId,
        name,
        description: description || '',
        isTemplate: 0,
      }).returning();

      // 创建计划动作
      const exercisesWithPlanId = planExercises.map(ex => ({
        ...ex,
        planId: plan.id,
      }));

      await db.insert(workoutPlanExercises).values(exercisesWithPlanId);

      // 获取完整计划信息
      const planWithExercises = await db.select({
        id: workoutPlanExercises.id,
        dayOfWeek: workoutPlanExercises.dayOfWeek,
        sets: workoutPlanExercises.sets,
        reps: workoutPlanExercises.reps,
        exerciseName: exercises.name,
      })
        .from(workoutPlanExercises)
        .leftJoin(exercises, eq(workoutPlanExercises.exerciseId, exercises.id))
        .where(eq(workoutPlanExercises.planId, plan.id))
        .orderBy(asc(workoutPlanExercises.dayOfWeek), asc(workoutPlanExercises.sortOrder));

      const summary = planWithExercises
        .map(
          (ex) =>
            `星期${['一','二','三','四','五','六','日'][ex.dayOfWeek - 1]}: ${ex.exerciseName} ${ex.sets}×${ex.reps}`
        )
        .join('\n');

      return {
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: `✅ 计划「${plan.name}」已创建成功！\n\n📋 计划内容：\n${summary}\n\n👉 前往「训练」页面查看和使用你的新计划！`,
      };
    }

    return {
      role: 'tool' as const,
      tool_call_id: toolCall.id,
      content: `未知工具: ${toolCall.function.name}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '工具执行失败';
    console.error('[ToolCall Error]', msg);
    return {
      role: 'tool' as const,
      tool_call_id: toolCall.id,
      content: `❌ 创建失败：${msg}`,
    };
  }
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
 * 调用 DeepSeek API（stream 模式），返回 Response
 */
export async function streamChat(messages: DeepSeekMessage[], env: Env): Promise<Response> {
  return callDeepSeek(messages, true, env);
}

/**
 * 调用 DeepSeek API（非 stream 模式），返回完整 JSON 响应
 */
async function callDeepSeekNonStream(messages: DeepSeekMessage[], env: Env): Promise<Record<string, unknown>> {
  const res = await callDeepSeek(messages, false, env);
  return res.json();
}

/**
 * 底层 DeepSeek API 调用
 */
async function callDeepSeek(messages: DeepSeekMessage[], stream: boolean, env: Env): Promise<Response> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key 未配置');
  }

  const body: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages,
    stream,
    temperature: 0.7,
    max_tokens: stream ? 2000 : 800,
  };

  // 如果是非 streaming 请求，携带工具定义
  if (!stream) {
    body.tools = TOOLS;
    body.tool_choice = 'auto';
  }

  const response = await fetch(`${env.DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`DeepSeek API 错误: ${response.status} ${errText}`);
  }

  return response;
}

/**
 * 判断用户消息是否包含计划需求关键词
 */
export function isPlanRequest(messages: DeepSeekMessage[]): boolean {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userText = lastUserMsg?.content || '';
  return /(?:训练|健身|增肌|减脂|塑形|运动|力量|体能).*(?:计划|方案|安排)|(?:帮我|给我|做个|搞个|制定|创建|生成|设计).*(?:计划|方案|安排)|(?:计划|方案|安排).*(?:训练|健身|增肌|减脂)/.test(userText);
}

/**
 * 处理用户消息（含工具调用回路）
 */
export async function processToolCalls(
  messages: DeepSeekMessage[],
  userId: string,
  env: Env
): Promise<{
  messages: DeepSeekMessage[];
  toolResults: ToolResult[];
  hasToolCalls: boolean;
}> {
  const allToolResults: ToolResult[] = [];
  let hasToolCalls = false;

  // 强制注入工具调用指令
  const toolMessages = [...messages];
  toolMessages.push({
    role: 'system' as const,
    content: '【系统指令】用户刚才要求制定训练计划。你必须立即调用 create_workout_plan 工具来创建计划。不要用文字描述计划内容。不要追问任何细节。直接调用工具，所有参数使用合理默认值：新手水平、每周3天、全身复合动作（深蹲、卧推、划船、推举、硬拉等），每组8-12次，每组休息60-90秒。调用后简单告知用户计划已保存。',
  });

  // 只做一轮 API 调用
  const completion = await callDeepSeekNonStream(toolMessages, env);
  const choice = (completion.choices as Array<Record<string, unknown>>)?.[0];
  const msg = choice?.message as Record<string, unknown> | undefined;
  const toolCalls = msg?.tool_calls as ToolCall[] | undefined;

  if (!toolCalls || toolCalls.length === 0) {
    const textContent = (msg?.content as string) || '';
    if (textContent) {
      messages.push({ role: 'assistant', content: textContent });
    }
    return { messages, toolResults: allToolResults, hasToolCalls };
  }

  hasToolCalls = true;
  const assistantMsg: DeepSeekMessage = {
    role: 'assistant',
    content: (msg?.content as string) || null,
    tool_calls: toolCalls,
  };
  messages.push(assistantMsg);

  for (const tc of toolCalls) {
    const result = await executeToolCall(tc, userId, env);
    allToolResults.push(result);
    messages.push({
      role: 'tool',
      content: result.content,
      tool_call_id: result.tool_call_id,
    });
  }

  return { messages, toolResults: allToolResults, hasToolCalls };
}

// === 对话管理 ===

/**
 * 获取用户的对话会话列表
 */
export async function getSessions(userId: string, env: Env) {
  const db = getDatabase(env.DB);
  return db.select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt));
}

/**
 * 创建新对话会话
 */
export async function createSession(userId: string, title = '新对话', env: Env) {
  const db = getDatabase(env.DB);
  const [session] = await db.insert(chatSessions).values({
    id: crypto.randomUUID(),
    userId,
    title,
  }).returning();
  return session;
}

/**
 * 获取会话的消息列表
 */
export async function getSessionMessages(sessionId: string, env: Env) {
  const db = getDatabase(env.DB);
  return db.select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));
}

/**
 * 保存消息
 */
export async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string, env: Env) {
  const db = getDatabase(env.DB);
  const [message] = await db.insert(chatMessages).values({
    id: crypto.randomUUID(),
    sessionId,
    role,
    content,
  }).returning();
  return message;
}

/**
 * 更新会话标题
 */
export async function updateSessionTitle(sessionId: string, title: string, env: Env) {
  const db = getDatabase(env.DB);
  const [session] = await db.update(chatSessions)
    .set({ title: title.slice(0, 30) })
    .where(eq(chatSessions.id, sessionId))
    .returning();
  return session;
}

// === 上下文构造 ===

/**
 * 构造系统 Prompt
 */
export async function buildSystemPrompt(userId: string, env: Env): Promise<string> {
  const db = getDatabase(env.DB);

  // 获取用户信息
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // 获取饮食摘要
  const dietSummary = await dietService.getRecentDietSummary(env, userId, 7);

  // 获取近7天训练摘要
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  fromDate.setHours(0, 0, 0, 0);

  const recentLogs = await db.select()
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.userId, userId),
        gte(workoutLogs.date, Math.floor(fromDate.getTime() / 1000))
      )
    )
    .orderBy(desc(workoutLogs.date));

  const trainingDays = recentLogs.map((l: any) => {
    const d = new Date(l.date * 1000);
    return d.toISOString().split('T')[0];
  });
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

  prompt += `\n\n## 训练计划生成：强制规则`;
  prompt += `\n当用户要求制定训练计划时，你必须立即调用 create_workout_plan 工具。禁止仅用文字描述计划。禁止反复追问细节。缺失信息用默认值：新手、每周3天、全身复合动作。`;
  prompt += `\n调用完毕后简短告知用户计划已保存，可在「训练」页面查看和修改。`;
  prompt += `\n\n示例：用户说"帮我做计划" → 直接调用工具，计划名="自定义训练计划"，动作包含深蹲/卧推/划船/推举等，分3天安排。`;

  return prompt;
}

/**
 * 构造对话消息列表
 */
export async function buildMessages(userId: string, sessionId: string, historyLimit = 10, env: Env) {
  const systemPrompt = await buildSystemPrompt(userId, env);

  const history = await getSessionMessages(sessionId, env);

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of history) {
    messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
  }

  return messages;
}

/**
 * 自动生成会话标题
 */
export function generateSessionTitle(userMessage: string): string {
  return userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
}
