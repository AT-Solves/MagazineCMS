import React, { useState, useCallback } from 'react';
import {
  TextField, type TextFieldProps, Box, Typography, Chip,
  IconButton, CircularProgress, Collapse, Tooltip,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { suggestFieldValue, type AIFieldSuggestion } from '../../services/ai.service';

export type AIFieldType =
  | 'title' | 'subtitle' | 'byline' | 'pull_quote'
  | 'seo_title' | 'seo_description' | 'focus_keyword'
  | 'alt_text' | 'caption'
  | 'image_title' | 'image_subtitle'
  | 'video_title' | 'tags';

export interface AIFieldContext {
  title?: string;
  subtitle?: string;
  body?: string;
  category?: string;
  type?: string;
  tags?: string[];
  ageGroup?: string;
  filename?: string;
  platform?: string;
  videoId?: string;
}

interface AITextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  fieldType: AIFieldType;
  aiContext?: AIFieldContext;
  value: string;
  onChange: (value: string) => void;
}

export default function AITextField({
  fieldType,
  aiContext = {},
  value,
  onChange,
  InputProps,
  ...rest
}: AITextFieldProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AIFieldSuggestion | null>(null);

  const handleSuggest = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSuggestion(null);
    setLoading(true);
    try {
      const result = await suggestFieldValue({
        fieldType,
        currentValue: value,
        context: aiContext,
      });
      setSuggestion(result);
    } finally {
      setLoading(false);
    }
  }, [fieldType, value, aiContext]);

  const handleApply = () => {
    if (suggestion) {
      onChange(suggestion.value);
      setSuggestion(null);
    }
  };

  const handleDismiss = () => setSuggestion(null);

  const wandAdornment = (
    <Tooltip title={`AI suggestion for ${fieldType.replace(/_/g, ' ')}`} placement="top">
      <span>
        <IconButton
          size="small"
          onClick={handleSuggest}
          disabled={loading}
          sx={{
            color: loading ? 'text.disabled' : 'primary.main',
            opacity: 0.75,
            '&:hover': { opacity: 1, color: 'secondary.main' },
            p: 0.4,
          }}
        >
          {loading ? <CircularProgress size={14} /> : <AutoFixHighIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </span>
    </Tooltip>
  );

  const mergedInputProps: TextFieldProps['InputProps'] = {
    ...InputProps,
    endAdornment: (
      <>
        {InputProps?.endAdornment}
        {wandAdornment}
      </>
    ),
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={mergedInputProps}
        sx={{ width: '100%', ...rest.sx }}
      />
      <Collapse in={!!suggestion} unmountOnExit>
        {suggestion && (
          <Box
            sx={{
              mt: 0.5,
              px: 1.5, py: 0.75,
              bgcolor: '#e8f0fe',
              border: '1px solid #b3c7f7',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <AutoFixHighIcon sx={{ fontSize: 14, color: 'secondary.main', mt: 0.25, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'secondary.dark', fontStyle: 'italic', display: 'block', lineHeight: 1.4, mb: 0.25 }}
              >
                {suggestion.value}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                {suggestion.reason}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
              <Tooltip title="Apply suggestion">
                <IconButton size="small" color="success" onClick={handleApply} sx={{ p: 0.25 }}>
                  <CheckIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Dismiss">
                <IconButton size="small" onClick={handleDismiss} sx={{ p: 0.25 }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
