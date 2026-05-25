import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import type { Exercise } from '../../types';
import { getCategoryName, getDifficultyName } from '../../utils/format';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
}

/** 动作库卡片组件 */
const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick }) => {
  return (
    <Card
      sx={{ cursor: onClick ? 'pointer' : 'default', '&:hover': { boxShadow: 4 } }}
      onClick={onClick}
    >
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {exercise.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {exercise.description || exercise.muscleGroup}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip label={getCategoryName(exercise.category)} size="small" color="primary" variant="outlined" />
          <Chip label={exercise.muscleGroup} size="small" variant="outlined" />
          <Chip label={getDifficultyName(exercise.difficulty)} size="small" variant="outlined" />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExerciseCard;
