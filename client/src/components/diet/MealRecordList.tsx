import React from 'react';
import {
  Box, Typography, Paper, IconButton, Chip, Divider,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import type { MealRecord } from '../../types';
import { getMealTypeName, formatCalories } from '../../utils/format';

interface MealRecordListProps {
  records: MealRecord[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

/** 饮食记录列表（按餐次分组） */
const MealRecordList: React.FC<MealRecordListProps> = ({ records, onDelete, isLoading }) => {
  // 按餐次分组
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  const grouped: Record<string, MealRecord[]> = {};

  for (const record of records) {
    if (!grouped[record.mealType]) grouped[record.mealType] = [];
    grouped[record.mealType].push(record);
  }

  // 计算总热量
  const totalCalories = records.reduce((sum, r) => {
    if (!r.foodItem) return sum;
    return sum + (r.foodItem.caloriesPer100g / 100) * r.quantityGrams;
  }, 0);

  if (records.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          今天还没有饮食记录，快去添加吧
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 总计 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'primary.50', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">今日已摄入</Typography>
        <Typography variant="h5" fontWeight={700} color="primary.main">
          {formatCalories(totalCalories)}
        </Typography>
      </Paper>

      {mealOrder.map((meal) => {
        const mealRecords = grouped[meal];
        if (!mealRecords || mealRecords.length === 0) return null;

        return (
          <Box key={meal} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {getMealTypeName(meal)}
            </Typography>
            {mealRecords.map((record) => {
              const food = record.foodItem;
              const cals = food ? Math.round((food.caloriesPer100g / 100) * record.quantityGrams) : 0;
              const protein = food ? ((food.proteinPer100g / 100) * record.quantityGrams).toFixed(1) : '0';

              return (
                <Paper key={record.id} variant="outlined" sx={{ p: 1, mb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {food?.name || '未知'} {record.quantityGrams}g
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cals} kcal · 蛋白质 {protein}g
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>
                      {cals}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => onDelete(record.id)} disabled={isLoading}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export default MealRecordList;
