import React, { useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Snackbar } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkouts } from '../hooks/useWorkouts';
import LogForm from '../components/workout/LogForm';
import type { CreateWorkoutLogInput } from '../types';

/** 训练记录页 */
const WorkoutLogPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { currentPlan, isLoading, error, loadPlanById, createLog, clearError } = useWorkouts();
  const [snackOpen, setSnackOpen] = React.useState(false);

  useEffect(() => {
    if (planId) {
      loadPlanById(planId);
    }
  }, [planId, loadPlanById]);

  const handleSubmit = async (data: CreateWorkoutLogInput) => {
    await createLog(data);
    setSnackOpen(true);
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  if (isLoading && !currentPlan) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {currentPlan ? `训练: ${currentPlan.name}` : '自由训练'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>}

      <LogForm
        planExercises={currentPlan?.exercises}
        planId={planId}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        message="训练记录保存成功！"
        onClose={() => setSnackOpen(false)}
      />
    </Container>
  );
};

export default WorkoutLogPage;
