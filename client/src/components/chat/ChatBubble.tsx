import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

/** 单条聊天气泡组件 */
const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: role === 'user' ? 'flex-end' : 'flex-start',
        mb: 1.5,
      }}
    >
      <Paper
        sx={{
          p: 1.5,
          maxWidth: '85%',
          bgcolor: role === 'user' ? 'primary.main' : 'grey.100',
          color: role === 'user' ? 'white' : 'text.primary',
          borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {content}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChatBubble;
