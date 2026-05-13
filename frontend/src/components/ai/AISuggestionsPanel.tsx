import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress, Divider,
  TextField, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, LinearProgress, Alert,
  IconButton, Tooltip, Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SchoolIcon from '@mui/icons-material/School';
import TagIcon from '@mui/icons-material/Tag';
import TitleIcon from '@mui/icons-material/Title';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';

import {
  generateSuggestions, improveText,
  type AIContentSuggestions, type AIImproveResult,
} from '../../services/ai.service';

interface Props {
  title: string;
  body: string;
  type: string;
  category: string;
  onApplyTitle: (title: string) => void;
  onApplyTags: (tags: string[]) => void;
  onApplySeo: (seoTitle: string, seoDescription: string) => void;
  onApplyBody: (body: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
      <IconButton size="small" onClick={copy} sx={{ ml: 0.5 }}>
        {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

const AISuggestionsPanel: React.FC<Props> = ({
  title, body, type, category,
  onApplyTitle, onApplyTags, onApplySeo, onApplyBody,
}) => {
  const [suggestions, setSuggestions] = useState<AIContentSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customPrompt, setCustomPrompt] = useState('');
  const [improveResult, setImproveResult] = useState<AIImproveResult | null>(null);
  const [improving, setImproving] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateSuggestions({ title, body, type, category });
      setSuggestions(result);
    } catch {
      setError('AI service is unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [title, body, type, category]);

  const improve = useCallback(async () => {
    if (!customPrompt.trim()) return;
    setImproving(true);
    setImproveResult(null);
    try {
      const result = await improveText({ text: body, instruction: customPrompt, type });
      setImproveResult(result);
    } catch {
      setError('Improve request failed. Please try again.');
    } finally {
      setImproving(false);
    }
  }, [customPrompt, body, type]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <AutoAwesomeIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>AI Assistant</Typography>
          <Chip label="Enterprise" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10 }} />
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>
          Powered by editorial AI — suggestions are context-aware
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Generate button */}
        <Button
          variant="contained" fullWidth startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={generate} disabled={loading || !title}
          sx={{ py: 1.25, fontWeight: 600 }}
        >
          {loading ? 'Analysing Content…' : suggestions ? 'Refresh Suggestions' : 'Generate Suggestions'}
        </Button>

        {!title && (
          <Alert severity="info" icon={<LightbulbIcon />} sx={{ fontSize: '0.78rem' }}>
            Add a title first so AI can tailor suggestions to your content.
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ fontSize: '0.78rem' }}>{error}</Alert>}

        {loading && <LinearProgress sx={{ borderRadius: 1 }} />}

        {suggestions && (
          <>
            {/* Title Suggestions */}
            <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TitleIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={600}>Title Suggestions</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5 }}>
                <List dense disablePadding>
                  {suggestions.titles.map((t, i) => (
                    <ListItem
                      key={i} disablePadding
                      sx={{ mb: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, py: 0.5, '&:hover': { bgcolor: 'grey.50' } }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{t.title}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <LinearProgress variant="determinate" value={t.score} sx={{ flex: 1, height: 3, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: t.score > 85 ? 'success.main' : 'primary.main' } }} />
                          <Typography variant="caption" color="text.secondary">{t.score}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{t.reason}</Typography>
                      </Box>
                      <Box sx={{ ml: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Tooltip title="Use this title">
                          <Button size="small" variant="outlined" sx={{ py: 0, px: 1, fontSize: '0.7rem', minWidth: 'auto' }} onClick={() => onApplyTitle(t.title)}>
                            Use
                          </Button>
                        </Tooltip>
                        <CopyButton text={t.title} />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Content Outline */}
            <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ListAltIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={600}>Content Outline</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5 }}>
                {suggestions.outline.map((sec, i) => (
                  <Box key={i} sx={{ mb: 1, pb: 1, borderBottom: i < suggestions.outline.length - 1 ? '1px dashed' : 'none', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{i + 1}. {sec.heading}</Typography>
                      <Chip label={`~${sec.wordTarget}w`} size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{sec.description}</Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>

            {/* Tags */}
            <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TagIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={600}>Suggested Tags</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {suggestions.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" color="primary" />
                  ))}
                </Box>
                <Button size="small" variant="contained" onClick={() => onApplyTags(suggestions.tags)} fullWidth>
                  Apply All Tags
                </Button>
              </AccordionDetails>
            </Accordion>

            {/* SEO */}
            <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={600}>SEO Optimisation</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5 }}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>SEO Title ({suggestions.seoTitle.length}/60)</Typography>
                  <Paper variant="outlined" sx={{ p: 1, mb: 0.5 }}>
                    <Typography variant="body2">{suggestions.seoTitle}</Typography>
                  </Paper>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Meta Description ({suggestions.seoDescription.length}/160)</Typography>
                  <Paper variant="outlined" sx={{ p: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{suggestions.seoDescription}</Typography>
                  </Paper>
                </Box>
                <Button size="small" variant="contained" onClick={() => onApplySeo(suggestions.seoTitle, suggestions.seoDescription)} fullWidth>
                  Apply SEO Fields
                </Button>
              </AccordionDetails>
            </Accordion>

            {/* Readability */}
            <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={600}>Readability</Typography>
                  <Chip label={suggestions.readability.level} size="small" color="info" sx={{ height: 18, fontSize: '0.65rem' }} />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LinearProgress variant="determinate" value={suggestions.readability.score} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                  <Typography variant="body2" fontWeight={700}>{suggestions.readability.score}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Grade Level: {suggestions.readability.gradeLevel}
                </Typography>
                {suggestions.readability.tips.map((tip, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                    <Typography variant="caption" color="primary.main">•</Typography>
                    <Typography variant="caption" color="text.secondary">{tip}</Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>

            {/* Tone */}
            <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RecordVoiceOverIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={600}>Tone & Brand Voice</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2">{suggestions.tone.detected}</Typography>
                  <Chip label={`${suggestions.tone.brandAlignment}% brand fit`} size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
                </Box>
                {suggestions.tone.recommendations.map((rec, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                    <Typography variant="caption" color="primary.main">→</Typography>
                    <Typography variant="caption" color="text.secondary">{rec}</Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {/* Custom Improve Prompt */}
        <Divider sx={{ my: 0.5 }} />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <LightbulbIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={600}>Custom AI Request</Typography>
          </Box>
          <TextField
            multiline rows={2} fullWidth size="small"
            placeholder="e.g. Make the intro more exciting for 9-year-olds"
            value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button
            variant="outlined" fullWidth size="small"
            startIcon={improving ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={improve} disabled={improving || !customPrompt.trim()}
          >
            {improving ? 'Working…' : 'Improve Content'}
          </Button>
          {improveResult && (
            <Box sx={{ mt: 1 }}>
              <Paper variant="outlined" sx={{ p: 1, mb: 0.75, bgcolor: 'success.50' }}>
                <Typography variant="caption" sx={{ fontSize: '0.78rem' }}>{improveResult.improved}</Typography>
              </Paper>
              <Button size="small" variant="contained" color="success" fullWidth onClick={() => onApplyBody(improveResult.improved)}>
                Apply Improved Text
              </Button>
              <Box sx={{ mt: 0.5 }}>
                {improveResult.changes.map((c, i) => (
                  <Typography key={i} variant="caption" display="block" color="text.secondary">✓ {c}</Typography>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AISuggestionsPanel;
