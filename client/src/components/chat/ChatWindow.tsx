import React, { useRef, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
}

/** 聊天消息窗口 — 支持流式渲染 */
const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isStreaming, streamingContent }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: 1 }}>
      {messages.length === 0 && !isStreaming && (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            🏋️
          </Typography>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            FitMate AI 助手
          </Typography>
          <Typography variant="body2" color="text.secondary">
            向我提问任何健身、饮食或训练相关的问题！
          </Typography>
        </Box>
      )}

      {messages.map((msg) => (
        <Box
          key={msg.id}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            mb: 1.5,
          }}
        >
          <Paper
            sx={{
              p: 1.5,
              maxWidth: '85%',
              bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
              color: msg.role === 'user' ? 'white' : 'text.primary',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
            </Typography>
          </Paper>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, px: 1 }}>
            {msg.role === 'user' ? '你' : 'AI助手'}
          </Typography>
        </Box>
      ))}

      {/* 流式内容 */}
      {isStreaming && streamingContent && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 1.5 }}>
          <Paper
            sx={{
              p: 1.5,
              maxWidth: '85%',
              bgcolor: 'grey.100',
              borderRadius: '16px 16px 16px 4px',
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {streamingContent}
              <Box component="span" sx={{ display: 'inline-block', width: 6, height: 14, bgcolor: 'primary.main', ml: 0.25, animation: 'blink 1s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />
            </Typography>
          </Paper>
        </Box>
      )}

      {isStreaming && !streamingContent && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">AI 思考中...</Typography>
        </Box>
      )}

      <div ref={bottomRef} />
    </Box>
  );
};

export default ChatWindow;
