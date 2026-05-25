import apiClient from './client';
import type { ApiResponse, ChatSession, ChatMessage } from '../types';

// === 对话会话 ===
export async function getChatSessions(): Promise<ChatSession[]> {
  const res = await apiClient.get<ApiResponse<ChatSession[]>>('/chat/sessions');
  return res.data.data!;
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  const res = await apiClient.post<ApiResponse<ChatSession>>('/chat/sessions', { title });
  return res.data.data!;
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await apiClient.get<ApiResponse<ChatMessage[]>>(`/chat/sessions/${sessionId}`);
  return res.data.data!;
}

// === SSE 流式对话 ===

export interface ChatStreamCallbacks {
  onSession?: (sessionId: string) => void;
  onToken?: (token: string) => void;
  onDone?: (fullContent: string) => void;
  onError?: (error: string) => void;
}

/**
 * 发送消息并接收 SSE 流式响应
 * 返回 AbortController 用于取消
 */
export function sendChatMessage(
  message: string,
  sessionId: string | null,
  callbacks: ChatStreamCallbacks,
): AbortController {
  const controller = new AbortController();
  const token = localStorage.getItem('fitness_token');

  fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message, sessionId }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        callbacks.onError?.(`请求失败: ${response.status} ${text}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('无法读取响应流');
        return;
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              callbacks.onDone?.(fullContent);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'session' && parsed.sessionId) {
                callbacks.onSession?.(parsed.sessionId);
              } else if (parsed.type === 'token' && parsed.content) {
                fullContent += parsed.content;
                callbacks.onToken?.(parsed.content);
              } else if (parsed.type === 'error') {
                callbacks.onError?.(parsed.message);
              }
            } catch {
              // skip
            }
          }
        }
        // 如果循环正常结束（没有[DONE]信号）
        callbacks.onDone?.(fullContent);
      } finally {
        reader.releaseLock();
      }
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') {
        callbacks.onError?.(err.message);
      }
    });

  return controller;
}
