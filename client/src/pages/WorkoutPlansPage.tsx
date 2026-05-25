import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, Dialog, DialogTitle, DialogContent,
  CircularProgress, Alert, Grid,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../hooks/useWorkouts';
import PlanCard from '../components/workout/PlanCard';
import PlanForm from '../components/workout/PlanForm';
import type { CreateWorkoutPlanInput } from '../types';

/** 训练计划列表页 */
const WorkoutPlansPage: React.FC = () => {
  const { plans, isLoading, error, loadPlans, createPlan, deletePlan, clearError } = useWorkouts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleCreate = async (data: CreateWorkoutPlanInput) => {
    await createPlan(data);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个训练计划吗？')) {
      await deletePlan(id);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          训练计划
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          新建计划
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>}

      {isLoading && plans.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : plans.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            还没有训练计划
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            创建你的第一个训练计划开始健身之旅
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
            新建计划
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {plans.map((plan) => (
            <Grid item xs={12} key={plan.id}>
              <PlanCard
                plan={plan}
                onClick={() => navigate(`/workout/plans/${plan.id}`)}
                onDelete={() => handleDelete(plan.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* 创建计划 Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新建训练计划</DialogTitle>
        <DialogContent>
          <PlanForm onSubmit={handleCreate} isLoading={isLoading} />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default WorkoutPlansPage;
