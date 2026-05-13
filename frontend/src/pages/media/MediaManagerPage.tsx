import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActions,
  Button, IconButton, Chip, TextField, InputAdornment, ToggleButton,
  ToggleButtonGroup, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Tabs, Tab, Select, MenuItem, FormControl,
  InputLabel, Divider, Paper, List, ListItem, ListItemText,
  ListItemIcon, Snackbar, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import ImageIcon from '@mui/icons-material/Image';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FolderIcon from '@mui/icons-material/Folder';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CropIcon from '@mui/icons-material/Crop';
import MovieIcon from '@mui/icons-material/Movie';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import FlipIcon from '@mui/icons-material/Flip';

import { useMediaStore, formatSize } from '../../stores/media.store';
import AITextField from '../../components/ai/AITextField';
import VideoCreatorDialog from './VideoCreatorDialog';

const BG_COLORS = ['#E8F5E9', '#E3F2FD', '#F3E5F5', '#FFF3E0', '#E0F2F1', '#FCE4EC'];

// ── Preset sizes ──────────────────────────────────────────────────────────────
const IMAGE_PRESETS = [
  { label: 'Hero Banner',      width: 1920, height: 600  },
  { label: 'Feature (16:9)',   width: 1200, height: 675  },
  { label: 'Portrait (2:3)',   width: 800,  height: 1200 },
  { label: 'Square (1:1)',     width: 1080, height: 1080 },
  { label: 'Pull Quote BG',    width: 1200, height: 400  },
  { label: 'Half Column',      width: 600,  height: 400  },
  { label: 'Cover (5:7)',      width: 1000, height: 1400 },
  { label: 'Custom',           width: 0,    height: 0    },
];

const GRADIENT_PRESETS = [
  { label: 'Ocean Blue',    from: '#1565C0', to: '#0288D1' },
  { label: 'Forest Green',  from: '#2E7D32', to: '#66BB6A' },
  { label: 'Purple Haze',   from: '#6A1B9A', to: '#BA68C8' },
  { label: 'Sunset Orange', from: '#E65100', to: '#FF8A65' },
  { label: 'Teal Splash',   from: '#00838F', to: '#4DD0E1' },
  { label: 'Rose Gold',     from: '#AD1457', to: '#F06292' },
  { label: 'Midnight',      from: '#212121', to: '#424242' },
  { label: 'Custom',        from: '#1565C0', to: '#0288D1' },
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function generateImageBlob(
  width: number,
  height: number,
  fromColor: string,
  toColor: string,
  direction: 'horizontal' | 'vertical' | 'diagonal',
  titleText: string,
  subtitleText: string,
  fontFamily: string,
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const SCALE = Math.min(2, 1200 / Math.max(width, height));
    canvas.width = width * SCALE;
    canvas.height = height * SCALE;
    const ctx = canvas.getContext('2d')!;

    // Gradient background
    let grad: CanvasGradient;
    if (direction === 'horizontal') {
      grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    } else if (direction === 'vertical') {
      grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    } else {
      grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    }
    grad.addColorStop(0, fromColor);
    grad.addColorStop(1, toColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle overlay pattern (dots)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    const dotSpacing = 28 * SCALE;
    for (let x = 0; x < canvas.width; x += dotSpacing) {
      for (let y = 0; y < canvas.height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 2 * SCALE, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Title text
    if (titleText) {
      const maxFontSize = Math.min(canvas.width / 10, 80 * SCALE);
      ctx.font = `900 ${maxFontSize}px ${fontFamily}`;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = wrapText(ctx, titleText, canvas.width * 0.85, maxFontSize);
      const lineH = maxFontSize * 1.25;
      const totalH = lines.length * lineH + (subtitleText ? lineH * 0.9 : 0);
      const startY = canvas.height / 2 - totalH / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineH + lineH / 2);
      });
      if (subtitleText) {
        const subSize = maxFontSize * 0.4;
        ctx.font = `400 ${subSize}px ${fontFamily}`;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText(subtitleText, canvas.width / 2, startY + lines.length * lineH + subSize * 0.9);
      }
    }

    // Dimensions watermark bottom-right
    ctx.font = `500 ${11 * SCALE}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${width}×${height}`, canvas.width - 8 * SCALE, canvas.height - 6 * SCALE);

    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92);
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseVideoUrl(url: string): { platform: 'youtube' | 'vimeo' | null; id: string; embedUrl: string; thumbUrl: string } {
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return { platform: 'youtube', id, embedUrl: `https://www.youtube.com/embed/${id}`, thumbUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
  }
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) {
    const id = vmMatch[1];
    return { platform: 'vimeo', id, embedUrl: `https://player.vimeo.com/video/${id}`, thumbUrl: '' };
  }
  return { platform: null, id: '', embedUrl: '', thumbUrl: '' };
}

