import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Button, IconButton, Tooltip, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { useContentStore } from '../../stores/content.store';
import { WORKFLOW_STAGES, CONTENT_STATUSES, CONTENT_TYPES, PRIORITIES, NEXT_STAGE, PREV_STAGE, STATUS_COLOR_MAP, type WorkflowStage, type ContentStatus } from '../../constants/magazine';

const COLUMN_COLORS: Record<WorkflowStage, string> = {
  brief:     '#F3E5F5',
  draft:     '#FFF3E0',
  in_review: '#E3F2FD',
  approved:  '#E8F5E9',
  scheduled: '#E0F2F1',
  published: '#E8F5E9',
};

const PRIORITY_COLOR: Record<string, 'error' | 'warning' | 'default' | 'info'> = {
  urgent: 'error',
  high:   'warning',
  medium: 'default',
  low:    'info',
};

export default function WorkflowBoardPage() {
  const navigate = useNavigate();
  const { items, moveStage } = useContentStore();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<WorkflowStage | null>(null);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Workflow Board</Typography>
          <Typography variant="body2" color="text.secondary">{items.length} items across the pipeline</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/content/new')}>New Content</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
        {WORKFLOW_STAGES.map((stage) => {
          const columnItems = items.filter((i) => i.status === stage);
          const label = CONTENT_STATUSES.find((s) => s.value === stage)?.label ?? stage;
          const isDragOver = dragOverStage === stage;

          return (
            <Box
              key={stage}
              sx={{ minWidth: 260, width: 260, flexShrink: 0 }}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData('text/plain');
                if (itemId) moveStage(itemId, stage as ContentStatus);
                setDragId(null);
                setDragOverStage(null);
              }}
            >
              {/* Column header */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: isDragOver ? `${COLUMN_COLORS[stage]}cc` : COLUMN_COLORS[stage],
                  px: 2, py: 1.25, mb: 1.5, borderRadius: 1.5,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  outline: isDragOver ? '2px dashed' : 'none',
                  outlineColor: 'primary.main',
                  transition: 'outline 0.1s',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
                <Chip label={columnItems.length} size="small" color={STATUS_COLOR_MAP[stage] as 'default' | 'warning' | 'info' | 'success' | 'secondary'} />
              </Paper>

              {/* Drop zone */}
              <Box
                sx={{
                  display: 'flex', flexDirection: 'column', gap: 1.5,
                  minHeight: isDragOver ? 80 : 'auto',
                  borderRadius: 1.5, transition: 'background 0.15s',
                  bgcolor: isDragOver ? 'action.hover' : 'transparent',
                  p: isDragOver ? 0.5 : 0,
                }}
              >
                {columnItems.map((item) => {
                  const next = NEXT_STAGE[stage as WorkflowStage];
                  const prev = PREV_STAGE[stage as WorkflowStage];
                  const typLabel = CONTENT_TYPES.find((t) => t.value === item.type)?.label ?? item.type;
                  const priLabel = PRIORITIES.find((p) => p.value === item.priority)?.label ?? item.priority;

                  return (
                    <Card
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragId(item.id);
                      }}
                      onDragEnd={() => { setDragId(null); setDragOverStage(null); }}
                      sx={{
                        borderLeft: `3px solid ${item.priority === 'urgent' ? '#f44336' : item.priority === 'high' ? '#ff9800' : '#e0e0e0'}`,
                        opacity: dragId === item.id ? 0.5 : 1,
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' },
                      }}
                    >
                      <CardContent sx={{ pb: '12px !important', pt: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <DragIndicatorIcon sx={{ fontSize: 14, color: 'text.disabled', mr: 0.5, mt: 0.25, flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600} sx={{ flex: 1, lineHeight: 1.3, mr: 0.5 }}>
                            {item.title}
                          </Typography>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => navigate(`/content/${item.id}/edit`)} sx={{ p: 0.25 }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 0.75 }}>
                          {item.category} · {item.author}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          <Chip label={typLabel} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          <Chip label={priLabel} size="small" color={PRIORITY_COLOR[item.priority] ?? 'default'} sx={{ height: 18, fontSize: '0.65rem' }} />
                          {item.isCoverStory && <Chip label="Cover" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem' }} />}
                        </Box>

                        {item.deadline && (
                          <Typography variant="caption" color={new Date(item.deadline) < new Date() ? 'error.main' : 'text.secondary'} display="block" sx={{ mb: 0.75 }}>
                            Due: {new Date(item.deadline).toLocaleDateString()}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {prev && (
                            <Tooltip title={`Move to ${CONTENT_STATUSES.find((s) => s.value === prev)?.label}`}>
                              <Button size="small" variant="text" startIcon={<ArrowBackIcon sx={{ fontSize: 12 }} />} onClick={() => moveStage(item.id, prev as ContentStatus)} sx={{ fontSize: '0.65rem', py: 0, px: 0.75, minWidth: 'auto' }}>
                                {CONTENT_STATUSES.find((s) => s.value === prev)?.label}
                              </Button>
                            </Tooltip>
                          )}
                          {next && (
                            <Tooltip title={`Move to ${CONTENT_STATUSES.find((s) => s.value === next)?.label}`}>
                              <Button size="small" variant="contained" endIcon={<ArrowForwardIcon sx={{ fontSize: 12 }} />} onClick={() => moveStage(item.id, next as ContentStatus)} sx={{ fontSize: '0.65rem', py: 0, px: 0.75, minWidth: 'auto' }}>
                                {CONTENT_STATUSES.find((s) => s.value === next)?.label}
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
                {columnItems.length === 0 && (
                  <Box sx={{ border: '1px dashed', borderColor: isDragOver ? 'primary.main' : 'divider', borderRadius: 1.5, p: 2, textAlign: 'center', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" color={isDragOver ? 'primary.main' : 'text.disabled'}>
                      {isDragOver ? 'Drop here' : 'No items'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
