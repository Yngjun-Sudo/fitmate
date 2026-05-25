import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, IconButton, Divider } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import type { CreateWorkoutLogInput, WorkoutPlanExercise, Exercise } from '../../types';

interface LogFormProps {
  planExercises?: (WorkoutPlanExercise & { exercise?: Exercise })[];
  planId?: string;
  onSubmit: (data: CreateWorkoutLogInput) => Promise<void>;
  isLoading?: boolean;
  date?: string;
}

interface SetEntry {
  setNumber: number;
  reps: number;
  weightKg: number;
}

interface ExerciseLogEntry {
  exerciseId: string;
  exerciseName: string;
  notes: string;
  sets: SetEntry[];
}

/** 训练记录表单 — 动态组数输入 weight × reps */
const LogForm: React.FC<LogFormProps> = ({ planExercises, planId, onSubmit, isLoading, date }) => {
  const today = date || new Date().toISOString().split('T')[0];

  const initEntries = (): ExerciseLogEntry[] => {
    if (!planExercises) return [];
    return planExercises.map((pe) => ({
      exerciseId: pe.exerciseId,
      exerciseName: pe.exercise?.name || '未知',
      notes: '',
      sets: Array.from({ length: pe.sets || 3 }, (_, i) => ({
        setNumber: i + 1,
        reps: pe.reps || 10,
        weightKg: 0,
      })),
    }));
  };

  const [entries, setEntries] = useState<ExerciseLogEntry[]>(initEntries);
  const [logDate, setLogDate] = useState(today);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState('');

  const addSet = (entryIdx: number) => {
    setEntries(
      entries.map((entry, i) => {
        if (i !== entryIdx) return entry;
        return {
          ...entry,
          sets: [...entry.sets, { setNumber: entry.sets.length + 1, reps: entry.sets[0]?.reps || 10, weightKg: 0 }],
        };
      }),
    );
  };

  const removeSet = (entryIdx: number, setIdx: number) => {
    setEntries(
      entries.map((entry, i) => {
        if (i !== entryIdx) return entry;
        const newSets = entry.sets
          .filter((_, si) => si !== setIdx)
          .map((s, si) => ({ ...s, setNumber: si + 1 }));
        return { ...entry, sets: newSets };
      }),
    );
  };

  const updateSet = (entryIdx: number, setIdx: number, field: keyof SetEntry, value: number) => {
    setEntries(
      entries.map((entry, i) => {
        if (i !== entryIdx) return entry;
        return {
          ...entry,
          sets: entry.sets.map((s, si) => (si === setIdx ? { ...s, [field]: value } : s)),
        };
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      planId,
      date: logDate,
      durationMinutes,
      notes,
      exercises: entries.map((entry) => ({
        exerciseId: entry.exerciseId,
        notes: entry.notes,
        sets: entry.sets.map((s) => ({
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
        })),
      })),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="训练日期"
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="时长(分钟)"
          type="number"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />
      </Box>

      <TextField
        fullWidth
        label="训练备注（可选）"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        multiline
        rows={2}
        sx={{ mb: 3 }}
      />

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        动作记录
      </Typography>

      {entries.map((entry, entryIdx) => (
        <Paper key={entryIdx} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {entry.exerciseName}
          </Typography>

          {/* 表头 */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, px: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ width: 50 }}>
              组
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              重量 (kg)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              次数
            </Typography>
            <Box sx={{ width: 40 }} />
          </Box>

          {entry.sets.map((set, setIdx) => (
            <Box key={setIdx} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ width: 50, textAlign: 'center', fontWeight: 600 }}>
                {set.setNumber}
              </Typography>
              <TextField
                size="small"
                type="number"
                value={set.weightKg || ''}
                onChange={(e) => updateSet(entryIdx, setIdx, 'weightKg', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.5 }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                type="number"
                value={set.reps || ''}
                onChange={(e) => updateSet(entryIdx, setIdx, 'reps', parseInt(e.target.value, 10) || 0)}
                inputProps={{ min: 0 }}
                sx={{ flex: 1 }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => removeSet(entryIdx, setIdx)}
                disabled={entry.sets.length <= 1}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}

          <Button size="small" startIcon={<Add />} onClick={() => addSet(entryIdx)} sx={{ mt: 0.5 }}>
            添加一组
          </Button>
        </Paper>
      ))}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isLoading || entries.length === 0}
        sx={{ mt: 2 }}
      >
        {isLoading ? '保存中...' : '保存训练记录'}
      </Button>
    </Box>
  );
};

export default LogForm;
