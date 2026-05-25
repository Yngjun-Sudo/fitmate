import React from 'react';
import { Alert, Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  severity?: 'error' | 'warning' | 'info';
}

/** 通用错误提示组件 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose, severity = 'error' }) => {
  return (
    <Alert
      severity={severity}
      action={
        onClose ? (
          <IconButton size="small" color="inherit" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        ) : undefined
      }
      sx={{ mb: 2 }}
    >
      {message}
    </Alert>
  );
};

export default ErrorAlert;
