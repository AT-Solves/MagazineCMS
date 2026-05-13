import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Tabs, Tab, Grid, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Switch, FormControlLabel, Alert,
  Paper, Snackbar, Divider, Tooltip, CircularProgress, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, List,
  ListItem, ListItemText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import PreviewIcon from '@mui/icons-material/Preview';
import HistoryIcon from '@mui/icons-material/History';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import RichTextEditor, { type RichTextEditorHandle } from '../../components/editor/RichTextEditor';
import AISuggestionsPanel from '../../components/ai/AISuggestionsPanel';
import ContentBlocksPanel from '../../components/editor/ContentBlocksPanel';
import AITextField from '../../components/ai/AITextField';
import AIBodyAssist from '../../components/ai/AIBodyAssist';
import { useContentStore, newContentItem, makeSlug, type ContentItem } from '../../stores/content.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  CONTENT_TYPES, CONTENT_STATUSES, CATEGORIES, AGE_GROUPS,
  READING_LEVELS, LOCALES, PLATFORMS, PRIORITIES, READ_TIME_TARGETS,
} from '../../constants/magazine';

type FormState = Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'completionRate'>;

interface Revision {
  savedAt: string;
  title: string;
  body: string;
  wordCount: number;
}

function loadRevisions(id: string): Revision[] {
  try { return JSON.parse(localStorage.getItem(`revisions-${id}`) ?? '[]'); } catch { return []; }
}

function saveRevision(id: string, title: string, body: string, wordCount: number, prev: Revision[]): Revision[] {
  const updated = [{ savedAt: new Date().toISOString(), title, body, wordCount }, ...prev].slice(0, 5);
  localStorage.setItem(`revisions-${id}`, JSON.stringify(updated));
  return updated;
}

function parseBlocks(html: string): string[] {
  if (!html || typeof DOMParser === 'undefined') return [];
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const children = Array.from(doc.body.children);
    if (children.length === 0 && doc.body.textContent?.trim()) return [`<p>${doc.body.textContent}</p>`];
    return children.map((el) => el.outerHTML);
  } catch { return []; }
}

const TAG_SUGGESTIONS = [
  'science', 'nature', 'history', 'arts', 'technology', 'sports',
  'health', 'maths', 'reading', 'environment', 'adventure', 'creativity', 'animals',
];

