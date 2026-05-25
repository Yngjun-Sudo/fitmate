import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Link, Typography } from '@mui/material';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../hooks/useAuth';

/** 注册页面 */
const RegisterPage: React.FC = () => {
  const { register, isLoading, error, clearError, navigate } = useAuth();

  const handleSubmit = async (email: string, password: string, name: string) => {
    try {
      clearError();
      await register(email, password, name);
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
          <RegisterForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            已有账号？{' '}
            <Link component={RouterLink} to="/login" underline="hover" fontWeight={600}>
              立即登录
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
