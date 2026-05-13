import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, InputAdornment,
  Tab, Tabs, Grid, Chip, IconButton, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';

import { useMediaStore, type MediaAsset } from '../../stores/media.store';

interface TemplateAsset {
  id: string;
  label: string;
  description: string;
  aspectRatio: string;
  width: number;
  height: number;
  bg: string;
  category: 'hero' | 'feature' | 'portrait' | 'square' | 'infographic' | 'pullquote';
}

const TEMPLATES: TemplateAsset[] = [
  { id: 't1', label: 'Full-Width Hero',      description: 'Full-bleed banner image',         aspectRatio: '16:5',  width: 1920, height: 600,  bg: 'linear-gradient(135deg,#1565C0 0%,#0288D1 100%)',    category: 'hero' },
  { id: 't2', label: 'Feature Landscape',    description: 'Wide landscape for article lead', aspectRatio: '16:9',  width: 1200, height: 675,  bg: 'linear-gradient(135deg,#2E7D32 0%,#66BB6A 100%)',    category: 'feature' },
  { id: 't3', label: 'Portrait Story',       description: 'Tall portrait for people stories', aspectRatio: '2:3',  width: 800,  height: 1200, bg: 'linear-gradient(135deg,#6A1B9A 0%,#BA68C8 100%)',    category: 'portrait' },
  { id: 't4', label: 'Square Social',        description: 'Equal proportions for social',     aspectRatio: '1:1',  width: 1080, height: 1080, bg: 'linear-gradient(135deg,#E65100 0%,#FF8A65 100%)',    category: 'square' },
  { id: 't5', label: 'Pull Quote Image',     description: 'Background for pull quotes',       aspectRatio: '3:1',  width: 1200, height: 400,  bg: 'linear-gradient(135deg,#37474F 0%,#78909C 100%)',    category: 'pullquote' },
  { id: 't6', label: 'Infographic Tall',     description: 'Vertical infographic layout',      aspectRatio: '1:2',  width: 800,  height: 1600, bg: 'linear-gradient(135deg,#00838F 0%,#4DD0E1 100%)',    category: 'infographic' },
  { id: 't7', label: 'Half Column',          description: 'Side-by-side with text',           aspectRatio: '3:2',  width: 600,  height: 400,  bg: 'linear-gradient(135deg,#AD1457 0%,#F06292 100%)',    category: 'feature' },
  { id: 't8', label: 'Cover Story Banner',   description: 'Magazine cover hero image',        aspectRatio: '5:7',  width: 1000, height: 1400, bg: 'linear-gradient(135deg,#4527A0 0%,#7986CB 100%)',    category: 'hero' },
];

function assetThumbBg(asset: MediaAsset): string {
  const ext = asset.filename.split('.').pop()?.toLowerCase();
  if (asset.url && asset.url.startsWith('blob:')) return '';
  const palette = ['#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00838F', '#AD1457', '#37474F', '#4527A0'];
  const idx = asset.id.charCodeAt(asset.id.length - 1) % palette.length;
  return `linear-gradient(135deg,${palette[idx]}88 0%,${palette[(idx + 2) % palette.length]}55 100%)`;
}

interface MediaPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

