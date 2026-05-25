import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Autocomplete, Paper, Grid,
} from '@mui/material';
import { Delete, Add, Search } from '@mui/icons-material';
import type { Exercise, WorkoutPlanExercise, CreateWorkoutPlanInput } from '../../types';
import { useWorkoutStore } from '../../store/workoutStore';
import { getDayOfWeekName } from '../../utils/format';

interface PlanFormProps {
  initialData?: {
    name: string;
    description: string;
    exercises: (WorkoutPlanExercise & { exercise?: Exercise })[];
  };
  onSubmit: (data: CreateWorkoutPlanInput) => Promise<void>;
  isLoading?: boolean;
}

interface ExerciseEntry {
  exerciseId: string;
  dayOfWeek: number;
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string;
  exercise?: Exercise;
}

/** 训练计划创建/编辑表单 */
const PlanForm: React.FC<PlanFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const { exercises, fetchExercises } = useWorkoutStore();

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    if (initialData?.exercises) {
      setEntries(
        initialData.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          dayOfWeek: e.dayOfWeek,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds,
          notes: e.notes,
          exercise: e.exercise,
        })),
      );
    }
  }, [initialData]);

  const addExercise = (exercise: Exercise) => {
    setEntries([
      ...entries,
      {
        exerciseId: exercise.id,
        dayOfWeek: 0,
        sets: 3,
        reps: 10,
        restSeconds: 60,
        notes: '',
        exercise,
      },
    ]);
  };

  const removeEntry = (idx: number) => {
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: keyof ExerciseEntry, value: unknown) => {
    setEntries(entries.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      exercises: entries.map((entry) => ({
        exerciseId: entry.exerciseId,
        dayOfWeek: entry.dayOfWeek,
        sets: entry.sets,
        reps: entry.reps,
        restSeconds: entry.restSeconds,
        notes: entry.notes,
      })),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="计划名称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        margin="normal"
        placeholder="例如：上肢推拉分化训练"
      />

      <TextField
        fullWidth
        label="计划描述（可选）"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        margin="normal"
        multiline
        rows={2}
      />

      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          训练动作
        </Typography>

        {/* 搜索添加动作 */}
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setSearchOpen(true)}
          fullWidth
          sx={{ mb: 2 }}
        >
          添加动作
        </Button>

        {/* 已添加的动作列表 */}
        {entries.map((entry, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                {entry.exercise?.name || '未知动作'}
              </Typography>
              <IconButton size="small" color="error" onClick={() => removeEntry(idx)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="训练日"
                  value={entry.dayOfWeek}
                  onChange={(e) => updateEntry(idx, 'dayOfWeek', parseInt(e.target.value, 10))}
                  SelectProps={{ native: true }}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>{getDayOfWeekName(d)}</option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="组数"
                  type="number"
                  value={entry.sets}
                  onChange={(e) => updateEntry(idx, 'sets', parseInt(e.target.value, 10) || 3)}
                  inputProps={{ min: 1, max: 20 }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="次数"
                  type="number"
                  value={entry.reps}
                  onChange={(e) => updateEntry(idx, 'reps', parseInt(e.target.value, 10) || 10)}
                  inputProps={{ min: 1, max: 100 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="组间休息(秒)"
                  type="number"
                  value={entry.restSeconds}
                  onChange={(e) => updateEntry(idx, 'restSeconds', parseInt(e.target.value, 10) || 60)}
                  inputProps={{ min: 0, max: 600 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="备注"
                  value={entry.notes}
                  onChange={(e) => updateEntry(idx, 'notes', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}

        {entries.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            还没有添加动作，点击上方按钮搜索并添加
          </Typography>
        )}
      </Box>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isLoading || !name || entries.length === 0}
        sx={{ mt: 2 }}
      >
        {isLoading ? '保存中...' : '保存计划'}
      </Button>

      {/* 动作搜索 Dialog */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>搜索并添加动作</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={exercises}
            getOptionLabel={(option) => `${option.name} (${option.muscleGroup})`}
            groupBy={(option) => option.category}
            onChange={(_, value) => {
              if (value) {
                addExercise(value);
                setSearchOpen(false);
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="搜索动作" autoFocus />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.muscleGroup} · {option.equipment || '徒手'} · {option.difficulty}
                  </Typography>
                </Box>
              </li>
            )}
            sx={{ mt: 1 }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PlanForm;
