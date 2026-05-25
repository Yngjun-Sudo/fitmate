import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Paper, Grid, Button, Card, CardContent,
  CircularProgress, LinearProgress, List, ListItem, ListItemText,
} from '@mui/material';
import { FitnessCenter, Restaurant, SmartToy, PlayArrow, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getWorkoutLogs } from '../api/workouts';
import { getMealRecords } from '../api/diet';
import type { WorkoutLog, MealRecord } from '../types';
import { formatDateCN, formatCalories } from '../utils/format';

/** 首页 Dashboard */
const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [todayLogs, setTodayLogs] = useState<WorkoutLog[]>([]);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];

      try {
        const [logsResult, mealsResult, recentResult] = await Promise.all([
          getWorkoutLogs({ date: today }),
          getMealRecords(today),
          getWorkoutLogs({ pageSize: 5 }),
        ]);
        setTodayLogs(logsResult.items);
        setMealRecords(mealsResult);
        setRecentLogs(recentResult.items);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 今日训练概览
  const hasTrained = todayLogs.length > 0;

  // 今日饮食热量
  const todayCalories = mealRecords.reduce((sum, r) => {
    if (!r.foodItem) return sum;
    return sum + (r.foodItem.caloriesPer100g / 100) * r.quantityGrams;
  }, 0);

  const tdeeTarget = 2000; // 默认目标

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* 欢迎区域 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          你好，{user?.name || '健身者'} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* 今日概览卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* 训练概览 */}
        <Grid item xs={6}>
          <Card
            sx={{
              bgcolor: hasTrained ? 'success.light' : 'grey.100',
              color: hasTrained ? 'success.contrastText' : 'text.primary',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/workout/plans')}
          >
            <CardContent>
              <FitnessCenter sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                {hasTrained ? '已完成' : '今日训练'}
              </Typography>
              <Typography variant="body2">
                {hasTrained ? `${todayLogs.length} 项训练` : '还未开始'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 饮食概览 */}
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'primary.50', cursor: 'pointer' }} onClick={() => navigate('/diet')}>
            <CardContent>
              <Restaurant sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>
                {formatCalories(todayCalories)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今日已摄入
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((todayCalories / tdeeTarget) * 100, 100)}
                sx={{ mt: 1, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 快捷入口 */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        快捷入口
      </Typography>
      <Grid container spacing={1} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={() => navigate('/workout/plans')}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            开始训练
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Restaurant />}
            onClick={() => navigate('/diet')}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            记录饮食
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<SmartToy />}
            onClick={() => navigate('/chat')}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            问AI
          </Button>
        </Grid>
      </Grid>

      {/* 最近训练记录 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          最近训练
        </Typography>
        <Button size="small" endIcon={<ChevronRight />} onClick={() => navigate('/workout/plans')}>
          查看全部
        </Button>
      </Box>

      {recentLogs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            还没有训练记录，快去开始你的第一次训练吧！
          </Typography>
        </Paper>
      ) : (
        <List disablePadding>
          {recentLogs.slice(0, 5).map((log) => (
            <Paper key={log.id} variant="outlined" sx={{ mb: 1 }}>
              <ListItem>
                <ListItemText
                  primary={log.plan?.name || '自由训练'}
                  secondary={`${formatDateCN(log.date)} · ${log.exercises?.length || 0} 个动作 · ${log.durationMinutes}分钟`}
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Container>
  );
};

export default DashboardPage;
