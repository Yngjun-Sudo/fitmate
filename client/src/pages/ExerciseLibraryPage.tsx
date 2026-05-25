import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, TextField, Chip, CircularProgress, Grid, InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import ExerciseCard from '../components/workout/ExerciseCard';
import type { ExerciseCategory } from '../types';
import { getCategoryName } from '../utils/format';

const CATEGORIES: ExerciseCategory[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'full_body'];

/** 动作库页面 */
const ExerciseLibraryPage: React.FC = () => {
  const { exercises, exerciseTotal, isLoading, loadExercises } = useExercises();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    loadExercises({});
  }, [loadExercises]);

  const handleSearch = () => {
    loadExercises({ search: search || undefined, category: activeCategory || undefined });
  };

  const handleCategoryClick = (cat: string) => {
    const newCat = activeCategory === cat ? '' : cat;
    setActiveCategory(newCat);
    loadExercises({ search: search || undefined, category: newCat || undefined });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        动作库
      </Typography>

      {/* 搜索框 */}
      <TextField
        fullWidth
        placeholder="搜索动作名称或肌群..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Search /></InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* 分类筛选 */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={getCategoryName(cat)}
            color={activeCategory === cat ? 'primary' : 'default'}
            onClick={() => handleCategoryClick(cat)}
            clickable
          />
        ))}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        共 {exerciseTotal} 个动作
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={1.5}>
          {exercises.map((ex) => (
            <Grid item xs={6} key={ex.id}>
              <ExerciseCard
                exercise={ex}
                onClick={() => navigate(`/exercises/${ex.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ExerciseLibraryPage;
