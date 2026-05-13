import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  Table, TableBody, TableCell, TableHead, TableRow, Switch,
  FormControlLabel, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PublishIcon from '@mui/icons-material/Publish';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';

import { useContentStore, type ContentItem } from '../../stores/content.store';
import { LOCALES, PLATFORMS } from '../../constants/magazine';
import { useNavigate } from 'react-router-dom';

interface CheckItem {
  id: string;
  label: string;
  passed: boolean;
  severity: 'error' | 'warning';
}

function getChecklist(item: ContentItem): CheckItem[] {
  const bodyText = item.body.replace(/<[^>]*>/g, '').trim();
  return [
    { id: 'title',      label: 'Title is present and descriptive (>10 chars)',  passed: item.title.length > 10,          severity: 'error' },
    { id: 'body',       label: 'Body content has substance (>200 characters)',  passed: bodyText.length > 200,            severity: 'error' },
    { id: 'category',   label: 'Category is assigned',                          passed: !!item.category,                  severity: 'error' },
    { id: 'word_count', label: 'Word count meets minimum (300+ words)',         passed: item.wordCount >= 300,            severity: 'warning' },
    { id: 'seo_title',  label: 'SEO title is set',                             passed: !!item.seoTitle,                  severity: 'warning' },
    { id: 'seo_desc',   label: 'Meta description is set',                       passed: !!item.seoDescription,            severity: 'warning' },
    { id: 'tags',       label: 'At least 2 tags assigned',                      passed: item.tags.length >= 2,            severity: 'warning' },
    { id: 'focus_kw',   label: 'Focus keyword is defined',                      passed: !!item.focusKeyword,              severity: 'warning' },
  ];
}

