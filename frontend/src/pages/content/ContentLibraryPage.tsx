import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, InputAdornment, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
  Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import { useContentStore } from '../../stores/content.store';
import { CONTENT_TYPES, CONTENT_STATUSES, CATEGORIES, STATUS_COLOR_MAP } from '../../constants/magazine';

export default function ContentLibraryPage() {
  const navigate = useNavigate();
  const { filter, setFilter, clearFilter, filteredItems, deleteItem } = useContentStore();
  const items = filteredItems();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilter = !!(filter.search || filter.status || filter.type || filter.category || filter.author);

  const confirmDelete = () => {
    if (deleteId) { deleteItem(deleteId); setDeleteId(null); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Content Library</Typography>
          <Typography variant="body2" color="text.secondary">{items.length} item{items.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/content/new')}>
          New Content
        </Button>
      </Box>

      {/* Search + Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search title, category, or author…" size="small" sx={{ flex: 1, minWidth: 220 }}
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value })}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Tooltip title="Toggle filters">
          <IconButton onClick={() => setShowFilters((v) => !v)} color={showFilters ? 'primary' : 'default'}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        {hasActiveFilter && (
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearFilter} size="small">
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {showFilters && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filter.status} label="Status" onChange={(e) => setFilter({ status: e.target.value })}>
              <MenuItem value="">All Statuses</MenuItem>
              {CONTENT_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Type</InputLabel>
            <Select value={filter.type} label="Type" onChange={(e) => setFilter({ type: e.target.value })}>
              <MenuItem value="">All Types</MenuItem>
              {CONTENT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Category</InputLabel>
            <Select value={filter.category} label="Category" onChange={(e) => setFilter({ category: e.target.value })}>
              <MenuItem value="">All Categories</MenuItem>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      )}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Words</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No content matches your filters.</Typography>
                  {hasActiveFilter && <Button onClick={clearFilter} sx={{ mt: 1 }}>Clear filters</Button>}
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/content/${item.id}/edit`)}>
                <TableCell sx={{ maxWidth: 280 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{item.title}</Typography>
                  {item.isCoverStory && <Chip label="Cover Story" size="small" color="secondary" sx={{ ml: 0.5, height: 16, fontSize: '0.65rem' }} />}
                  {item.isFeatured && <Chip label="Featured" size="small" color="primary" sx={{ ml: 0.5, height: 16, fontSize: '0.65rem' }} />}
                  {item.subtitle && <Typography variant="caption" color="text.secondary" display="block" noWrap>{item.subtitle}</Typography>}
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{CONTENT_TYPES.find((t) => t.value === item.type)?.label ?? item.type}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{item.category}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={CONTENT_STATUSES.find((s) => s.value === item.status)?.label ?? item.status} size="small" color={STATUS_COLOR_MAP[item.status] ?? 'default'} />
                </TableCell>
                <TableCell><Typography variant="caption">{item.author}</Typography></TableCell>
                <TableCell><Typography variant="caption">{item.wordCount.toLocaleString()}</Typography></TableCell>
                <TableCell><Typography variant="caption">{new Date(item.updatedAt).toLocaleDateString()}</Typography></TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => navigate(`/content/${item.id}/edit`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Content</DialogTitle>
        <DialogContent>
          <DialogContentText>This will permanently delete the content item. This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
