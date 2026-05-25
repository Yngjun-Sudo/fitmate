import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Chip, Paper, Divider, CircularProgress, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getExerciseById } from '../api/exercises';
import type { Exercise } from '../types';
import { getCategoryName, getDifficultyName } from '../utils/format';

/** 动作详情页 */
const ExerciseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getExerciseById(id)
      .then((data) => {
        setExercise(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !exercise) {
    return (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Typography color="error">{error || '动作不存在'}</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>返回</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={getCategoryName(exercise.category)} color="primary" />
        <Chip label={exercise.muscleGroup} />
        <Chip label={exercise.equipment || '徒手'} variant="outlined" />
        <Chip label={getDifficultyName(exercise.difficulty)} variant="outlined" />
      </Box>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        {exercise.name}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {exercise.description}
      </Typography>

      {exercise.instructions && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            动作要领
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
            {exercise.instructions}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ExerciseDetailPage;
