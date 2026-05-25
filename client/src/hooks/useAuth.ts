import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * useAuth Hook — 封装认证状态操作和路由守卫逻辑
 */
export function useAuth() {
  const { token, user, isLoading, error, login, register, logout, fetchUser, updateProfile, clearError } = useAuthStore();
  const navigate = useNavigate();

  // 组件挂载时自动获取用户信息
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  /** 需要认证的路由守卫：未登录则重定向到 /login */
  const requireAuth = () => {
    if (!token) {
      navigate('/login', { replace: true });
      return false;
    }
    return true;
  };

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    clearError,
    requireAuth,
    navigate,
  };
}