// ── Folder types ─────────────────────────────────────────────────────────────
interface MediaFolder { id: string; name: string; createdAt: string; }

function loadFolders(): MediaFolder[] {
  try { return JSON.parse(localStorage.getItem('media-folders') ?? 'null') ?? [
    { id: 'f1', name: 'Cover Images',   createdAt: '2025-01-10' },
    { id: 'f2', name: 'Article Photos', createdAt: '2025-01-12' },
    { id: 'f3', name: 'Infographics',   createdAt: '2025-02-01' },
  ]; } catch { return []; }
}

// ── Image Editor Dialog ───────────────────────────────────────────────────────
function ImageCropDialog({ asset, onClose, onSave }: {
  asset: { url: string; filename: string; altText: string } | null;
  onClose: () => void;
  onSave: (url: string, filename: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const [scale,      setScale]      = useState(100);
  const [offsetX,    setOffsetX]    = useState(0);
  const [offsetY,    setOffsetY]    = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast,   setContrast]   = useState(100);
  const [rotation,   setRotation]   = useState(0);
  const [flipH,      setFlipH]      = useState(false);
  const [flipV,      setFlipV]      = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const isRotated90 = rotation === 90 || rotation === 270;
    const baseW = isRotated90 ? img.height : img.width;
    const baseH = isRotated90 ? img.width  : img.height;
    const maxW = 380; const maxH = 260;
    const ratio = Math.min(maxW / baseW, maxH / baseH, 1) * (scale / 100);
    canvas.width  = Math.max(1, Math.round(baseW * ratio));
    canvas.height = Math.max(1, Math.round(baseH * ratio));

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.save();
    ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.width * ratio / 2, -img.height * ratio / 2, img.width * ratio, img.height * ratio);
    ctx.restore();
  }, [scale, offsetX, offsetY, brightness, contrast, rotation, flipH, flipV]);

  useEffect(() => {
    if (!asset?.url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; redraw(); };
    img.src = asset.url;
  }, [asset]);

  useEffect(() => { redraw(); }, [redraw]);

  const rotate = (dir: 'left' | 'right') =>
    setRotation((r) => (r + (dir === 'right' ? 90 : -90) + 360) % 360);

  const resetAll = () => {
    setScale(100); setOffsetX(0); setOffsetY(0);
    setBrightness(100); setContrast(100); setRotation(0);
    setFlipH(false); setFlipV(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !asset) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      onSave(URL.createObjectURL(blob), `edited-${asset.filename}`);
    }, 'image/jpeg', 0.92);
  };

  const Slider = ({ label, value, min, max, onChange, unit = '' }: {
    label: string; value: number; min: number; max: number; unit?: string;
    onChange: (v: number) => void;
  }) => (
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary">{label}: <strong>{value}{unit}</strong></Typography>
      <Box component="input" type="range" min={min} max={max} value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#2E7D32' }} />
    </Box>
  );

  if (!asset) return null;
  return (
    <Dialog open={!!asset} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CropIcon color="primary" /> Image Editor
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          {/* Canvas preview */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.100', p: 1, minHeight: 220, alignItems: 'center' }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', display: 'block', borderRadius: 4 }} />
            </Box>
            {/* Rotate & Flip */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Tooltip title="Rotate left 90°">
                <IconButton size="small" onClick={() => rotate('left')}><RotateLeftIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Rotate right 90°">
                <IconButton size="small" onClick={() => rotate('right')}><RotateRightIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Flip horizontal">
                <IconButton size="small" color={flipH ? 'primary' : 'default'} onClick={() => setFlipH((v) => !v)}>
                  <FlipIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Flip vertical">
                <IconButton size="small" color={flipV ? 'primary' : 'default'} onClick={() => setFlipV((v) => !v)}
                  sx={{ transform: 'rotate(90deg)' }}>
                  <FlipIcon />
                </IconButton>
              </Tooltip>
              <Button size="small" variant="text" onClick={resetAll} sx={{ fontSize: '0.72rem' }}>Reset all</Button>
            </Box>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 180 }}>
            <Slider label="Scale"      value={scale}      min={10}  max={200} unit="%" onChange={setScale} />
            <Slider label="Brightness" value={brightness} min={20}  max={200} unit="%" onChange={setBrightness} />
            <Slider label="Contrast"   value={contrast}   min={20}  max={200} unit="%" onChange={setContrast} />
            <Divider />
            <Slider label="Pan X" value={offsetX} min={-150} max={150} unit="px" onChange={setOffsetX} />
            <Slider label="Pan Y" value={offsetY} min={-150} max={150} unit="px" onChange={setOffsetY} />
            <Alert severity="info" sx={{ fontSize: '0.72rem', py: 0.5 }}>
              Saves as a new asset — original is preserved.
            </Alert>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<CropIcon />} onClick={handleSave}>Save as New Asset</Button>
      </DialogActions>
    </Dialog>
  );
}


