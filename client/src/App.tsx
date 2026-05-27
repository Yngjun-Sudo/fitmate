import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

// 页面懒加载
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import WorkoutPlansPage from './pages/WorkoutPlansPage';
import WorkoutPlanDetailPage from './pages/WorkoutPlanDetailPage';
import WorkoutLogPage from './pages/WorkoutLogPage';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import ExerciseDetailPage from './pages/ExerciseDetailPage';
import DietPage from './pages/DietPage';
import ChatPage from './pages/ChatPage';

/** 受保护路由守卫 — 已关闭，所有路由直接可访问 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

/** 应用根组件 — 路由配置 */
const App: React.FC = () => {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 受保护路由 — AppLayout 包裹 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="workout/plans" element={<WorkoutPlansPage />} />
        <Route path="workout/plans/:id" element={<WorkoutPlanDetailPage />} />
        <Route path="workout/log/:planId" element={<WorkoutLogPage />} />
        <Route path="exercises" element={<ExerciseLibraryPage />} />
        <Route path="exercises/:id" element={<ExerciseDetailPage />} />
        <Route path="diet" element={<DietPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 未匹配路由 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
