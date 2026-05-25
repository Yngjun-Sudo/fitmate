import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, TextField, Button, MenuItem, Avatar, Divider, Alert,
  CircularProgress, Snackbar,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import type { Gender, Goal, ActivityLevel } from '../types';
import { getHeightError, getWeightError, getNameError } from '../utils/validation';
import { formatWeight, formatHeight, getGoalName, getActivityLevelName } from '../utils/format';

/** 个人信息页面 */
const ProfilePage: React.FC = () => {
  const { user, isLoading, updateProfile, error, clearError, fetchUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    heightCm: '',
    weightKg: '',
    gender: '' as Gender | '',
    goal: '' as Goal | '',
    activityLevel: '' as ActivityLevel | '',
    birthDate: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        heightCm: user.heightCm?.toString() || '',
        weightKg: user.weightKg?.toString() || '',
        gender: user.gender || '',
        goal: user.goal || '',
        activityLevel: user.activityLevel || '',
        birthDate: user.birthDate?.split('T')[0] || '',
      });
    }
  }, [user]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const nameErr = getNameError(formData.name);
    if (nameErr) errors.name = nameErr;
    if (formData.heightCm) {
      const hErr = getHeightError(formData.heightCm);
      if (hErr) errors.heightCm = hErr;
    }
    if (formData.weightKg) {
      const wErr = getWeightError(formData.weightKg);
      if (wErr) errors.weightKg = wErr;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await updateProfile({
      name: formData.name,
      heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
      weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
      gender: formData.gender || undefined,
      goal: formData.goal || undefined,
      activityLevel: formData.activityLevel || undefined,
      birthDate: formData.birthDate || undefined,
    });
    setIsEditing(false);
    setSnackOpen(true);
    fetchUser();
  };

  if (isLoading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Paper sx={{ p: 3 }}>
        {/* 头像区域 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32, mb: 1 }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            {user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* 可编辑信息区域 */}
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <TextField
            fullWidth
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!formErrors.name}
            helperText={formErrors.name}
            margin="normal"
            disabled={!isEditing}
          />

          <TextField
            fullWidth
            label="身高 (cm)"
            type="number"
            value={formData.heightCm}
            onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
            error={!!formErrors.heightCm}
            helperText={formErrors.heightCm}
            margin="normal"
            disabled={!isEditing}
            inputProps={{ min: 100, max: 250, step: 0.1 }}
          />

          <TextField
            fullWidth
            label="体重 (kg)"
            type="number"
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
            error={!!formErrors.weightKg}
            helperText={formErrors.weightKg}
            margin="normal"
            disabled={!isEditing}
            inputProps={{ min: 30, max: 300, step: 0.1 }}
          />

          <TextField
            fullWidth
            select
            label="性别"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
            margin="normal"
            disabled={!isEditing}
          >
            <MenuItem value="male">男</MenuItem>
            <MenuItem value="female">女</MenuItem>
            <MenuItem value="other">其他</MenuItem>
          </TextField>

          <TextField
            fullWidth
            select
            label="健身目标"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value as Goal })}
            margin="normal"
            disabled={!isEditing}
          >
            <MenuItem value="lose_fat">减脂</MenuItem>
            <MenuItem value="build_muscle">增肌</MenuItem>
            <MenuItem value="maintain">保持</MenuItem>
            <MenuItem value="general_fitness">综合健康</MenuItem>
          </TextField>

          <TextField
            fullWidth
            select
            label="活动水平"
            value={formData.activityLevel}
            onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
            margin="normal"
            disabled={!isEditing}
          >
            <MenuItem value="sedentary">久坐不动</MenuItem>
            <MenuItem value="light">轻度活动 (1-2天/周)</MenuItem>
            <MenuItem value="moderate">中度活动 (3-5天/周)</MenuItem>
            <MenuItem value="active">积极活动 (6-7天/周)</MenuItem>
            <MenuItem value="very_active">高强度活动 (每天高强度)</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="出生日期"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            margin="normal"
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />

          {/* 非编辑模式显示摘要 */}
          {!isEditing && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                身高：{formatHeight(user?.heightCm ?? null)} | 体重：{formatWeight(user?.weightKg ?? null)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                目标：{user?.goal ? getGoalName(user.goal) : '未设置'} | 活动：{user?.activityLevel ? getActivityLevelName(user.activityLevel) : '未设置'}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" fullWidth onClick={() => setIsEditing(false)}>
                  取消
                </Button>
                <Button variant="contained" fullWidth type="submit" disabled={isLoading}>
                  {isLoading ? '保存中...' : '保存'}
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
              >
                编辑资料
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message="个人信息已更新"
      />
    </Container>
  );
};

export default ProfilePage;
