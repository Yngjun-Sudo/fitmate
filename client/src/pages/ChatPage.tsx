import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemText, Typography,
  IconButton, Drawer, Divider, CircularProgress, Button, Chip,
} from '@mui/material';
import { Add, Menu, Chat as ChatIcon, FitnessCenter } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import { getChatSessions, getChatMessages, createChatSession, sendChatMessage } from '../api/chat';
import type { ChatSession, ChatMessage } from '../types';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isToolResult?: boolean;
}

/** AI 助手页面 */
const ChatPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // 加载会话消息
  const loadMessages = useCallback(async (sessionId: string) => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const data = await getChatMessages(sessionId);
      setMessages(data.map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
    } catch (err) {
      setError('加载对话记录失败');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // 创建新对话
  const handleNewSession = async () => {
    try {
      const session = await createChatSession();
      setSessions((prev) => [session, ...prev]);
      setCurrentSessionId(session.id);
      setMessages([]);
      setDrawerOpen(false);
    } catch (err) {
      setError('创建对话失败');
    }
  };

  // 选择会话
  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    loadMessages(session.id);
    setDrawerOpen(false);
  };

  // 发送消息
  const handleSend = (message: string) => {
    // 将用户消息加入列表
    const tempId = Date.now().toString();
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: message }]);
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    let newSessionId = currentSessionId;
    let hasToolResult = false; // 跟踪是否有工具结果，避免 onDone 重复添加

    sendChatMessage(message, currentSessionId, {
      onSession: (sessionId) => {
        newSessionId = sessionId;
        setCurrentSessionId(sessionId);
        loadSessions();
      },
      onToken: (token) => {
        setStreamingContent((prev) => prev + token);
      },
      onDone: (fullContent) => {
        // 如果已有工具结果，且流式内容为空，不重复添加消息
        if (hasToolResult && !fullContent.trim()) {
          setIsStreaming(false);
          setStreamingContent('');
          return;
        }
        if (fullContent.trim()) {
          setMessages((prev) => [
            ...prev,
            { id: `assistant-${Date.now()}`, role: 'assistant', content: fullContent },
          ]);
        }
        setIsStreaming(false);
        setStreamingContent('');
        if (newSessionId) {
          loadSessions();
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setIsStreaming(false);
        setStreamingContent('');
      },
      onToolResult: (content) => {
        hasToolResult = true;
        // 工具执行结果 → 插入为 assistant 消息（带跳转标记）
        setMessages((prev) => [
          ...prev,
          { id: `tool-${Date.now()}`, role: 'assistant', content, isToolResult: true },
        ]);
      },
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* 顶部栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
          <Menu />
        </IconButton>
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
          AI 助手
        </Typography>
        <IconButton onClick={handleNewSession} color="primary">
          <Add />
        </IconButton>
      </Box>

      {error && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* 会话列表抽屉 */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, p: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            对话历史
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Button variant="contained" fullWidth startIcon={<Add />} onClick={handleNewSession} sx={{ mb: 2 }}>
            新对话
          </Button>
          {isLoadingSessions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {sessions.map((s) => (
                <ListItem key={s.id} disablePadding>
                  <ListItemButton
                    selected={s.id === currentSessionId}
                    onClick={() => handleSelectSession(s)}
                    sx={{ borderRadius: 1 }}
                  >
                    <ChatIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <ListItemText primary={s.title} secondary={new Date(s.updatedAt).toLocaleDateString()} />
                  </ListItemButton>
                </ListItem>
              ))}
              {sessions.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  还没有对话记录
                </Typography>
              )}
            </List>
          )}
        </Box>
      </Drawer>

      {/* 消息窗口 */}
      {isLoadingHistory ? (
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <ChatWindow messages={messages} isStreaming={isStreaming} streamingContent={streamingContent} />
      )}

      {/* 输入框 */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </Box>
  );
};

export default ChatPage;
