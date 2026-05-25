import React from 'react';
import { Card, CardContent, CardActions, Typography, Chip, Box, IconButton } from '@mui/material';
import { Delete, Edit, FitnessCenter } from '@mui/icons-material';
import type { WorkoutPlan } from '../../types';
import { formatDateCN } from '../../utils/format';

interface PlanCardProps {
  plan: WorkoutPlan;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** 训练计划摘要卡片 */
const PlanCard: React.FC<PlanCardProps> = ({ plan, onClick, onEdit, onDelete }) => {
  const exerciseCount = plan.exercises?.length || 0;
  const dayCount = new Set(plan.exercises?.map((e) => e.dayOfWeek)).size || 0;

  return (
    <Card
      sx={{ cursor: onClick ? 'pointer' : 'default', '&:hover': { boxShadow: 4 } }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {plan.name}
          </Typography>
          <Box>
            {onEdit && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {plan.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {plan.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<FitnessCenter />}
            label={`${exerciseCount} 个动作`}
            size="small"
            variant="outlined"
          />
          <Chip label={`${dayCount} 天训练`} size="small" variant="outlined" />
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          创建于 {formatDateCN(plan.createdAt)}
        </Typography>
      </CardActions>
    </Card>
  );
};

export default PlanCard;
