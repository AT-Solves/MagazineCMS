import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Button, Paper,
  IconButton, Tooltip, Divider, Grid,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import { useContentStore } from '../../stores/content.store';
import { STATUS_COLOR_MAP } from '../../constants/magazine';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) cells.push(null);
  return cells;
}

export default function EditorialCalendarPage() {
  const navigate = useNavigate();
  const { items } = useContentStore();
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();
  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach((item) => {
      [item.deadline, item.scheduledAt, item.publishedAt].forEach((d) => {
        if (!d) return;
        const key = new Date(d).toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
      });
    });
    return map;
  }, [items]);

  const selectedItems = selectedDay ? (itemsByDay.get(selectedDay.toDateString()) ?? []) : [];

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday   = () => { setCurrent(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(today); };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Editorial Calendar</Typography>
          <Typography variant="body2" color="text.secondary">Deadlines, scheduled and published articles</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Today"><IconButton onClick={goToday}><TodayIcon /></IconButton></Tooltip>
          <IconButton onClick={prevMonth}><ArrowBackIosIcon fontSize="small" /></IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ minWidth: 200, textAlign: 'center' }}>
            {current.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Typography>
          <IconButton onClick={nextMonth}><ArrowForwardIosIcon fontSize="small" /></IconButton>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate('/content/new')}>New Article</Button>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
        {[
          { label: 'Deadline', color: 'error' },
          { label: 'Scheduled', color: 'info' },
          { label: 'Published', color: 'success' },
        ].map((l) => (
          <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label={l.label} size="small" color={l.color as 'error' | 'info' | 'success'} sx={{ height: 18, fontSize: '0.65rem' }} />
          </Box>
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>Click a day to see details</Typography>
      </Box>

      {/* Day headers */}
      <Grid container sx={{ mb: 0.5 }}>
        {WEEK_DAYS.map((d) => (
          <Grid item key={d} sx={{ flex: '0 0 calc(100% / 7)', maxWidth: 'calc(100% / 7)' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 0.5 }}>{d}</Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {cells.map((date, i) => {
          const key = date ? date.toDateString() : `empty-${i}`;
          const dayItems = date ? (itemsByDay.get(date.toDateString()) ?? []) : [];
          const isToday = date ? isSameDay(date, today) : false;
          const isSelected = date && selectedDay ? isSameDay(date, selectedDay) : false;
          const hasPastDeadline = dayItems.some((item) => item.deadline && isSameDay(new Date(item.deadline), date!) && new Date(item.deadline) < today && item.status !== 'published');

          return (
            <Paper
              key={key}
              variant="outlined"
              onClick={() => date && setSelectedDay(date)}
              sx={{
                minHeight: { xs: 60, sm: 90 },
                p: 0.75,
                cursor: date ? 'pointer' : 'default',
                bgcolor: isSelected ? '#e8f5e9' : isToday ? '#f1f8e9' : date ? 'white' : 'grey.50',
                borderColor: isSelected ? 'primary.main' : isToday ? 'primary.light' : hasPastDeadline ? 'error.light' : 'divider',
                borderWidth: isSelected || isToday ? 2 : 1,
                '&:hover': date ? { bgcolor: 'grey.100' } : {},
                overflow: 'hidden',
              }}
            >
              {date && (
                <>
                  <Typography
                    variant="caption"
                    fontWeight={isToday ? 700 : 400}
                    sx={{
                      display: 'block', textAlign: 'right',
                      color: isToday ? 'primary.main' : hasPastDeadline ? 'error.main' : 'text.primary',
                      fontSize: '0.72rem',
                    }}
                  >
                    {date.getDate()}
                  </Typography>
                  <Box sx={{ mt: 0.25 }}>
                    {dayItems.slice(0, 2).map((item, j) => {
                      const isDeadline = item.deadline && isSameDay(new Date(item.deadline), date);
                      const isScheduled = item.scheduledAt && isSameDay(new Date(item.scheduledAt), date);
                      const color = isDeadline ? 'error' : isScheduled ? 'info' : 'success';
                      return (
                        <Chip
                          key={`${item.id}-${j}`}
                          label={item.title}
                          size="small"
                          color={color as 'error' | 'info' | 'success'}
                          onClick={(e) => { e.stopPropagation(); navigate(`/content/${item.id}/edit`); }}
                          sx={{ height: 16, fontSize: '0.55rem', mb: 0.25, maxWidth: '100%', display: 'flex', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', px: 0.75 } }}
                        />
                      );
                    })}
                    {dayItems.length > 2 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        +{dayItems.length - 2} more
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* Selected day detail */}
      {selectedDay && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {selectedDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>
            {selectedItems.length === 0 ? (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">Nothing scheduled for this day.</Typography>
                <Button size="small" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => navigate('/content/new')}>Create Article with This Deadline</Button>
              </Box>
            ) : (
              <>
                <Divider sx={{ mb: 1.5 }} />
                {selectedItems.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip
                      label={item.status}
                      size="small"
                      color={(STATUS_COLOR_MAP[item.status] ?? 'default') as 'default' | 'warning' | 'info' | 'success' | 'error'}
                      sx={{ minWidth: 80, height: 20, fontSize: '0.65rem' }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.category} · {item.author}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, flexShrink: 0 }}>
                      {item.deadline && isSameDay(new Date(item.deadline), selectedDay) && (
                        <Typography variant="caption" color="error.main" fontWeight={600}>Deadline</Typography>
                      )}
                      {item.scheduledAt && isSameDay(new Date(item.scheduledAt), selectedDay) && (
                        <Typography variant="caption" color="info.main" fontWeight={600}>Scheduled</Typography>
                      )}
                    </Box>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => navigate(`/content/${item.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
