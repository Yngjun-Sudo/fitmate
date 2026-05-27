import React, { useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Container } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useAuthStore } from '../../store/authStore';

/** 主布局组件：顶部标题栏 + 内容区 + 底部导航 */
const AppLayout: React.FC = () => {
  const { token, user, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // 登录已关闭，跳过 token 检查
  // useEffect(() => {
  //   if (token && !user) {
  //     fetchUser();
  //   }
  //   if (!token) {
  //     navigate('/login', { replace: true });
  //   }
  // }, [token, user, fetchUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* 顶部标题栏 */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
            🏋️ FitMate
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} size="small">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 页面内容 */}
      <Box sx={{ pb: 8 }}>
        <Outlet />
      </Box>

      {/* 底部导航 */}
      <BottomNav />
    </Box>
  );
};

export default AppLayout;