export default function ContentEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { getItem, addItem, updateItem } = useContentStore();
  const { user } = useAuthStore();

  const existing = id ? getItem(id) : null;
  const isNew = !existing;

  const [form, setForm] = useState<FormState>(() => {
    if (existing) {
      const { id: _id, createdAt: _c, updatedAt: _u, views: _v, completionRate: _cr, ...rest } = existing;
      return rest;
    }
    return { ...newContentItem(), author: user?.fullName ?? '', authorId: user?.id ?? '' };
  });

  const editorRef = useRef<RichTextEditorHandle>(null);

  // Persist active tab per content item
  const [tab, setTab] = useState(() => {
    if (id) { const s = sessionStorage.getItem(`editor-tab-${id}`); return s ? Number(s) : 0; }
    return 0;
  });
  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setTab(v);
    if (id) sessionStorage.setItem(`editor-tab-${id}`, String(v));
  };

  const [tagInput, setTagInput] = useState('');
  const [aiTagSuggestions, setAiTagSuggestions] = useState<string[]>([]);
  const [aiTagsLoading, setAiTagsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);

  // Auto-save
  const formRef = useRef(form);
  formRef.current = form;
  const lastSavedRef = useRef(JSON.stringify(form));
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [autoSaveTime, setAutoSaveTime] = useState<Date | null>(null);

  // Revision history
  const [revisions, setRevisions] = useState<Revision[]>(() => (id ? loadRevisions(id) : []));
  const [showRevisions, setShowRevisions] = useState(false);

  useEffect(() => {
    if (isNew && form.title) setForm((f) => ({ ...f, slug: makeSlug(f.title) }));
  }, [form.title, isNew]);

  useEffect(() => {
    if (!form.seoTitle && form.title) setForm((f) => ({ ...f, seoTitle: f.title.slice(0, 60) }));
  }, [form.title, form.seoTitle]);

  // Auto-save every 30 seconds for existing items
  useEffect(() => {
    if (isNew) return;
    const interval = setInterval(() => {
      const current = formRef.current;
      if (!current.title.trim()) return;
      const serialized = JSON.stringify(current);
      if (serialized === lastSavedRef.current) return;
      setAutoSaveStatus('saving');
      updateItem(id!, { ...current });
      lastSavedRef.current = serialized;
      setTimeout(() => { setAutoSaveStatus('saved'); setAutoSaveTime(new Date()); }, 400);
    }, 30000);
    return () => clearInterval(interval);
  }, [isNew, id, updateItem]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  // aiContext spans ALL tabs so AI suggestions are always fully context-aware
  const aiContext = useMemo(() => ({
    title: form.title,
    subtitle: form.subtitle,
    body: form.body,
    category: form.category,
    type: form.type,
    tags: form.tags,
    ageGroup: form.ageGroup,
    focusKeyword: form.focusKeyword,
  }), [form.title, form.subtitle, form.body, form.category, form.type, form.tags, form.ageGroup, form.focusKeyword]);

  const handleAISuggestTags = async () => {
    setAiTagsLoading(true);
    setAiTagSuggestions([]);
    try {
      const { suggestFieldValue } = await import('../../services/ai.service');
      const res = await suggestFieldValue({ fieldType: 'tags', currentValue: form.tags.join(', '), context: aiContext });
      const suggested = res.value.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t && !form.tags.includes(t));
      setAiTagSuggestions(suggested);
    } finally {
      setAiTagsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const handleSave = async (submitForReview = false) => {
    if (!form.title.trim()) { setSnackMsg('Please add a title before saving.'); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 350));
    const status = submitForReview ? 'in_review' : form.status;
    if (isNew) {
      const item = addItem({ ...form, status });
      setSnackMsg(submitForReview ? 'Submitted for review!' : 'Content saved!');
      navigate(`/content/${item.id}/edit`, { replace: true });
    } else {
      updateItem(id!, { ...form, status });
      lastSavedRef.current = JSON.stringify(form);
      setAutoSaveStatus('saved');
      setAutoSaveTime(new Date());
      // Save revision snapshot
      const updated = saveRevision(id!, form.title, form.body, currentWords, revisions);
      setRevisions(updated);
      setSnackMsg(submitForReview ? 'Submitted for review!' : 'Changes saved!');
    }
    setSaving(false);
  };

  const onApplyTitle = (title: string) => { setForm((f) => ({ ...f, title, slug: makeSlug(title) })); setSnackMsg('Title applied'); };
  const onApplyTags  = (tags: string[])  => { setForm((f) => ({ ...f, tags: [...new Set([...f.tags, ...tags])] })); setSnackMsg('Tags applied'); };
  const onApplySeo   = (seoTitle: string, seoDescription: string) => { setForm((f) => ({ ...f, seoTitle, seoDescription })); setSnackMsg('SEO fields applied'); };
  const onApplyBody  = (improved: string) => { setForm((f) => ({ ...f, body: improved })); setSnackMsg('Content updated'); };

  const wordTarget  = READ_TIME_TARGETS.find((r) => r.value === form.readTimeTarget)?.wordTarget ?? 1000;
  const currentWords = form.body.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const wordProgress = Math.min(100, Math.round((currentWords / wordTarget) * 100));

  const readabilityScore = useMemo(() => {
    const text = form.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || currentWords < 30) return null;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
    const avgLen = currentWords / Math.max(sentences.length, 1);
    if (avgLen <= 14) return { label: 'Easy', color: 'success' as const, tip: `Avg ${Math.round(avgLen)} words/sentence` };
    if (avgLen <= 20) return { label: 'Moderate', color: 'warning' as const, tip: `Avg ${Math.round(avgLen)} words/sentence` };
    return { label: 'Complex', color: 'error' as const, tip: `Avg ${Math.round(avgLen)} words/sentence — try shorter sentences` };
  }, [form.body, currentWords]);

  const canvasBlocks = useMemo(() => parseBlocks(form.body), [form.body]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/content')} size="small">Library</Button>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, minWidth: 0 }} noWrap>
          {form.title || (isNew ? 'New Content' : 'Untitled')}
        </Typography>
        <Chip
          label={CONTENT_STATUSES.find((s) => s.value === form.status)?.label ?? form.status}
          color={form.status === 'published' || form.status === 'approved' ? 'success' : form.status === 'in_review' ? 'info' : 'warning'}
          size="small"
        />
        {!isNew && (
          <Tooltip title="Full-page preview">
            <Button variant="outlined" color="secondary" startIcon={<PreviewIcon />} onClick={() => navigate(`/content/${id}/preview`)} size="small">
              Preview
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Content Blocks &amp; Media">
          <Button variant={showBlocks ? 'contained' : 'outlined'} color="warning" startIcon={<DashboardCustomizeIcon />} onClick={() => setShowBlocks((v) => !v)} size="small">
            Blocks
          </Button>
        </Tooltip>
        {!isNew && revisions.length > 0 && (
          <Tooltip title="Revision history">
            <Button variant="outlined" size="small" startIcon={<HistoryIcon />} onClick={() => setShowRevisions(true)}>
              History
            </Button>
          </Tooltip>
        )}
        {!isNew && autoSaveStatus !== 'idle' && (
          <Typography variant="caption" color={autoSaveStatus === 'saved' ? 'success.main' : 'text.secondary'} sx={{ whiteSpace: 'nowrap' }}>
            {autoSaveStatus === 'saving' ? 'Auto-saving…' : autoSaveTime ? `Auto-saved ${autoSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </Typography>
        )}
        <Tooltip title="AI Writing Assistant">
          <Button variant={showAI ? 'contained' : 'outlined'} startIcon={<AutoAwesomeIcon />} onClick={() => setShowAI((v) => !v)} size="small">
            AI Assist
          </Button>
        </Tooltip>
        <Button variant="outlined" startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />} onClick={() => handleSave(false)} disabled={saving} size="small">
          Save
        </Button>
        <Button variant="contained" startIcon={<SendIcon />} onClick={() => handleSave(true)} disabled={saving || form.status === 'published'} size="small">
          Submit for Review
        </Button>
      </Box>

      {/* Word count progress */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {currentWords} / {wordTarget} words ({wordProgress}%)
        </Typography>
        <Box sx={{ flex: 1, height: 4, bgcolor: 'grey.200', borderRadius: 2 }}>
          <Box sx={{ width: `${wordProgress}%`, height: '100%', bgcolor: wordProgress >= 100 ? 'success.main' : 'primary.main', borderRadius: 2, transition: 'width 0.3s' }} />
        </Box>
        {wordProgress >= 100 && <Typography variant="caption" color="success.main" fontWeight={600}>Target reached!</Typography>}
        {readabilityScore && (
          <Tooltip title={readabilityScore.tip}>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '0.8rem !important' }} />}
              label={`Readability: ${readabilityScore.label}`}
              size="small"
              color={readabilityScore.color}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* ── Main area ── */}
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tab label="Content" />
            <Tab label="SEO & Metadata" />
            <Tab label="Magazine Settings" />
            <Tab icon={<PreviewIcon fontSize="small" />} iconPosition="start" label="Canvas" sx={{ fontSize: '0.8rem' }} />
          </Tabs>

          {/* ── Tab 0: Content ── */}
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <AITextField
                    label="Title *" fullWidth
                    fieldType="title" aiContext={aiContext}
                    value={form.title} onChange={(v) => setField('title', v)}
                    placeholder="Write a compelling headline…"
                    inputProps={{ maxLength: 120 }}
                    InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">{form.title.length}/120</Typography></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <AITextField
                    label="Subtitle / Deck" fullWidth
                    fieldType="subtitle" aiContext={aiContext}
                    value={form.subtitle} onChange={(v) => setField('subtitle', v)}
                    placeholder="A one-sentence summary that draws readers in"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <AITextField
                    label="Author Byline" fullWidth size="small"
                    fieldType="byline" aiContext={aiContext}
                    value={form.byline || form.author} onChange={(v) => setField('byline', v)}
                    placeholder="e.g. By Jane Smith, Science Editor"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select value={form.priority} label="Priority" onChange={(e) => setField('priority', e.target.value)}>
                      {PRIORITIES.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Body Content</Typography>
                </Box>
                <AIBodyAssist
                  body={form.body}
                  aiContext={aiContext}
                  onApply={(html) => { setField('body', html); setSnackMsg('Body content updated by AI'); }}
                />
                <RichTextEditor
                  ref={editorRef}
                  value={form.body}
                  onChange={(html) => setField('body', html)}
                  placeholder="Start writing your content here… Use the toolbar for headings, lists, links, and more."
                  showWordCount
                  minHeight={350}
                />
              </Box>

              {/* Pull Quote */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <FormatQuoteIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={500}>Pull Quote</Typography>
                  <Typography variant="caption" color="text.secondary">(featured quote for layout)</Typography>
                </Box>
                <AITextField
                  fullWidth multiline rows={2} size="small"
                  fieldType="pull_quote" aiContext={aiContext}
                  placeholder="A memorable quote from the article to highlight in the layout"
                  value={form.pullQuote} onChange={(v) => setField('pullQuote', v)}
                  inputProps={{ maxLength: 250 }}
                />
              </Box>

              {/* Tags */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Typography variant="body2" fontWeight={500}>Tags</Typography>
                  <Tooltip title="AI-suggest tags from content">
                    <span>
                      <Chip
                        icon={aiTagsLoading ? <CircularProgress size={10} /> : <AutoFixHighIcon sx={{ fontSize: '0.85rem !important' }} />}
                        label="AI Suggest"
                        size="small"
                        clickable
                        color="primary"
                        variant="outlined"
                        onClick={handleAISuggestTags}
                        disabled={aiTagsLoading}
                        sx={{ fontSize: '0.68rem', height: 20 }}
                      />
                    </span>
                  </Tooltip>
                </Box>

                {/* Current tags */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {form.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" onDelete={() => removeTag(tag)} />
                  ))}
                </Box>

                {/* Manual input */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small" placeholder="Add tag…" value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }}
                    sx={{ width: 180 }}
                  />
                  <Button variant="outlined" size="small" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Add</Button>
                </Box>

                {/* AI-suggested tags */}
                {aiTagSuggestions.length > 0 && (
                  <Box sx={{ mt: 0.75, p: 1, bgcolor: '#e8f0fe', border: '1px solid #b3c7f7', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <AutoFixHighIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                      <Typography variant="caption" color="primary.main" fontWeight={600}>AI tag suggestions — click to add:</Typography>
                      <Chip label="✕" size="small" onClick={() => setAiTagSuggestions([])} sx={{ ml: 'auto', height: 16, fontSize: '0.6rem', cursor: 'pointer' }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {aiTagSuggestions.map((tag) => (
                        <Chip
                          key={tag} label={`+ ${tag}`} size="small"
                          color="primary" variant="outlined"
                          onClick={() => { addTag(tag); setAiTagSuggestions((prev) => prev.filter((t) => t !== tag)); }}
                          sx={{ cursor: 'pointer', fontSize: '0.68rem', height: 20 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Static quick-add suggestions */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                  {TAG_SUGGESTIONS.filter((t) => !form.tags.includes(t) && !aiTagSuggestions.includes(t)).slice(0, 8).map((tag) => (
                    <Chip key={tag} label={`+ ${tag}`} size="small" variant="outlined" onClick={() => addTag(tag)} sx={{ cursor: 'pointer', fontSize: '0.7rem' }} />
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* ── Tab 1: SEO & Metadata ── */}
          {tab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <AITextField
                  label="SEO Title" fullWidth
                  fieldType="seo_title" aiContext={aiContext}
                  value={form.seoTitle} onChange={(v) => setField('seoTitle', v)}
                  helperText={`${form.seoTitle.length}/60 characters — appears in search results`}
                  inputProps={{ maxLength: 60 }}
                  error={form.seoTitle.length > 60}
                />
              </Grid>
              <Grid item xs={12}>
                <AITextField
                  label="Meta Description" fullWidth multiline rows={3}
                  fieldType="seo_description" aiContext={aiContext}
                  value={form.seoDescription} onChange={(v) => setField('seoDescription', v)}
                  helperText={`${form.seoDescription.length}/160 characters — shown in search snippets`}
                  inputProps={{ maxLength: 160 }}
                  error={form.seoDescription.length > 160}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="URL Slug" fullWidth
                  value={form.slug} onChange={(e) => setField('slug', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: 'text.disabled', fontSize: '0.85rem' }}>/</InputAdornment> }}
                  helperText="URL path for this article"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <AITextField
                  label="Focus Keyword" fullWidth
                  fieldType="focus_keyword" aiContext={aiContext}
                  value={form.focusKeyword} onChange={(v) => setField('focusKeyword', v)}
                  helperText="Primary keyword to optimise for"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Search Preview</Typography>
                </Divider>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" color="success.dark" display="block">
                    {`https://magazinecms.com/${form.slug || 'your-article-slug'}`}
                  </Typography>
                  <Typography variant="body1" color="primary.main" fontWeight={600}>
                    {form.seoTitle || form.title || 'Your Article Title'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {form.seoDescription || 'Your meta description will appear here in search results…'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* ── Tab 2: Magazine Settings ── */}
          {tab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Content Type *</InputLabel>
                  <Select value={form.type} label="Content Type *" onChange={(e) => setField('type', e.target.value as FormState['type'])}>
                    {CONTENT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} label="Status" onChange={(e) => setField('status', e.target.value as FormState['status'])}>
                    {CONTENT_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category *</InputLabel>
                  <Select value={form.category} label="Category *" onChange={(e) => setField('category', e.target.value)}>
                    {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Target Age Group</InputLabel>
                  <Select value={form.ageGroup} label="Target Age Group" onChange={(e) => setField('ageGroup', e.target.value)}>
                    {AGE_GROUPS.map((a) => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Reading Level</InputLabel>
                  <Select value={form.readingLevel} label="Reading Level" onChange={(e) => setField('readingLevel', e.target.value)}>
                    {READING_LEVELS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Read Time Target</InputLabel>
                  <Select value={form.readTimeTarget} label="Read Time Target" onChange={(e) => setField('readTimeTarget', e.target.value)}>
                    {READ_TIME_TARGETS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Platform</InputLabel>
                  <Select value={form.platform} label="Platform" onChange={(e) => setField('platform', e.target.value)}>
                    {PLATFORMS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Language / Locale</InputLabel>
                  <Select value={form.locale} label="Language / Locale" onChange={(e) => setField('locale', e.target.value)}>
                    {LOCALES.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Volume" fullWidth size="small" value={form.issueVolume} onChange={(e) => setField('issueVolume', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Issue Number" fullWidth size="small" value={form.issueNumber} onChange={(e) => setField('issueNumber', e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Editorial Deadline" fullWidth size="small" type="datetime-local"
                  value={form.deadline ? form.deadline.slice(0, 16) : ''}
                  onChange={(e) => setField('deadline', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={form.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} color="primary" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Featured Article</Typography>
                      <Typography variant="caption" color="text.secondary">Shown in featured content slots</Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={form.isCoverStory} onChange={(e) => setField('isCoverStory', e.target.checked)} color="secondary" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Cover Story</Typography>
                      <Typography variant="caption" color="text.secondary">Issue cover placement</Typography>
                    </Box>
                  }
                />
              </Grid>
              {form.scheduledAt && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Scheduled to publish: {new Date(form.scheduledAt).toLocaleString()}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* ── Tab 3: Canvas ── */}
          {tab === 3 && (
            <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
              {/* Magazine page canvas */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PreviewIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={600}>Magazine Canvas</Typography>
                  <Typography variant="caption" color="text.secondary">— drag images from the right panel into the page</Typography>
                </Box>
                {/* A4-like page */}
                <Box
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const html = e.dataTransfer.getData('text/html');
                    if (html) {
                      e.preventDefault();
                      setField('body', form.body + html);
                      setSnackMsg('Block added to content');
                    }
                  }}
                  sx={{
                    maxWidth: 794,
                    mx: 'auto',
                    minHeight: 600,
                    bgcolor: 'white',
                    boxShadow: '0 2px 24px rgba(0,0,0,0.13)',
                    borderRadius: 1,
                    p: { xs: 3, sm: 5 },
                    fontFamily: 'Georgia, serif',
                    border: '2px dashed transparent',
                    '&:dragover': { borderColor: 'primary.main' },
                  }}
                >
                  {/* Article header */}
                  <Box sx={{ mb: 3, pb: 2, borderBottom: '3px solid #1565C0' }}>
                    {form.isCoverStory && (
                      <Chip label="Cover Story" color="secondary" size="small" sx={{ mb: 1, fontWeight: 700, fontSize: '0.65rem' }} />
                    )}
                    <Typography sx={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.2, color: '#111', mb: 0.5 }}>
                      {form.title || 'Untitled Article'}
                    </Typography>
                    {form.subtitle && (
                      <Typography sx={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', color: '#555', fontStyle: 'italic', mb: 0.5 }}>
                        {form.subtitle}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: '0.8rem', color: '#888', mt: 1 }}>
                      {form.byline || form.author || 'By the Editorial Team'} · {form.category} · {form.type}
                    </Typography>
                  </Box>

                  {/* Pull quote if present */}
                  {form.pullQuote && (
                    <Box sx={{ float: 'right', width: '38%', ml: 3, mb: 2, pl: 2, borderLeft: '4px solid #1565C0' }}>
                      <Typography sx={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontStyle: 'italic', color: '#1565C0', lineHeight: 1.5 }}>
                        "{form.pullQuote}"
                      </Typography>
                    </Box>
                  )}

                  {/* Body content rendered as reorderable blocks */}
                  {canvasBlocks.length > 0 ? (
                    <Box>
                      {canvasBlocks.map((block, i) => (
                        <Box
                          key={i}
                          sx={{
                            position: 'relative',
                            mb: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: '#f8f9ff' },
                            '&:hover .block-ctrl': { opacity: 1 },
                          }}
                        >
                          <Box
                            className="block-ctrl"
                            sx={{
                              position: 'absolute', top: 2, right: 2, opacity: 0,
                              transition: 'opacity 0.15s', display: 'flex', gap: 0.25,
                              bgcolor: 'white', boxShadow: 1, borderRadius: 1, p: 0.25, zIndex: 1,
                            }}
                          >
                            <Tooltip title="Move up">
                              <span>
                                <IconButton size="small" disabled={i === 0} onClick={() => {
                                  const b = [...canvasBlocks]; [b[i - 1], b[i]] = [b[i], b[i - 1]];
                                  setField('body', b.join(''));
                                }}><KeyboardArrowUpIcon sx={{ fontSize: 14 }} /></IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move down">
                              <span>
                                <IconButton size="small" disabled={i === canvasBlocks.length - 1} onClick={() => {
                                  const b = [...canvasBlocks]; [b[i], b[i + 1]] = [b[i + 1], b[i]];
                                  setField('body', b.join(''));
                                }}><KeyboardArrowDownIcon sx={{ fontSize: 14 }} /></IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Delete block">
                              <IconButton size="small" color="error" onClick={() => {
                                setField('body', canvasBlocks.filter((_, j) => j !== i).join(''));
                                setSnackMsg('Block removed');
                              }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                            </Tooltip>
                          </Box>
                          <Box
                            dangerouslySetInnerHTML={{ __html: block }}
                            sx={{
                              '& p': { mb: 1.5, lineHeight: 1.8, fontSize: '1rem', color: '#222' },
                              '& h1,& h2,& h3,& h4': { fontFamily: 'Georgia,serif', fontWeight: 700, mb: 1, mt: 2 },
                              '& blockquote': { borderLeft: '4px solid #1565C0', pl: 2, ml: 0, fontStyle: 'italic', color: '#555' },
                              '& img': { maxWidth: '100%', borderRadius: 1 },
                              '& figure': { textAlign: 'center', my: 2 },
                              '& figcaption': { fontSize: '0.8rem', color: '#888', mt: 0.5 },
                              '& ul,& ol': { pl: 3, mb: 1.5 },
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled', border: '2px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                      <PreviewIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography>Drop content blocks here, or write in the Content tab</Typography>
                    </Box>
                  )}

                  {/* Tags */}
                  {form.tags.length > 0 && (
                    <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {form.tags.map((t) => <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />)}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Canvas media sidebar */}
              <Paper variant="outlined" sx={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2 }}>
                <ContentBlocksPanel
                  onInsertBlock={(html) => {
                    setField('body', form.body + html);
                    setSnackMsg('Block added to content');
                  }}
                />
              </Paper>
            </Box>
          )}
        </Box>

        {/* ── Blocks Panel ── */}
        {showBlocks && tab !== 3 && (
          <Paper elevation={2} sx={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
              <Tooltip title="Close Blocks Panel">
                <Button size="small" onClick={() => setShowBlocks(false)} sx={{ minWidth: 'auto', p: 0.5, color: 'white' }}>
                  <CloseIcon fontSize="small" />
                </Button>
              </Tooltip>
            </Box>
            <ContentBlocksPanel
              onInsertBlock={(html) => {
                editorRef.current?.insertHTML(html);
                setSnackMsg('Block inserted');
              }}
            />
          </Paper>
        )}

        {/* ── AI Panel ── */}
        {showAI && (
          <Paper elevation={2} sx={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
              <Tooltip title="Close AI Panel">
                <Button size="small" onClick={() => setShowAI(false)} sx={{ minWidth: 'auto', p: 0.5, color: 'white' }}>
                  <CloseIcon fontSize="small" />
                </Button>
              </Tooltip>
            </Box>
            <AISuggestionsPanel
              title={form.title}
              body={form.body}
              type={form.type}
              category={form.category}
              onApplyTitle={onApplyTitle}
              onApplyTags={onApplyTags}
              onApplySeo={onApplySeo}
              onApplyBody={onApplyBody}
            />
          </Paper>
        )}
      </Box>

      {/* Revision History Dialog */}
      <Dialog open={showRevisions} onClose={() => setShowRevisions(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            Revision History
          </Box>
          <IconButton size="small" onClick={() => setShowRevisions(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          {revisions.length === 0 ? (
            <Typography color="text.secondary">No saved revisions yet. Save the article to create a revision.</Typography>
          ) : (
            <List disablePadding>
              {revisions.map((rev, i) => (
                <ListItem
                  key={i}
                  divider
                  secondaryAction={
                    <Button size="small" variant="outlined" onClick={() => {
                      setField('body', rev.body);
                      setField('title', rev.title);
                      setShowRevisions(false);
                      setSnackMsg(`Restored revision from ${new Date(rev.savedAt).toLocaleTimeString()}`);
                    }}>
                      Restore
                    </Button>
                  }
                >
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600} noWrap>{rev.title}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(rev.savedAt).toLocaleString()} · {rev.wordCount.toLocaleString()} words
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Alert severity="info" sx={{ mt: 2 }}>Last 5 saves are kept. Restoring will overwrite the title and body — other fields are unchanged.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRevisions(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg('')} message={snackMsg} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