export default function MediaPickerDialog({ open, onClose, onInsert }: MediaPickerDialogProps) {
  const { assets } = useMediaStore();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateAsset | null>(null);
  const [altText, setAltText] = useState('');

  const filteredAssets = useMemo(() => {
    if (!search) return assets;
    const q = search.toLowerCase();
    return assets.filter((a) => a.filename.toLowerCase().includes(q) || a.altText.toLowerCase().includes(q));
  }, [assets, search]);

  const filteredTemplates = useMemo(() => {
    if (!search) return TEMPLATES;
    const q = search.toLowerCase();
    return TEMPLATES.filter((t) => t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [search]);

  const handleSelectAsset = (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setSelectedTemplate(null);
    setAltText(asset.altText || asset.filename.replace(/\.[^.]+$/, ''));
  };

  const handleSelectTemplate = (tpl: TemplateAsset) => {
    setSelectedTemplate(tpl);
    setSelectedAsset(null);
    setAltText(tpl.label);
  };

  const handleInsert = () => {
    if (selectedAsset) {
      const src = selectedAsset.url || `https://placehold.co/${selectedAsset.width ?? 800}x${selectedAsset.height ?? 600}/1565C0/ffffff?text=${encodeURIComponent(selectedAsset.altText)}`;
      const caption = selectedAsset.caption ? `<figcaption style="text-align:center;font-size:0.8rem;color:#666;margin-top:4px">${selectedAsset.caption}</figcaption>` : '';
      onInsert(`<figure style="margin:1.5em 0;text-align:center"><img src="${src}" alt="${altText}" style="max-width:100%;border-radius:4px" />${caption}</figure>`);
    } else if (selectedTemplate) {
      const src = `https://placehold.co/${selectedTemplate.width}x${selectedTemplate.height}/1565C0/ffffff?text=${encodeURIComponent(selectedTemplate.label)}`;
      onInsert(`<figure style="margin:1.5em 0;text-align:center"><img src="${src}" alt="${altText}" style="max-width:100%;border-radius:4px" /><figcaption style="text-align:center;font-size:0.8rem;color:#666;margin-top:4px">${selectedTemplate.description} · ${selectedTemplate.width}×${selectedTemplate.height}</figcaption></figure>`);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedAsset(null);
    setSelectedTemplate(null);
    setAltText('');
    setSearch('');
    onClose();
  };

  const hasSelection = !!(selectedAsset || selectedTemplate);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '80vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>Insert Image</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search assets or templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSelectedAsset(null); setSelectedTemplate(null); }} sx={{ mt: 1 }}>
          <Tab label={`Media Library (${assets.length})`} />
          <Tab label="Layout Templates" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 1, overflow: 'auto' }}>
        {tab === 0 && (
          <>
            {filteredAssets.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                <Typography>No assets found. Upload images in the Media Manager.</Typography>
              </Box>
            ) : (
              <Grid container spacing={1.5}>
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const bg = assetThumbBg(asset);
                  return (
                    <Grid item xs={6} sm={4} md={3} key={asset.id}>
                      <Box
                        onClick={() => handleSelectAsset(asset)}
                        sx={{
                          position: 'relative',
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: isSelected ? '2.5px solid' : '2px solid transparent',
                          borderColor: isSelected ? 'primary.main' : 'transparent',
                          '&:hover': { borderColor: isSelected ? 'primary.main' : 'grey.400' },
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <Box
                          sx={{
                            aspectRatio: asset.width && asset.height ? `${asset.width}/${asset.height}` : '4/3',
                            background: asset.url?.startsWith('blob:') ? undefined : bg,
                            bgcolor: bg ? undefined : 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            maxHeight: 140,
                            minHeight: 80,
                            overflow: 'hidden',
                          }}
                        >
                          {asset.url?.startsWith('blob:') ? (
                            <Box component="img" src={asset.url} alt={asset.altText} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Typography variant="caption" sx={{ color: 'white', opacity: 0.85, textAlign: 'center', px: 0.5, fontWeight: 600, fontSize: '0.65rem' }}>
                              {asset.filename}
                            </Typography>
                          )}
                        </Box>
                        {isSelected && (
                          <CheckCircleIcon sx={{ position: 'absolute', top: 6, right: 6, color: 'primary.main', bgcolor: 'white', borderRadius: '50%', fontSize: 20 }} />
                        )}
                        <Box sx={{ p: 0.75, bgcolor: 'background.paper' }}>
                          <Typography variant="caption" noWrap display="block" fontWeight={500}>{asset.filename}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                            {asset.width && asset.height ? `${asset.width}×${asset.height}` : 'Unknown size'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        )}

        {tab === 1 && (
          <Grid container spacing={1.5}>
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              const previewH = tpl.height / tpl.width > 1.2 ? 140 : tpl.height / tpl.width < 0.5 ? 70 : 110;
              return (
                <Grid item xs={6} sm={4} md={3} key={tpl.id}>
                  <Box
                    onClick={() => handleSelectTemplate(tpl)}
                    sx={{
                      position: 'relative',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: isSelected ? '2.5px solid' : '2px solid transparent',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      '&:hover': { borderColor: isSelected ? 'primary.main' : 'grey.400' },
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <Box
                      sx={{
                        height: previewH,
                        background: tpl.bg,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                      }}
                    >
                      <ImageIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 28 }} />
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.65rem', letterSpacing: 0.5 }}>
                        {tpl.aspectRatio}
                      </Typography>
                    </Box>
                    {isSelected && (
                      <CheckCircleIcon sx={{ position: 'absolute', top: 6, right: 6, color: 'primary.main', bgcolor: 'white', borderRadius: '50%', fontSize: 20 }} />
                    )}
                    <Box sx={{ p: 0.75, bgcolor: 'background.paper' }}>
                      <Typography variant="caption" noWrap display="block" fontWeight={600}>{tpl.label}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.25 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{tpl.width}×{tpl.height}</Typography>
                        <Chip label={tpl.category} size="small" sx={{ height: 14, fontSize: '0.55rem', px: 0 }} />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>

      {hasSelection && (
        <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <TextField
            size="small"
            fullWidth
            label="Alt text (accessibility)"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image for screen readers…"
          />
        </Box>
      )}

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!hasSelection} onClick={handleInsert}>
          Insert Image
        </Button>
      </DialogActions>
    </Dialog>
  );
}
