import React, { useEffect } from 'react';
import {
  Container, Typography, Box, Button, Chip, Paper, Divider, CircularProgress, Alert,
} from '@mui/material';
import { FitnessCenter, Timer, PlayArrow } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkouts } from '../hooks/useWorkouts';
import { getDayOfWeekName } from '../utils/format';

/** 训练计划详情页 */
const WorkoutPlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPlan, isLoading, error, loadPlanById, clearError } = useWorkouts();

  useEffect(() => {
    if (id) loadPlanById(id);
  }, [id, loadPlanById]);

  if (isLoading && !currentPlan) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Alert severity="error" onClose={clearError}>{error}</Alert>
      </Container>
    );
  }

  if (!currentPlan) {
    return (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Typography>计划不存在</Typography>
      </Container>
    );
  }

  // 按 dayOfWeek 分组
  const groupedByDay: Record<number, typeof currentPlan.exercises> = {};
  currentPlan.exercises?.forEach((e) => {
    (groupedByDay[e.dayOfWeek] ??= []).push(e);
  });

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {currentPlan.name}
      </Typography>
      {currentPlan.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {currentPlan.description}
        </Typography>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<PlayArrow />}
        onClick={() => navigate(`/workout/log/${currentPlan.id}`)}
        sx={{ mb: 3, py: 1.5 }}
      >
        开始训练
      </Button>

      {Object.entries(groupedByDay)
        .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
        .map(([day, exercises]) => (
          <Paper key={day} variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {getDayOfWeekName(parseInt(day, 10))}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {exercises?.map((pe) => (
              <Box key={pe.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {pe.exercise?.name || '未知动作'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pe.exercise?.muscleGroup}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip icon={<FitnessCenter sx={{ fontSize: 14 }} />} label={`${pe.sets}组×${pe.reps}次`} size="small" />
                  {pe.restSeconds > 0 && (
                    <Chip icon={<Timer sx={{ fontSize: 14 }} />} label={`${pe.restSeconds}s`} size="small" variant="outlined" />
                  )}
                </Box>
              </Box>
            ))}
          </Paper>
        ))}
    </Container>
  );
};

export default WorkoutPlanDetailPage;
