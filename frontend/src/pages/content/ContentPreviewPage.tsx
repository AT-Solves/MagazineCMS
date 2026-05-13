import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, IconButton, Tooltip, ToggleButtonGroup,
  ToggleButton, Divider, Button, Paper, Collapse,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TabletIcon from '@mui/icons-material/Tablet';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import ShareIcon from '@mui/icons-material/Share';
import WebIcon from '@mui/icons-material/Web';

import { useContentStore } from '../../stores/content.store';
import { CONTENT_TYPES } from '../../constants/magazine';

type Viewport = 'mobile' | 'tablet' | 'desktop';

const VIEWPORT_WIDTHS: Record<Viewport, number | string> = {
  mobile: 390,
  tablet: 768,
  desktop: '100%',
};

const STATUS_COLOR_MAP: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  published: 'success',
  approved: 'success',
  in_review: 'info',
  draft: 'warning',
  brief: 'default',
  scheduled: 'info',
  archived: 'error',
};

export default function ContentPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getItem } = useContentStore();
  const item = id ? getItem(id) : null;

  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [showSocialPreview, setShowSocialPreview] = useState(false);

  // Inject print stylesheet that hides UI chrome
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'preview-print-style';
    style.textContent = `
      @media print {
        header, nav, .MuiAppBar-root, .MuiDrawer-root { display: none !important; }
        .preview-toolbar, .preview-statusbar { display: none !important; }
        .preview-social { display: none !important; }
        body { background: white !important; }
        .preview-article { max-width: 100% !important; padding: 0 !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById('preview-print-style')?.remove(); };
  }, []);

  if (!item) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <Typography variant="h5" color="text.secondary">Article not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/content')}>Back to Library</Button>
      </Box>
    );
  }

  const typeLabel = CONTENT_TYPES.find((t) => t.value === item.type)?.label ?? item.type;
  const readTimeMin = Math.max(1, Math.round(item.wordCount / 200));
  const publishDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(item.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const pageWidth = VIEWPORT_WIDTHS[viewport];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f0f0f0', overflow: 'hidden' }}>
      {/* Preview toolbar */}
      <Box className="preview-toolbar" sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1,
        bgcolor: 'grey.900', color: 'white', flexShrink: 0,
      }}>
        <Tooltip title="Back to editor">
          <IconButton size="small" onClick={() => navigate(`/content/${id}/edit`)} sx={{ color: 'white' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="body2" fontWeight={600} sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'grey.300' }}>
          Preview — {item.title}
        </Typography>

        <ToggleButtonGroup
          value={viewport}
          exclusive
          onChange={(_, v) => v && setViewport(v)}
          size="small"
          sx={{ '& .MuiToggleButton-root': { color: 'grey.400', border: '1px solid', borderColor: 'grey.700', py: 0.25 }, '& .Mui-selected': { color: 'white', bgcolor: 'grey.700 !important' } }}
        >
          <ToggleButton value="mobile"><Tooltip title="Mobile (390px)"><SmartphoneIcon fontSize="small" /></Tooltip></ToggleButton>
          <ToggleButton value="tablet"><Tooltip title="Tablet (768px)"><TabletIcon fontSize="small" /></Tooltip></ToggleButton>
          <ToggleButton value="desktop"><Tooltip title="Desktop"><DesktopWindowsIcon fontSize="small" /></Tooltip></ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title="Edit article">
          <IconButton size="small" onClick={() => navigate(`/content/${id}/edit`)} sx={{ color: 'white' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print / Export PDF">
          <IconButton size="small" onClick={() => window.print()} sx={{ color: 'white' }}>
            <PrintIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Copy preview link">
          <IconButton
            size="small"
            sx={{ color: 'white' }}
            onClick={() => { navigator.clipboard.writeText(window.location.href); }}
          >
            <ShareIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Social / OG preview">
          <IconButton
            size="small"
            sx={{ color: showSocialPreview ? 'primary.light' : 'white' }}
            onClick={() => setShowSocialPreview((v) => !v)}
          >
            <WebIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Social / OG preview strip */}
      <Collapse in={showSocialPreview} className="preview-social">
        <Box sx={{ bgcolor: '#1a1a2e', px: 2, py: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Twitter/X card */}
          <Box sx={{ width: 440, maxWidth: '100%' }}>
            <Typography variant="caption" color="grey.500" display="block" sx={{ mb: 0.75, letterSpacing: 1 }}>TWITTER / X CARD</Typography>
            <Box sx={{ border: '1px solid #2d3748', borderRadius: 2, overflow: 'hidden', bgcolor: '#16202a', maxWidth: 440 }}>
              <Box sx={{ height: 100, bgcolor: 'primary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Typography variant="h6" color="white" fontWeight={700} sx={{ px: 2, textAlign: 'center' }}>{item.category}</Typography>
              </Box>
              <Box sx={{ p: 1.5 }}>
                <Typography variant="caption" color="grey.500" display="block" sx={{ mb: 0.25, fontSize: '0.65rem' }}>magazinecms.com</Typography>
                <Typography variant="body2" color="white" fontWeight={600} sx={{ lineHeight: 1.3, mb: 0.5 }}>{item.seoTitle || item.title}</Typography>
                <Typography variant="caption" color="grey.400" sx={{ fontSize: '0.72rem' }}>{(item.seoDescription || item.subtitle || '').slice(0, 120)}</Typography>
              </Box>
            </Box>
          </Box>
          {/* Facebook OG card */}
          <Box sx={{ width: 440, maxWidth: '100%' }}>
            <Typography variant="caption" color="grey.500" display="block" sx={{ mb: 0.75, letterSpacing: 1 }}>FACEBOOK / OPEN GRAPH</Typography>
            <Box sx={{ border: '1px solid #2d3748', borderRadius: 1, overflow: 'hidden', bgcolor: '#f0f2f5' }}>
              <Box sx={{ height: 120, bgcolor: 'secondary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" color="white" fontWeight={700} sx={{ px: 2, textAlign: 'center' }}>{item.tags.slice(0, 2).join(' · ') || item.category}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderTop: '1px solid #ddd' }}>
                <Typography variant="caption" color="#888" display="block" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', mb: 0.25 }}>MAGAZINECMS.COM</Typography>
                <Typography variant="body2" color="#1c1e21" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.25 }}>{item.seoTitle || item.title}</Typography>
                <Typography variant="caption" color="#606770" sx={{ fontSize: '0.72rem' }}>{(item.seoDescription || item.subtitle || '').slice(0, 100)}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Collapse>

      {/* Viewport info bar */}
      <Box className="preview-statusbar" sx={{ px: 2, py: 0.5, bgcolor: 'grey.800', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Typography variant="caption" color="grey.400">
          {viewport === 'mobile' ? '390px — Mobile' : viewport === 'tablet' ? '768px — Tablet' : 'Full width — Desktop'}
        </Typography>
        <Chip
          label={item.status}
          size="small"
          color={STATUS_COLOR_MAP[item.status] ?? 'default'}
          sx={{ height: 16, fontSize: '0.6rem' }}
        />
        {item.isCoverStory && <Chip label="Cover Story" size="small" color="secondary" sx={{ height: 16, fontSize: '0.6rem' }} />}
        {item.isFeatured && <Chip label="Featured" size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem' }} />}
      </Box>

      {/* Scrollable canvas */}
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', p: viewport === 'desktop' ? 0 : 3 }}>
        <Box
          sx={{
            width: pageWidth,
            maxWidth: '100%',
            minHeight: '100%',
            bgcolor: 'white',
            transition: 'width 0.3s ease',
            ...(viewport !== 'desktop' && { boxShadow: '0 0 40px rgba(0,0,0,0.25)', borderRadius: 1 }),
          }}
        >
          {/* Article */}
          <Box
            className="preview-article"
            sx={{
              px: viewport === 'mobile' ? 2.5 : viewport === 'tablet' ? 4 : 8,
              py: viewport === 'mobile' ? 3 : 5,
              maxWidth: viewport === 'desktop' ? 860 : '100%',
              mx: 'auto',
            }}
          >
            {/* Category breadcrumb */}
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1.5, fontSize: '0.7rem' }}
            >
              {item.category} · {typeLabel}
            </Typography>

            {/* Headline */}
            <Typography
              variant="h1"
              sx={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: viewport === 'mobile' ? '1.8rem' : viewport === 'tablet' ? '2.2rem' : '2.8rem',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#111',
                mt: 1,
                mb: 1.5,
              }}
            >
              {item.title}
            </Typography>

            {/* Subtitle / Deck */}
            {item.subtitle && (
              <Typography
                sx={{
                  fontFamily: 'Georgia, serif',
                  fontSize: viewport === 'mobile' ? '1rem' : '1.2rem',
                  color: '#555',
                  lineHeight: 1.5,
                  mb: 2,
                }}
              >
                {item.subtitle}
              </Typography>
            )}

            {/* Byline + meta */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: '50%',
                  bgcolor: 'primary.main', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                }}
              >
                {(item.byline || item.author || 'A')[0].toUpperCase()}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {item.byline || item.author}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {publishDate} · {readTimeMin} min read · {item.wordCount.toLocaleString()} words
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                {item.tags.slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                ))}
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Pull quote (floating right on desktop) */}
            {item.pullQuote && viewport === 'desktop' && (
              <Box
                sx={{
                  float: 'right', width: '36%', ml: 4, mb: 2,
                  pl: 2, borderLeft: '4px solid', borderColor: 'primary.main',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '1.1rem',
                    fontStyle: 'italic',
                    color: 'primary.dark',
                    lineHeight: 1.6,
                  }}
                >
                  "{item.pullQuote}"
                </Typography>
              </Box>
            )}

            {/* Body HTML */}
            {item.body ? (
              <Box
                dangerouslySetInnerHTML={{ __html: item.body }}
                sx={{
                  '& p': {
                    mb: 1.8,
                    lineHeight: 1.85,
                    fontSize: viewport === 'mobile' ? '0.95rem' : '1.05rem',
                    color: '#222',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                  },
                  '& h1,& h2': {
                    fontFamily: 'Georgia, serif',
                    fontWeight: 700,
                    mt: 3.5, mb: 1.5,
                    color: '#111',
                    fontSize: viewport === 'mobile' ? '1.3rem' : '1.6rem',
                  },
                  '& h3,& h4': {
                    fontFamily: 'Georgia, serif',
                    fontWeight: 600,
                    mt: 2.5, mb: 1,
                    color: '#333',
                    fontSize: viewport === 'mobile' ? '1.1rem' : '1.25rem',
                  },
                  '& blockquote': {
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    pl: 2.5, ml: 0, my: 2.5,
                    fontStyle: 'italic',
                    color: '#555',
                    background: '#f8f9ff',
                    py: 1, pr: 2, borderRadius: '0 4px 4px 0',
                  },
                  '& a': { color: 'primary.main', textDecorationColor: 'primary.light' },
                  '& img': { maxWidth: '100%', borderRadius: 1, display: 'block', mx: 'auto' },
                  '& figure': { textAlign: 'center', my: 3 },
                  '& figcaption': {
                    fontSize: '0.8rem', color: '#888', mt: 0.75,
                    fontStyle: 'italic',
                  },
                  '& ul,& ol': { pl: 3.5, mb: 2 },
                  '& li': { mb: 0.5, lineHeight: 1.7, fontFamily: 'Georgia, serif' },
                }}
              />
            ) : (
              <Box sx={{ py: 8, textAlign: 'center', color: 'text.disabled' }}>
                <Typography>No content yet — go to the Content tab to start writing.</Typography>
              </Box>
            )}

            {/* Pull quote for mobile (inline) */}
            {item.pullQuote && viewport !== 'desktop' && (
              <Box sx={{ my: 3, pl: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Typography sx={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', color: 'primary.dark', fontSize: '1rem', lineHeight: 1.6 }}>
                  "{item.pullQuote}"
                </Typography>
              </Box>
            )}

            <Box sx={{ clear: 'both' }} />
            <Divider sx={{ my: 3 }} />

            {/* Footer tags */}
            {item.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                {item.tags.map((t) => (
                  <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: '0.75rem', borderRadius: 1 }} />
                ))}
              </Box>
            )}

            {/* Article footer */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 1, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Published in <strong>{item.category}</strong> · Volume {item.issueVolume}, Issue {item.issueNumber} · {item.locale.toUpperCase()}
              </Typography>
              {item.focusKeyword && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                  Topic: {item.focusKeyword}
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
