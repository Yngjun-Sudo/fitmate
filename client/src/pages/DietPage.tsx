import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Divider, Alert, CircularProgress } from '@mui/material';
import TDEECalculator from '../components/diet/TDEECalculator';
import MealRecordForm from '../components/diet/MealRecordForm';
import MealRecordList from '../components/diet/MealRecordList';
import { useDiet } from '../hooks/useDiet';

/** 饮食页面 — 整合 TDEE + 食物搜索 + 饮食记录 */
const DietPage: React.FC = () => {
  const { mealRecords, isLoading, error, loadMealRecords, deleteMealRecord, clearError } = useDiet();
  const today = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(today);

  useEffect(() => {
    loadMealRecords(currentDate);
  }, [currentDate, loadMealRecords]);

  const handleRecorded = () => {
    loadMealRecords(currentDate);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        饮食管理
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>}

      {/* TDEE 计算器 */}
      <TDEECalculator />

      <Divider sx={{ my: 3 }} />

      {/* 饮食记录区域 */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {currentDate === today ? '今日饮食记录' : currentDate + '饮食记录'}
      </Typography>

      <MealRecordForm date={currentDate} onRecorded={handleRecorded} />

      <Box sx={{ mt: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <MealRecordList records={mealRecords} onDelete={(id) => { deleteMealRecord(id).then(() => loadMealRecords(currentDate)); }} isLoading={isLoading} />
        )}
      </Box>
    </Container>
  );
};

export default DietPage;
