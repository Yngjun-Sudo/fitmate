import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

/** 通用加载中组件 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = '加载中...', fullPage = false }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: fullPage ? 20 : 4,
        minHeight: fullPage ? '100vh' : undefined,
      }}
    >
      <CircularProgress size={fullPage ? 48 : 32} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
