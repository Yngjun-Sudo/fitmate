import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, MenuItem, Paper, Grid, CircularProgress, Alert,
} from '@mui/material';
import type { Gender, ActivityLevel, Goal } from '../../types';
import { useDiet } from '../../hooks/useDiet';
import { formatCalories, formatGrams } from '../../utils/format';

/** TDEE 计算器组件 */
const TDEECalculator: React.FC = () => {
  const { tdeeResult, isLoading, error, calcTDEE, clearError } = useDiet();

  const [gender, setGender] = useState<Gender>('male');
  const [weightKg, setWeightKg] = useState('70');
  const [heightCm, setHeightCm] = useState('170');
  const [age, setAge] = useState('25');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('build_muscle');

  const handleCalculate = () => {
    calcTDEE({
      gender,
      weightKg: parseFloat(weightKg) || 70,
      heightCm: parseFloat(heightCm) || 170,
      age: parseInt(age, 10) || 25,
      activityLevel,
      goal,
    });
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        TDEE 计算器
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        输入身体数据，计算每日能量消耗和营养素目标
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>}

      <Grid container spacing={1.5}>
        <Grid item xs={6}>
          <TextField select fullWidth label="性别" value={gender} onChange={(e) => setGender(e.target.value as Gender)} size="small">
            <MenuItem value="male">男</MenuItem>
            <MenuItem value="female">女</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="年龄" type="number" value={age} onChange={(e) => setAge(e.target.value)} size="small" inputProps={{ min: 10, max: 120 }} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="体重 (kg)" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} size="small" inputProps={{ min: 30, max: 300, step: 0.1 }} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="身高 (cm)" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} size="small" inputProps={{ min: 100, max: 250 }} />
        </Grid>
        <Grid item xs={6}>
          <TextField select fullWidth label="活动水平" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)} size="small">
            <MenuItem value="sedentary">久坐不动</MenuItem>
            <MenuItem value="light">轻度活动</MenuItem>
            <MenuItem value="moderate">中度活动</MenuItem>
            <MenuItem value="active">积极活动</MenuItem>
            <MenuItem value="very_active">高强度</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField select fullWidth label="目标" value={goal} onChange={(e) => setGoal(e.target.value as Goal)} size="small">
            <MenuItem value="lose_fat">减脂</MenuItem>
            <MenuItem value="build_muscle">增肌</MenuItem>
            <MenuItem value="maintain">保持体重</MenuItem>
            <MenuItem value="general_fitness">综合健康</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Button variant="contained" fullWidth onClick={handleCalculate} disabled={isLoading} sx={{ mt: 2 }}>
        {isLoading ? <CircularProgress size={24} color="inherit" /> : '计算'}
      </Button>

      {tdeeResult && (
        <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'primary.50' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            计算结果
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">基础代谢 (BMR)</Typography>
              <Typography variant="body1" fontWeight={600}>{formatCalories(tdeeResult.bmr)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">TDEE</Typography>
              <Typography variant="body1" fontWeight={600}>{formatCalories(tdeeResult.tdee)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">目标摄入</Typography>
              <Typography variant="body1" fontWeight={600} color="primary.main">
                {formatCalories(tdeeResult.targetCalories)}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">蛋白质</Typography>
              <Typography variant="body2" fontWeight={600}>{formatGrams(tdeeResult.proteinGrams)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">碳水</Typography>
              <Typography variant="body2" fontWeight={600}>{formatGrams(tdeeResult.carbsGrams)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">脂肪</Typography>
              <Typography variant="body2" fontWeight={600}>{formatGrams(tdeeResult.fatGrams)}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default TDEECalculator;
