import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Link, Typography } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

/** 登录页面 */
const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError, navigate } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    try {
      clearError();
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      // error is already set in the store
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={0} sx={{ p: 4, width: '100%', bgcolor: 'transparent' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h3" fontWeight={800} color="primary" sx={{ mb: 1 }}>
            🏋️ FitMate
          </Typography>
          <LoginForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            还没有账号？{' '}
            <Link component={RouterLink} to="/register" underline="hover" fontWeight={600}>
              立即注册
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
