import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, InputAdornment } from '@mui/material';
import { Email, Lock, Person } from '@mui/icons-material';
import { getEmailError, getPasswordError, getNameError } from '../../utils/validation';

interface RegisterFormProps {
  onSubmit: (email: string, password: string, name: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/** 注册表单组件 */
const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading = false, error }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors = {
      name: getNameError(name),
      email: getEmailError(email),
      password: getPasswordError(password),
    };
    setErrors(newErrors);
    return !newErrors.name && !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(email, password, name);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
      <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
        注册 FitMate
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        开启你的智能健身之旅
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        fullWidth
        label="姓名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!!errors.name}
        helperText={errors.name}
        margin="normal"
        autoComplete="name"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Person fontSize="small" /></InputAdornment>
          ),
        }}
      />

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
        helperText={errors.password || '至少6个字符'}
        margin="normal"
        autoComplete="new-password"
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
        {isLoading ? '注册中...' : '注册'}
      </Button>
    </Box>
  );
};

export default RegisterForm;
