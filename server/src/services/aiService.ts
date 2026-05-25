import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { AppError, ErrorCode } from '../types';
import * as dietService from './dietService';

const prisma = new PrismaClient();

// === DeepSeek API 封装 ===

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
  if (!config.deepseekApiKey) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, 'DeepSeek API Key 未配置');
  }

  const response = await fetch(`${config.deepseekBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new AppError(ErrorCode.INTERNAL_ERROR, `DeepSeek API 错误: ${response.status} ${errText}`);
  }

  return response;
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
