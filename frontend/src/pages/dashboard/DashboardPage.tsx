import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PublishIcon from '@mui/icons-material/Publish';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useContentStore } from '../../stores/content.store';
import { useAuthStore } from '../../stores/auth.store';
import { CONTENT_TYPES, CONTENT_STATUSES, STATUS_COLOR_MAP, WORKFLOW_STAGES } from '../../constants/magazine';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { items } = useContentStore();
  const { user } = useAuthStore();

  const published  = items.filter((i) => i.status === 'published');
  const inReview   = items.filter((i) => i.status === 'in_review');
  const drafts     = items.filter((i) => i.status === 'draft');
  const totalViews = items.reduce((sum, i) => sum + i.views, 0);

  const stats = [
    { label: 'Total Content',   value: items.length,          color: '#2E7D32', icon: <ArticleIcon /> },
    { label: 'Published',       value: published.length,       color: '#1565C0', icon: <CheckCircleIcon /> },
    { label: 'In Review',       value: inReview.length,        color: '#AB47BC', icon: <RateReviewIcon /> },
    { label: 'Total Views',     value: totalViews.toLocaleString(), color: '#E65100', icon: <VisibilityIcon /> },
  ];

  const recent = [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6);

  const workflowCounts = WORKFLOW_STAGES.map((stage) => ({
    stage,
    label: CONTENT_STATUSES.find((s) => s.value === stage)?.label ?? stage,
    count: items.filter((i) => i.status === stage).length,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.fullName?.split(' ')[0] ?? 'there'} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<BarChartIcon />} onClick={() => navigate('/analytics')} size="small">Analytics</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/content/new')}>New Content</Button>
        </Box>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card sx={{ borderTop: `4px solid ${s.color}` }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                </Box>
                <Box sx={{ color: s.color, opacity: 0.8 }}>{s.icon}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent content */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h6" fontWeight={600}>Recent Activity</Typography>
                <Button size="small" onClick={() => navigate('/content')}>View All</Button>
              </Box>
              <List disablePadding>
                {recent.map((item, i) => (
                  <React.Fragment key={item.id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem
                      sx={{ px: 0, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1 }}
                      onClick={() => navigate(`/content/${item.id}/edit`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: '0.75rem' }}>
                          {item.type.slice(0, 2).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600} noWrap>{item.title}</Typography>}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.25 }}>
                            <Chip label={CONTENT_STATUSES.find((s) => s.value === item.status)?.label ?? item.status} size="small" color={STATUS_COLOR_MAP[item.status] ?? 'default'} sx={{ height: 18, fontSize: '0.65rem' }} />
                            <Typography variant="caption" color="text.secondary">{item.category}</Typography>
                            <Typography variant="caption" color="text.disabled">· {item.author}</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 1 }}>
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
                {recent.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No content yet. <Button size="small" onClick={() => navigate('/content/new')}>Create your first article</Button>
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow summary + Quick actions */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Workflow Pipeline</Typography>
              {workflowCounts.map(({ stage, label, count }) => (
                <Box key={stage} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ width: 90, flexShrink: 0 }}>{label}</Typography>
                  <Box sx={{ flex: 1, height: 8, bgcolor: 'grey.100', borderRadius: 4, mx: 1 }}>
                    <Box
                      sx={{ height: '100%', bgcolor: STATUS_COLOR_MAP[stage] === 'success' ? 'success.main' : STATUS_COLOR_MAP[stage] === 'info' ? 'info.main' : 'primary.main', borderRadius: 4, width: items.length ? `${Math.min(100, (count / items.length) * 100)}%` : '0%', transition: 'width 0.4s' }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ width: 20, textAlign: 'right' }}>{count}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Quick Actions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" fullWidth startIcon={<AddIcon />} onClick={() => navigate('/content/new')}>New Article</Button>
                <Button variant="outlined" fullWidth startIcon={<RateReviewIcon />} onClick={() => navigate('/workflow')}>Review Queue ({inReview.length})</Button>
                <Button variant="outlined" fullWidth startIcon={<PublishIcon />} onClick={() => navigate('/publishing')}>Publishing Center</Button>
                <Button variant="outlined" fullWidth startIcon={<BarChartIcon />} onClick={() => navigate('/analytics')}>Analytics</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
