import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/** 聊天输入框组件 */
const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, placeholder = '输入你的问题...' }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, px: 1, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        inputRef={inputRef}
        disabled={disabled}
        multiline
        maxRows={4}
        sx={{
          '& .MuiOutlinedInput-root': { borderRadius: 3 },
        }}
      />
      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        sx={{ alignSelf: 'flex-end' }}
      >
        <Send />
      </IconButton>
    </Box>
  );
};

export default ChatInput;
