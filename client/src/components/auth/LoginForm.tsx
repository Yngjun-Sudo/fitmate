import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, InputAdornment } from '@mui/material';
import { Email, Lock } from '@mui/icons-material';
import { getEmailError, getPasswordError } from '../../utils/validation';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/** 登录表单组件 */
const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors = {
      email: getEmailError(email),
      password: getPasswordError(password),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(email, password);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
      <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
        登录 FitMate
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        欢迎回来，继续你的健身之旅
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        fullWidth
        label="邮箱"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={!!errors.email}
        helperText={errors.email}
        margin="normal"
        autoComplete="email"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Email fontSize="small" /></InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="密码"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={!!errors.password}
        helperText={errors.password}
        margin="normal"
        autoComplete="current-password"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
      >
        {isLoading ? '登录中...' : '登录'}
      </Button>
    </Box>
  );
};

export default LoginForm;