export default function PublishingCenterPage() {
  const navigate = useNavigate();
  const { items, updateItem } = useContentStore();
  const [autoPublish, setAutoPublish] = useState(true);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [schedulePlatform, setSchedulePlatform] = useState('web_app');
  const [checklistTarget, setChecklistTarget] = useState<ContentItem | null>(null);

  const scheduled  = items.filter((i) => i.status === 'scheduled');
  const published  = items.filter((i) => i.status === 'published').sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());
  const approved   = items.filter((i) => i.status === 'approved');

  const totalViews = published.reduce((s, i) => s + i.views, 0);
  const thisMonth  = published.filter((i) => i.publishedAt && new Date(i.publishedAt).getMonth() === new Date().getMonth()).length;

  const handlePublishNow = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setChecklistTarget(item);
  };

  const confirmPublish = () => {
    if (!checklistTarget) return;
    updateItem(checklistTarget.id, { status: 'published', publishedAt: new Date().toISOString() });
    setChecklistTarget(null);
  };

  const handleCancelSchedule = (id: string) => {
    updateItem(id, { status: 'approved', scheduledAt: undefined });
  };

  const handleConfirmSchedule = () => {
    if (!scheduleId || !scheduleDate) return;
    updateItem(scheduleId, { status: 'scheduled', scheduledAt: new Date(scheduleDate).toISOString(), platform: schedulePlatform });
    setScheduleId(null);
    setScheduleDate('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Publishing Center</Typography>
          <Typography variant="body2" color="text.secondary">Schedule and publish content across channels</Typography>
        </Box>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Scheduled',          value: scheduled.length,            icon: <ScheduleIcon />,      color: '#AB47BC' },
          { label: 'Published This Month',value: thisMonth,                  icon: <PublishIcon />,       color: '#26A69A' },
          { label: 'Awaiting Approval',  value: approved.length,             icon: <CalendarMonthIcon />, color: '#1565C0' },
          { label: 'Total Views',        value: totalViews.toLocaleString(), icon: <PublishIcon />,       color: '#2E7D32' },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                </Box>
                <Box sx={{ color: s.color }}>{s.icon}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Scheduled */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Scheduled Publications</Typography>
                <FormControlLabel control={<Switch checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />} label="Auto-publish" />
              </Box>
              {scheduled.length === 0 ? (
                <Alert severity="info">No scheduled content. Approve content and schedule it below.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Publish At</TableCell>
                      <TableCell>Locale</TableCell>
                      <TableCell>Platform</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduled.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 160 }}>{item.title}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : '—'}</Typography></TableCell>
                        <TableCell><Chip label={(LOCALES.find((l) => l.value === item.locale)?.label ?? item.locale).slice(0, 2).toUpperCase()} size="small" /></TableCell>
                        <TableCell><Typography variant="body2">{PLATFORMS.find((p) => p.value === item.platform)?.label ?? item.platform}</Typography></TableCell>
                        <TableCell>
                          <Button size="small" color="success" variant="outlined" onClick={() => handlePublishNow(item.id)} sx={{ mr: 0.5 }}>Publish Now</Button>
                          <Button size="small" color="error" variant="text" onClick={() => handleCancelSchedule(item.id)}>Cancel</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Approved — ready to schedule */}
          {approved.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Ready to Schedule ({approved.length})</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {approved.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 180 }}>{item.title}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{item.type.replace('_', ' ')}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{item.author}</Typography></TableCell>
                        <TableCell>
                          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { setScheduleId(item.id); setScheduleDate(''); }}>Schedule</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Recently published */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Recently Published</Typography>
                <Button size="small" onClick={() => navigate('/content')}>View All</Button>
              </Box>
              {published.slice(0, 8).map((item) => (
                <Box key={item.id} sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight={500} noWrap>{item.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.views.toLocaleString()} views</Typography>
                    <Typography variant="caption" color="text.secondary">{PLATFORMS.find((p) => p.value === item.platform)?.label ?? item.platform}</Typography>
                  </Box>
                </Box>
              ))}
              {published.length === 0 && <Typography variant="body2" color="text.secondary">No published content yet.</Typography>}
              <Alert severity="info" sx={{ mt: 2 }} icon={<PublishIcon />}>
                {autoPublish ? 'Content is auto-published at scheduled time when approved.' : 'Auto-publish is off. Publish manually from the scheduled list.'}
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pre-publish checklist dialog */}
      <Dialog open={!!checklistTarget} onClose={() => setChecklistTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PublishIcon color="primary" /> Pre-Publish Checklist
        </DialogTitle>
        <DialogContent>
          {checklistTarget && (() => {
            const checklist = getChecklist(checklistTarget);
            const errors = checklist.filter((c) => !c.passed && c.severity === 'error');
            const warnings = checklist.filter((c) => !c.passed && c.severity === 'warning');
            return (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Reviewing: <strong>{checklistTarget.title}</strong>
                </Typography>
                <List dense disablePadding>
                  {checklist.map((check) => (
                    <ListItem key={check.id} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {check.passed
                          ? <CheckCircleIcon color="success" fontSize="small" />
                          : check.severity === 'error'
                            ? <CancelIcon color="error" fontSize="small" />
                            : <WarningIcon color="warning" fontSize="small" />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" color={check.passed ? 'text.primary' : check.severity === 'error' ? 'error.main' : 'warning.dark'}>{check.label}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
                {errors.length > 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>{errors.length} critical issue{errors.length > 1 ? 's' : ''} must be resolved before publishing.</Alert>
                )}
                {errors.length === 0 && warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>{warnings.length} optional improvement{warnings.length > 1 ? 's' : ''} recommended — you can still publish.</Alert>
                )}
                {errors.length === 0 && warnings.length === 0 && (
                  <Alert severity="success" sx={{ mt: 2 }}>All checks passed! Ready to publish.</Alert>
                )}
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChecklistTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PublishIcon />}
            disabled={!!(checklistTarget && getChecklist(checklistTarget).some((c) => !c.passed && c.severity === 'error'))}
            onClick={confirmPublish}
          >
            Publish Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={!!scheduleId} onClose={() => setScheduleId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Schedule Publication</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Publish Date & Time" type="datetime-local" fullWidth
            value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Platform" select fullWidth value={schedulePlatform} onChange={(e) => setSchedulePlatform(e.target.value)}
            SelectProps={{ native: false }}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmSchedule} disabled={!scheduleDate}>Schedule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
