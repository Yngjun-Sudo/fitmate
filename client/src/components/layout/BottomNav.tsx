import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Dashboard, FitnessCenter, Restaurant, SmartToy, Person } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

/** 底部五 Tab 导航 */
const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { label: '首页', icon: <Dashboard />, path: '/dashboard' },
    { label: '训练', icon: <FitnessCenter />, path: '/workout/plans' },
    { label: '饮食', icon: <Restaurant />, path: '/diet' },
    { label: 'AI助手', icon: <SmartToy />, path: '/chat' },
    { label: '我的', icon: <Person />, path: '/profile' },
  ];

  // 确定当前激活的 tab
  const currentPath = location.pathname;
  const activeTab = tabs.findIndex((t) => {
    if (t.path === '/workout/plans') return currentPath.startsWith('/workout');
    return currentPath === t.path || currentPath.startsWith(t.path + '/');
  });

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: 1,
        borderColor: 'divider',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={activeTab >= 0 ? activeTab : 0}
        onChange={(_, newValue) => {
          navigate(tabs[newValue].path);
        }}
        showLabels
      >
        {tabs.map((tab) => (
          <BottomNavigationAction key={tab.path} label={tab.label} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
