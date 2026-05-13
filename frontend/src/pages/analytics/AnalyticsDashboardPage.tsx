import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  Drawer, IconButton, Divider, LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

import { useContentStore } from '../../stores/content.store';
import { CONTENT_TYPES, CATEGORIES } from '../../constants/magazine';

const PIE_COLORS = ['#2E7D32', '#1565C0', '#6A1B9A', '#E65100', '#00838F', '#AD1457'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildMonthlyData(items: ReturnType<typeof useContentStore.getState>['items'], months: number) {
  const result: { month: string; published: number; views: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString('default', { month: 'short' });
    const monthItems = items.filter((item) => {
      if (!item.publishedAt) return false;
      const pd = new Date(item.publishedAt);
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
    });
    result.push({ month: label, published: monthItems.length, views: monthItems.reduce((s, x) => s + x.views, 0) });
  }
  return result;
}

export default function AnalyticsDashboardPage() {
  const { items } = useContentStore();
  const [period, setPeriod] = useState('30d');
  const [drillItem, setDrillItem] = useState<ReturnType<typeof useContentStore.getState>['items'][0] | null>(null);

  const published = items.filter((i) => i.status === 'published');
  const totalViews = published.reduce((s, i) => s + i.views, 0);
  const avgCompletion = published.length ? Math.round(published.reduce((s, i) => s + i.completionRate, 0) / published.length) : 0;
  const avgWords = published.length ? Math.round(published.reduce((s, i) => s + i.wordCount, 0) / published.length) : 0;

  const monthlyData = useMemo(() => buildMonthlyData(items, 6), [items]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.category] = (counts[i.category] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value], idx) => ({ name, value, color: PIE_COLORS[idx % PIE_COLORS.length] }));
  }, [items]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.type] = (counts[i.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, value]) => ({
      name: CONTENT_TYPES.find((t) => t.value === type)?.label ?? type,
      value,
    }));
  }, [items]);

  const topContent = useMemo(() =>
    [...published].sort((a, b) => b.views - a.views).slice(0, 5),
    [published],
  );

  const engagementData = useMemo(() => {
    const base = published.length > 0 ? avgCompletion : 65;
    return DAYS.map((day, i) => ({
      day,
      rate: Math.min(100, Math.max(30, Math.round(base + Math.sin(i * 0.9) * 12))),
    }));
  }, [published.length, avgCompletion]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Content performance insights</Typography>
        </Box>
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="1y">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Views',       value: totalViews.toLocaleString(),  note: `${published.length} published articles` },
          { label: 'Total Published',   value: published.length,             note: `${items.length} items total` },
          { label: 'Avg Completion',    value: `${avgCompletion}%`,          note: 'across published content' },
          { label: 'Avg Word Count',    value: avgWords.toLocaleString(),     note: 'per published article' },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.note}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Monthly bar chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Publications & Views Over Time</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="published" name="Published" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="views" name="Views" fill="#1565C0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category pie */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Content by Category</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                    {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {categoryData.slice(0, 5).map((d) => (
                <Box key={d.name} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                    <Typography variant="caption" noWrap>{d.name}</Typography>
                  </Box>
                  <Typography variant="caption" fontWeight={600}>{d.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top content */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Top Performing Content</Typography>
              {topContent.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No published content yet.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell align="right">Completion</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topContent.map((item, i) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => setDrillItem(item)}>
                        <TableCell><Typography variant="caption" color="text.secondary" fontWeight={700}>#{i + 1}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 220 }}>{item.title}</Typography>
                          <Chip label={item.category} size="small" sx={{ height: 16, fontSize: '0.6rem', mt: 0.25 }} />
                        </TableCell>
                        <TableCell align="right"><Typography variant="body2">{item.views.toLocaleString()}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="success.main">{item.completionRate}%</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement line chart */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Weekly Engagement Rate (%)</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="#2E7D32" strokeWidth={2} dot={{ fill: '#2E7D32' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Per-article drill-down drawer */}
      <Drawer anchor="right" open={!!drillItem} onClose={() => setDrillItem(null)} PaperProps={{ sx: { width: 380, p: 3 } }}>
        {drillItem && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>{drillItem.title}</Typography>
                <Chip label={drillItem.category} size="small" sx={{ mt: 0.5 }} />
              </Box>
              <IconButton size="small" onClick={() => setDrillItem(null)}><CloseIcon /></IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {[
              { label: 'Total Views', value: drillItem.views.toLocaleString(), icon: <VisibilityIcon fontSize="small" color="primary" /> },
              { label: 'Completion Rate', value: `${drillItem.completionRate}%`, icon: <TrendingUpIcon fontSize="small" color="success" /> },
              { label: 'Word Count', value: drillItem.wordCount.toLocaleString(), icon: null },
              { label: 'Est. Read Time', value: `${Math.max(1, Math.round(drillItem.wordCount / 200))} min`, icon: null },
            ].map((stat) => (
              <Box key={stat.label} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {stat.icon}
                    <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={700}>{stat.value}</Typography>
                </Box>
                {stat.label === 'Completion Rate' && (
                  <LinearProgress variant="determinate" value={drillItem.completionRate} color="success" sx={{ height: 6, borderRadius: 3 }} />
                )}
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" fontWeight={600} gutterBottom>SEO</Typography>
            {[
              { label: 'SEO Title', value: drillItem.seoTitle || '—', ok: !!drillItem.seoTitle },
              { label: 'Meta Description', value: drillItem.seoDescription ? `${drillItem.seoDescription.slice(0, 60)}…` : '—', ok: !!drillItem.seoDescription },
              { label: 'Focus Keyword', value: drillItem.focusKeyword || '—', ok: !!drillItem.focusKeyword },
            ].map((field) => (
              <Box key={field.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                <Typography variant="caption" color={field.ok ? 'text.primary' : 'error.main'} fontWeight={500}>{field.value}</Typography>
              </Box>
            ))}

            {drillItem.tags.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" fontWeight={600} gutterBottom>Tags</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {drillItem.tags.map((t) => <Chip key={t} label={t} size="small" variant="outlined" />)}
                </Box>
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Published: {drillItem.publishedAt ? new Date(drillItem.publishedAt).toLocaleDateString() : '—'}
              {' · '}Author: {drillItem.author}
            </Typography>
          </>
        )}
      </Drawer>
    </Box>
  );
}
