import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, MenuItem, List, ListItem,
  ListItemButton, CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import type { FoodItem } from '../../types';

interface FoodSearchProps {
  results: FoodItem[];
  isLoading: boolean;
  onSearch: (query: string) => void;
  onSelect: (food: FoodItem) => void;
}

/** 食物搜索组件 */
const FoodSearch: React.FC<FoodSearchProps> = ({ results, isLoading, onSearch, onSelect }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索食物（如：鸡蛋、米饭、鸡胸肉）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="contained" onClick={handleSearch} disabled={isLoading || !query.trim()}>
          <Search />
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {results.length > 0 && (
        <List dense sx={{ mt: 1 }}>
          {results.map((food) => (
            <ListItem key={food.id} disablePadding>
              <ListItemButton onClick={() => onSelect(food)} sx={{ borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{food.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      每100g: {food.caloriesPer100g}kcal | P:{food.proteinPer100g}g C:{food.carbsPer100g}g F:{food.fatPer100g}g
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    {food.caloriesPer100g} kcal
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      {!isLoading && query && results.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          未找到食物，请尝试其他关键词
        </Typography>
      )}
    </Box>
  );
};

export default FoodSearch;
