import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, MenuItem, Paper, IconButton, CircularProgress,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { FoodItem, MealType, CreateMealRecordInput } from '../../types';
import FoodSearch from './FoodSearch';
import { useDiet } from '../../hooks/useDiet';
import { getMealTypeName } from '../../utils/format';

interface MealRecordFormProps {
  date: string;
  onRecorded: () => void;
}

/** 饮食记录表单 */
const MealRecordForm: React.FC<MealRecordFormProps> = ({ date, onRecorded }) => {
  const { foodItems, isLoading, searchFood, createMealRecord } = useDiet();
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');

  const handleFoodSelect = (food: FoodItem) => {
    setSelectedFood(food);
  };

  const handleSubmit = async () => {
    if (!selectedFood) return;
    await createMealRecord({
      foodItemId: selectedFood.id,
      quantityGrams: parseFloat(quantity) || 100,
      mealType,
      date,
    });
    setSelectedFood(null);
    setQuantity('100');
    onRecorded();
  };

  if (selectedFood) {
    const totalCals = (selectedFood.caloriesPer100g / 100) * (parseFloat(quantity) || 100);

    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">{selectedFood.name}</Typography>
          <IconButton size="small" onClick={() => setSelectedFood(null)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            select
            size="small"
            label="餐次"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            sx={{ flex: 1 }}
          >
            <MenuItem value="breakfast">早餐</MenuItem>
            <MenuItem value="lunch">午餐</MenuItem>
            <MenuItem value="dinner">晚餐</MenuItem>
            <MenuItem value="snack">加餐</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="克数"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ flex: 1 }}
          />
          <Button variant="contained" onClick={handleSubmit} disabled={isLoading} size="small" startIcon={<Add />}>
            添加
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          约 {Math.round(totalCals)} kcal · 蛋白质 {((selectedFood.proteinPer100g / 100) * (parseFloat(quantity) || 100)).toFixed(1)}g
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        添加食物到 {getMealTypeName(mealType)}
      </Typography>
      <TextField
        select
        size="small"
        label="选择餐次"
        value={mealType}
        onChange={(e) => setMealType(e.target.value as MealType)}
        fullWidth
        sx={{ mb: 1 }}
      >
        <MenuItem value="breakfast">早餐</MenuItem>
        <MenuItem value="lunch">午餐</MenuItem>
        <MenuItem value="dinner">晚餐</MenuItem>
        <MenuItem value="snack">加餐</MenuItem>
      </TextField>
      <FoodSearch results={foodItems} isLoading={isLoading} onSearch={searchFood} onSelect={handleFoodSelect} />
    </Box>
  );
};

export default MealRecordForm;
