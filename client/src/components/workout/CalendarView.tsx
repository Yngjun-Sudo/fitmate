import React from 'react';
import {
  Box, Typography, IconButton, Paper, Chip,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CalendarViewProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  markedDates: Date[];
  onDateClick?: (date: Date) => void;
}

/** 月度训练日历视图 */
const CalendarView: React.FC<CalendarViewProps> = ({
  currentMonth, onMonthChange, markedDates, onDateClick,
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const hasLog = (day: Date) => markedDates.some((d) => isSameDay(d, day));

  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
  };

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
  };

  return (
    <Paper sx={{ p: 2 }}>
      {/* 月份切换 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={prevMonth} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" fontWeight={600}>
          {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
        </Typography>
        <IconButton onClick={nextMonth} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      {/* 星期标题 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
        {weekDays.map((day) => (
          <Typography key={day} variant="caption" align="center" fontWeight={600} color="text.secondary">
            {day}
          </Typography>
        ))}
      </Box>

      {/* 日期格子 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const marked = hasLog(day);

          return (
            <Box
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              sx={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                cursor: 'pointer',
                opacity: inMonth ? 1 : 0.3,
                bgcolor: today ? 'primary.main' : 'transparent',
                color: today ? 'white' : 'text.primary',
                '&:hover': { bgcolor: today ? 'primary.dark' : 'action.hover' },
                position: 'relative',
              }}
            >
              <Typography variant="body2">{format(day, 'd')}</Typography>
              {marked && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: today ? 'white' : 'secondary.main',
                    mt: 0.25,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default CalendarView;
