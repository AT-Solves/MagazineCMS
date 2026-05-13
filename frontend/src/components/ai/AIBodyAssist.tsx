import React, { useState } from 'react';
import {
  Box, Chip, Typography, CircularProgress, Button, Collapse,
  TextField, IconButton, Tooltip, Divider,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';

import { improveText, generateBodyContent, type AIImproveResult } from '../../services/ai.service';
import type { AIFieldContext } from './AITextField';

const QUICK_ACTIONS = [
  { label: 'Simplify',      instruction: 'simplify for young readers' },
  { label: 'Shorten',       instruction: 'shorten to be more concise' },
  { label: 'More Engaging', instruction: 'make it more engaging and lively' },
  { label: 'Active Voice',  instruction: 'rewrite in active voice' },
  { label: 'Add Examples',  instruction: 'add concrete examples' },
  { label: 'Formal',        instruction: 'make it more formal and professional' },
];

interface AIBodyAssistProps {
  body: string;
  aiContext: AIFieldContext;
  onApply: (html: string) => void;
}

export default function AIBodyAssist({ body, aiContext, onApply }: AIBodyAssistProps) {
  const [loading, setLoading]               = useState(false);
  const [generating, setGenerating]         = useState(false);
  const [activeAction, setActiveAction]     = useState<string | null>(null);
  const [result, setResult]                 = useState<AIImproveResult | null>(null);
  const [generateResult, setGenerateResult] = useState<{ html: string; wordCount: number; sectionsGenerated: number } | null>(null);
  const [customOpen, setCustomOpen]         = useState(false);
  const [customInstr, setCustomInstr]       = useState('');

  const runImprove = async (instruction: string, actionLabel?: string) => {
    if (!body.trim()) return;
    setLoading(true);
    setActiveAction(actionLabel ?? instruction);
    setResult(null);
    setGenerateResult(null);
    setCustomOpen(false);
    try {
      const res = await improveText({
        text: body,
        instruction,
        type: aiContext.type ?? 'feature_article',
        ageGroup: aiContext.ageGroup,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const runGenerate = async () => {
    setGenerating(true);
    setResult(null);
    setGenerateResult(null);
    setActiveAction(null);
    try {
      const res = await generateBodyContent({
        title:    aiContext.title    ?? '',
        type:     aiContext.type     ?? 'feature_article',
        category: aiContext.category ?? '',
        ageGroup: aiContext.ageGroup,
      });
      setGenerateResult(res);
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result.improved);
      setResult(null);
      setActiveAction(null);
    }
  };

  const handleApplyGenerated = () => {
    if (generateResult) {
      onApply(generateResult.html);
      setGenerateResult(null);
    }
  };

  const handleDiscard = () => {
    setResult(null);
    setActiveAction(null);
  };

  const handleDiscardGenerated = () => setGenerateResult(null);

  const handleCustomSubmit = () => {
    if (customInstr.trim()) runImprove(customInstr);
    setCustomInstr('');
  };

  const isEmpty = !body || body.replace(/<[^>]*>/g, '').trim().length < 20;

  return (
    <Box>
      {/* Action bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>

        {/* Generate Draft */}
        <Tooltip title={aiContext.title ? 'Generate a full draft from your article title and settings' : 'Add a title first to generate a draft'}>
          <span>
            <Chip
              icon={generating ? <CircularProgress size={10} /> : <AutoAwesomeIcon sx={{ fontSize: '0.85rem !important' }} />}
              label="Generate Draft"
              size="small"
              clickable
              disabled={generating || loading || !aiContext.title}
              color="secondary"
              variant="filled"
              onClick={runGenerate}
              sx={{ fontSize: '0.68rem', height: 22, mr: 0.5 }}
            />
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        {/* Improve label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.25 }}>
          <AutoFixHighIcon sx={{ fontSize: 15, color: 'primary.main' }} />
          <Typography variant="caption" fontWeight={600} color="primary.main">Improve:</Typography>
        </Box>

        {QUICK_ACTIONS.map((action) => (
          <Tooltip key={action.label} title={isEmpty ? 'Write some content first' : action.instruction}>
            <span>
              <Chip
                label={action.label}
                size="small"
                clickable
                disabled={loading || generating || isEmpty}
                color={activeAction === action.label && result ? 'primary' : 'default'}
                variant={activeAction === action.label ? 'filled' : 'outlined'}
                onClick={() => runImprove(action.instruction, action.label)}
                sx={{ fontSize: '0.68rem', height: 22 }}
              />
            </span>
          </Tooltip>
        ))}

        <Tooltip title={isEmpty ? 'Write some content first' : 'Enter a custom instruction'}>
          <span>
            <Chip
              label="Custom…"
              size="small"
              clickable
              disabled={loading || generating || isEmpty}
              variant={customOpen ? 'filled' : 'outlined'}
              color={customOpen ? 'secondary' : 'default'}
              onClick={() => setCustomOpen((v) => !v)}
              sx={{ fontSize: '0.68rem', height: 22 }}
            />
          </span>
        </Tooltip>

        {(loading || generating) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
            <CircularProgress size={12} />
            <Typography variant="caption" color="text.secondary">
              {generating ? 'Generating draft…' : 'Improving…'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Custom instruction input */}
      <Collapse in={customOpen} unmountOnExit>
        <Box sx={{ display: 'flex', gap: 1, mb: 0.75 }}>
          <TextField
            size="small" fullWidth
            placeholder="e.g. 'rewrite for 8-year-olds', 'add a strong opening hook', 'use bullet points'…"
            value={customInstr}
            onChange={(e) => setCustomInstr(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCustomSubmit(); } }}
            autoFocus
          />
          <Button
            size="small" variant="contained"
            disabled={!customInstr.trim() || loading}
            onClick={handleCustomSubmit}
            startIcon={<AutoFixHighIcon fontSize="small" />}
          >
            Apply
          </Button>
          <IconButton size="small" onClick={() => { setCustomOpen(false); setCustomInstr(''); }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Collapse>

      {/* Generate Draft result */}
      <Collapse in={!!generateResult} unmountOnExit>
        {generateResult && (
          <Box sx={{ border: '1px solid', borderColor: 'secondary.200', borderRadius: 1, bgcolor: '#f3f0ff', mb: 1, overflow: 'hidden' }}>
            <Box sx={{ px: 1.5, py: 0.75, bgcolor: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <AutoAwesomeIcon sx={{ fontSize: 14, color: 'white' }} />
                <Typography variant="caption" fontWeight={700} color="white">
                  AI Draft — {generateResult.sectionsGenerated} sections · ~{generateResult.wordCount} words
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  size="small" variant="contained" color="success"
                  startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                  onClick={handleApplyGenerated}
                  sx={{ py: 0, px: 1, fontSize: '0.7rem', minHeight: 24 }}
                >
                  Apply to Editor
                </Button>
                <Tooltip title="Discard">
                  <IconButton size="small" onClick={handleDiscardGenerated} sx={{ color: 'white', p: 0.25 }}>
                    <UndoIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ px: 1.5, py: 1, maxHeight: 140, overflow: 'auto' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.5, display: 'block' }}>
                {generateResult.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)}
                {generateResult.html.replace(/<[^>]*>/g, ' ').trim().length > 500 ? '…' : ''}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 1.5, py: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>
                · Draft generated from title, article type, and category — edit freely after applying
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.62rem' }}>
                · Applying will replace the current body — use revision history to undo
              </Typography>
            </Box>
          </Box>
        )}
      </Collapse>

      {/* Improve result */}
      <Collapse in={!!result} unmountOnExit>
        {result && (
          <Box sx={{ border: '1px solid', borderColor: 'primary.200', borderRadius: 1, bgcolor: '#f0f4ff', mb: 1, overflow: 'hidden' }}>
            <Box sx={{ px: 1.5, py: 0.75, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <AutoFixHighIcon sx={{ fontSize: 14, color: 'white' }} />
                <Typography variant="caption" fontWeight={700} color="white">
                  AI suggestion — {activeAction}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  size="small" variant="contained" color="success"
                  startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                  onClick={handleApply}
                  sx={{ py: 0, px: 1, fontSize: '0.7rem', minHeight: 24 }}
                >
                  Apply
                </Button>
                <Tooltip title="Discard">
                  <IconButton size="small" onClick={handleDiscard} sx={{ color: 'white', p: 0.25 }}>
                    <UndoIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ px: 1.5, py: 1, maxHeight: 140, overflow: 'auto' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.5, display: 'block' }}>
                {result.improved.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400)}
                {result.improved.replace(/<[^>]*>/g, ' ').trim().length > 400 ? '…' : ''}
              </Typography>
            </Box>
            {result.changes.length > 0 && (
              <>
                <Divider />
                <Box sx={{ px: 1.5, py: 0.5 }}>
                  {result.changes.map((c, i) => (
                    <Typography key={i} variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.62rem', lineHeight: 1.4 }}>
                      · {c}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