// ── Create Image Dialog ───────────────────────────────────────────────────────
function CreateImageDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addAsset } = useMediaStore();
  const [presetIdx, setPresetIdx] = useState(0);
  const [customW, setCustomW] = useState(1200);
  const [customH, setCustomH] = useState(675);
  const [gradientIdx, setGradientIdx] = useState(0);
  const [fromColor, setFromColor] = useState(GRADIENT_PRESETS[0].from);
  const [toColor, setToColor] = useState(GRADIENT_PRESETS[0].to);
  const [direction, setDirection] = useState<'horizontal' | 'vertical' | 'diagonal'>('diagonal');
  const [titleText, setTitleText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [fontFamily, setFontFamily] = useState('Georgia, serif');
  const [creating, setCreating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const preset = IMAGE_PRESETS[presetIdx];
  const width = preset.label === 'Custom' ? customW : preset.width;
  const height = preset.label === 'Custom' ? customH : preset.height;

  const renderPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;
    const scale = Math.min(320 / width, 180 / height);
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;

    let grad: CanvasGradient;
    if (direction === 'horizontal') grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    else if (direction === 'vertical') grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    else grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, fromColor);
    grad.addColorStop(1, toColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (titleText) {
      const fs = Math.min(canvas.width / 8, 28);
      ctx.font = `900 ${fs}px ${fontFamily}`;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(titleText, canvas.width / 2, canvas.height / 2);
    }
  }, [width, height, fromColor, toColor, direction, titleText, fontFamily]);

  React.useEffect(() => { renderPreview(); }, [renderPreview]);

  const handleGradientPreset = (idx: number) => {
    setGradientIdx(idx);
    if (GRADIENT_PRESETS[idx].label !== 'Custom') {
      setFromColor(GRADIENT_PRESETS[idx].from);
      setToColor(GRADIENT_PRESETS[idx].to);
    }
  };

  const handleCreate = async () => {
    if (!width || !height) return;
    setCreating(true);
    const blob = await generateImageBlob(width, height, fromColor, toColor, direction, titleText, subtitleText, fontFamily);
    const url = URL.createObjectURL(blob);
    const filename = `generated-${width}x${height}-${Date.now()}.jpg`;
    addAsset({
      filename,
      mimeType: 'image/jpeg',
      size: blob.size,
      width,
      height,
      url,
      altText: titleText || filename,
      caption: subtitleText,
      usageCount: 0,
      uploadedBy: 'Studio',
    });
    setCreating(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AddPhotoAlternateIcon color="primary" /> Create Image
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Left: controls */}
          <Grid item xs={12} md={7}>
            <Typography variant="body2" fontWeight={600} gutterBottom>Canvas Size</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
              {IMAGE_PRESETS.map((p, i) => (
                <Chip
                  key={p.label} label={`${p.label}${p.width ? ` (${p.width}×${p.height})` : ''}`}
                  size="small" clickable
                  variant={presetIdx === i ? 'filled' : 'outlined'}
                  color={presetIdx === i ? 'primary' : 'default'}
                  onClick={() => setPresetIdx(i)}
                />
              ))}
            </Box>
            {preset.label === 'Custom' && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField size="small" label="Width (px)" type="number" value={customW} onChange={(e) => setCustomW(Number(e.target.value))} sx={{ width: 130 }} />
                <TextField size="small" label="Height (px)" type="number" value={customH} onChange={(e) => setCustomH(Number(e.target.value))} sx={{ width: 130 }} />
              </Box>
            )}

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" fontWeight={600} gutterBottom>Gradient Style</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
              {GRADIENT_PRESETS.map((g, i) => (
                <Tooltip key={g.label} title={g.label}>
                  <Box
                    onClick={() => handleGradientPreset(i)}
                    sx={{
                      width: 32, height: 32, borderRadius: 1, cursor: 'pointer',
                      background: `linear-gradient(135deg,${g.from},${g.to})`,
                      border: gradientIdx === i ? '2.5px solid' : '2px solid transparent',
                      borderColor: gradientIdx === i ? 'primary.main' : 'transparent',
                      transition: 'border-color 0.15s',
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <Box>
                <Typography variant="caption">From color</Typography>
                <Box component="input" type="color" value={fromColor} onChange={(e) => { setFromColor(e.target.value); setGradientIdx(GRADIENT_PRESETS.length - 1); }} sx={{ width: 48, height: 32, border: 'none', cursor: 'pointer', borderRadius: 1, display: 'block' }} />
              </Box>
              <Box>
                <Typography variant="caption">To color</Typography>
                <Box component="input" type="color" value={toColor} onChange={(e) => { setToColor(e.target.value); setGradientIdx(GRADIENT_PRESETS.length - 1); }} sx={{ width: 48, height: 32, border: 'none', cursor: 'pointer', borderRadius: 1, display: 'block' }} />
              </Box>
              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Direction</InputLabel>
                <Select value={direction} label="Direction" onChange={(e) => setDirection(e.target.value as typeof direction)}>
                  <MenuItem value="diagonal">Diagonal</MenuItem>
                  <MenuItem value="horizontal">Horizontal</MenuItem>
                  <MenuItem value="vertical">Vertical</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" fontWeight={600} gutterBottom>Text Overlay</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <AITextField size="small" label="Title text" fullWidth fieldType="image_title" aiContext={{ title: titleText, subtitle: subtitleText }} value={titleText} onChange={setTitleText} placeholder="Main headline…" />
              <AITextField size="small" label="Subtitle / caption" fullWidth fieldType="image_subtitle" aiContext={{ title: titleText, subtitle: subtitleText }} value={subtitleText} onChange={setSubtitleText} placeholder="Supporting text…" />
              <FormControl size="small" fullWidth>
                <InputLabel>Font family</InputLabel>
                <Select value={fontFamily} label="Font family" onChange={(e) => setFontFamily(e.target.value)}>
                  <MenuItem value="Georgia, serif">Georgia (Serif)</MenuItem>
                  <MenuItem value="'Helvetica Neue', sans-serif">Helvetica (Sans)</MenuItem>
                  <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
                  <MenuItem value="Impact, sans-serif">Impact (Bold)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>

          {/* Right: preview */}
          <Grid item xs={12} md={5}>
            <Typography variant="body2" fontWeight={600} gutterBottom>Preview</Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', display: 'block' }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              {width} × {height} px
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!width || !height || creating} startIcon={<AddPhotoAlternateIcon />}>
          {creating ? 'Generating…' : 'Add to Library'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Add Video Dialog ──────────────────────────────────────────────────────────
function AddVideoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addAsset } = useMediaStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const parsed = parseVideoUrl(url);

  const handleAdd = () => {
    if (!parsed.platform) return;
    addAsset({
      filename: `${parsed.platform}-${parsed.id}.mp4`,
      mimeType: 'video/embed',
      size: 0,
      url: parsed.embedUrl,
      altText: title || `${parsed.platform} video ${parsed.id}`,
      caption: url,
      usageCount: 0,
      uploadedBy: 'Studio',
    });
    setUrl('');
    setTitle('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VideoLibraryIcon color="secondary" /> Add Video
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>Paste a YouTube or Vimeo URL. The video will be stored as an embed link in your media library.</Alert>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Video URL" fullWidth
            value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…"
            size="small"
          />
          {parsed.platform && (
            <Alert severity="success">
              Detected: <strong>{parsed.platform === 'youtube' ? 'YouTube' : 'Vimeo'}</strong> · ID: {parsed.id}
            </Alert>
          )}
          {parsed.thumbUrl && (
            <Box sx={{ borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
              <Box component="img" src={parsed.thumbUrl} alt="Thumbnail" sx={{ width: '100%', display: 'block', borderRadius: 1 }} />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayCircleOutlineIcon sx={{ fontSize: 56, color: 'white', opacity: 0.85 }} />
              </Box>
            </Box>
          )}
          <AITextField
            label="Title / description" fullWidth
            fieldType="video_title"
            aiContext={{ platform: parsed.platform ?? '', videoId: parsed.id }}
            value={title} onChange={setTitle}
            placeholder="e.g. Introduction to Marine Biology"
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="secondary" disabled={!parsed.platform} onClick={handleAdd} startIcon={<VideoLibraryIcon />}>
          Add to Library
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MediaManagerPage() {
  const { search, setSearch, filteredAssets, addAsset, deleteAsset } = useMediaStore();
  const assets = filteredAssets();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadOpen,    setUploadOpen]    = useState(false);
  const [createOpen,    setCreateOpen]    = useState(false);
  const [videoOpen,     setVideoOpen]     = useState(false);
  const [videoGenOpen,  setVideoGenOpen]  = useState(false);
  const [filterTab, setFilterTab] = useState(0);
  const [pageTab, setPageTab] = useState(0);
  const [cropAsset, setCropAsset] = useState<{ url: string; filename: string; altText: string } | null>(null);
  const [folders, setFolders] = useState<MediaFolder[]>(loadFolders);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [snack, setSnack] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSize = useMediaStore((s) => s.assets.reduce((sum, a) => sum + a.size, 0));

  const filteredByType = assets.filter((a) => {
    if (filterTab === 1) return a.mimeType.startsWith('image/');
    if (filterTab === 2) return a.mimeType.startsWith('video/');
    return true;
  });

  const persistFolders = (updated: MediaFolder[]) => {
    setFolders(updated);
    localStorage.setItem('media-folders', JSON.stringify(updated));
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: MediaFolder = { id: Date.now().toString(), name: newFolderName.trim(), createdAt: new Date().toISOString().split('T')[0] };
    persistFolders([...folders, folder]);
    setNewFolderName('');
    setFolderDialogOpen(false);
    setSnack(`Folder "${folder.name}" created.`);
  };

  const handleCropSave = (url: string, filename: string) => {
    addAsset({ filename, mimeType: 'image/jpeg', size: 0, url, altText: `Cropped: ${filename}`, caption: '', usageCount: 0, uploadedBy: 'Studio' });
    setCropAsset(null);
    setSnack('Cropped image saved as new asset.');
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      addAsset({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        altText: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        caption: '',
        usageCount: 0,
        uploadedBy: 'Admin User',
      });
    });
    setUploadOpen(false);
  };

  const isVideo = (a: ReturnType<typeof filteredAssets>[number]) =>
    a.mimeType.startsWith('video/') || a.mimeType === 'video/embed';

  const isVideoGenerated = (a: ReturnType<typeof filteredAssets>[number]) =>
    a.mimeType === 'video/generated';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Media Manager</Typography>
          <Typography variant="body2" color="text.secondary">
            {useMediaStore.getState().assets.length} assets · {formatSize(totalSize)} total
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" color="secondary" startIcon={<VideoLibraryIcon />} onClick={() => setVideoOpen(true)}>
            Add Video
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<MovieIcon />} onClick={() => setVideoGenOpen(true)}>
            Create Video
          </Button>
          <Button variant="outlined" color="primary" startIcon={<AddPhotoAlternateIcon />} onClick={() => setCreateOpen(true)}>
            Create Image
          </Button>
          <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
            Upload
          </Button>
        </Box>
      </Box>

      {/* Page-level tabs */}
      <Tabs value={pageTab} onChange={(_, v) => setPageTab(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab icon={<ImageIcon fontSize="small" />} iconPosition="start" label="All Media" />
        <Tab icon={<FolderIcon fontSize="small" />} iconPosition="start" label={`Folders (${folders.length})`} />
      </Tabs>

      {/* Folders view */}
      {pageTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="outlined" startIcon={<CreateNewFolderIcon />} onClick={() => setFolderDialogOpen(true)}>New Folder</Button>
          </Box>
          <Grid container spacing={2}>
            {folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 2 }}
                  onClick={() => { setPageTab(0); setSnack(`Showing assets in "${folder.name}"`); }}
                >
                  <FolderIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{folder.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Created {folder.createdAt}</Typography>
                  </Box>
                  <Tooltip title="Delete folder">
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); persistFolders(folders.filter((f) => f.id !== folder.id)); setSnack(`Folder "${folder.name}" deleted.`); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Paper>
              </Grid>
            ))}
            {folders.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled' }}>
                  <FolderIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>No folders yet. Create one to organise your assets.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Filter tabs + search + asset grid (only in media tab) */}
      {pageTab === 0 && (<>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)} sx={{ minHeight: 36 }}>
          <Tab label="All" sx={{ minHeight: 36, py: 0 }} />
          <Tab label="Images" sx={{ minHeight: 36, py: 0 }} />
          <Tab label="Videos" sx={{ minHeight: 36, py: 0 }} />
        </Tabs>
        <TextField
          placeholder="Search assets…" size="small" sx={{ flex: 1, maxWidth: 360 }}
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
          <ToggleButton value="grid"><GridViewIcon /></ToggleButton>
          <ToggleButton value="list"><ViewListIcon /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {filteredByType.length === 0 && (
        <Alert severity="info">
          No assets found.{' '}
          <Button size="small" onClick={() => { setSearch(''); setFilterTab(0); }}>Clear filters</Button>
        </Alert>
      )}

      {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredByType.map((asset, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  sx={{ height: 160, bgcolor: BG_COLORS[i % BG_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
                >
                  {isVideoGenerated(asset) && asset.url ? (
                    <>
                      <Box component="img" src={asset.url} alt={asset.altText} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.15)' }}>
                        <PlayCircleOutlineIcon sx={{ fontSize: 40, color: 'white', opacity: 0.9 }} />
                      </Box>
                      <Chip label="AI Video" size="small" color="secondary" sx={{ position: 'absolute', top: 6, left: 6, height: 18, fontSize: '0.6rem' }} />
                    </>
                  ) : isVideo(asset) ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <PlayCircleOutlineIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">{asset.mimeType === 'video/embed' ? 'Embed' : 'Video'}</Typography>
                    </Box>
                  ) : asset.url ? (
                    <Box component="img" src={asset.url} alt={asset.altText} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                  )}
                  {asset.mimeType === 'video/embed' && (
                    <Chip label="Embed" size="small" color="secondary" sx={{ position: 'absolute', top: 6, right: 6, height: 18, fontSize: '0.6rem' }} />
                  )}
                </CardMedia>
                <CardContent sx={{ pb: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap title={asset.filename}>{asset.filename}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ''}{asset.size ? formatSize(asset.size) : 'Embed'}
                  </Typography>
                  {asset.usageCount > 0 && (
                    <Chip label={`Used ${asset.usageCount}×`} size="small" color="success" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                  )}
                </CardContent>
                <CardActions>
                  {asset.url && asset.mimeType !== 'video/embed' && (
                    <>
                      <Tooltip title="Download">
                        <IconButton size="small" component="a" href={asset.url} download={asset.filename}><DownloadIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Crop / Resize">
                        <IconButton size="small" color="primary" onClick={() => setCropAsset({ url: asset.url, filename: asset.filename, altText: asset.altText })}><CropIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </>
                  )}
                  {asset.mimeType === 'video/embed' && (
                    <Tooltip title="Open embed URL">
                      <IconButton size="small" component="a" href={asset.caption} target="_blank" rel="noopener"><PlayCircleOutlineIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => deleteAsset(asset.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          {filteredByType.map((asset, i) => (
            <Box key={asset.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: 1, bgcolor: BG_COLORS[i % BG_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {isVideo(asset) ? (
                  <PlayCircleOutlineIcon sx={{ color: 'text.disabled' }} />
                ) : asset.url ? (
                  <Box component="img" src={asset.url} alt={asset.altText} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon sx={{ color: 'text.disabled' }} />
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{asset.filename}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {asset.mimeType} · {asset.size ? formatSize(asset.size) : 'Embed'}
                  {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''}
                </Typography>
              </Box>
              {asset.usageCount > 0 && <Chip label={`${asset.usageCount} uses`} size="small" color="success" />}
              {asset.mimeType === 'video/embed' ? (
                <IconButton size="small" component="a" href={asset.caption} target="_blank" rel="noopener"><PlayCircleOutlineIcon fontSize="small" /></IconButton>
              ) : asset.url ? (
                <IconButton size="small" component="a" href={asset.url} download={asset.filename}><DownloadIcon fontSize="small" /></IconButton>
              ) : null}
              <IconButton size="small" color="error" onClick={() => deleteAsset(asset.id)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ))}
        </Card>
      )}
      </>)}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Media</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>Supported: JPG, PNG, GIF, WebP, SVG, MP4, PDF</Alert>
          <Box
            sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" fontWeight={600}>Drag & drop files here</Typography>
            <Typography variant="body2" color="text.secondary">or click to browse</Typography>
            <input ref={fileRef} type="file" hidden multiple accept="image/*,video/*,.pdf" onChange={(e) => handleFiles(e.target.files)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New Folder dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Folder</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            label="Folder Name" fullWidth autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddFolder} disabled={!newFolderName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      <CreateImageDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <AddVideoDialog open={videoOpen} onClose={() => setVideoOpen(false)} />
      <VideoCreatorDialog open={videoGenOpen} onClose={() => setVideoGenOpen(false)} />
      <ImageCropDialog asset={cropAsset} onClose={() => setCropAsset(null)} onSave={handleCropSave} />
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
