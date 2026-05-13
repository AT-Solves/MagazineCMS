import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Grid, Tooltip, Chip, TextField,
  InputAdornment, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import TableChartIcon from '@mui/icons-material/TableChart';
import GridViewIcon from '@mui/icons-material/GridView';

import { useMediaStore } from '../../stores/media.store';

interface LayoutBlock {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  html: string;
  category: 'image' | 'text' | 'mixed';
}

const LAYOUT_BLOCKS: LayoutBlock[] = [
  {
    id: 'hero-image',
    label: 'Hero Image',
    description: 'Full-width banner image at top',
    icon: <ImageIcon />,
    category: 'image',
    html: '<figure style="margin:2em 0;text-align:center"><img src="https://placehold.co/1200x500/1565C0/ffffff?text=Hero+Image" alt="Hero image" style="max-width:100%;border-radius:8px" /><figcaption style="font-size:0.8rem;color:#666;margin-top:6px">Caption goes here</figcaption></figure>',
  },
  {
    id: 'two-col',
    label: 'Image + Text',
    description: 'Side-by-side image and text',
    icon: <ViewColumnIcon />,
    category: 'mixed',
    html: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:2em 0;align-items:start"><figure style="margin:0"><img src="https://placehold.co/600x400/2E7D32/ffffff?text=Image" alt="Article image" style="max-width:100%;border-radius:6px" /></figure><div><p>Enter your text alongside this image. This layout works well for storytelling where the image reinforces the narrative.</p></div></div>',
  },
  {
    id: 'pull-quote',
    label: 'Pull Quote',
    description: 'Highlighted quote block',
    icon: <FormatQuoteIcon />,
    category: 'text',
    html: '<blockquote style="margin:2em auto;max-width:600px;border-left:4px solid #1565C0;padding:16px 24px;background:#f0f4ff;border-radius:0 8px 8px 0"><p style="font-size:1.2rem;font-style:italic;color:#1565C0;margin:0">"Insert your compelling pull quote here — a memorable line from the article."</p><cite style="font-size:0.85rem;color:#666;margin-top:8px;display:block">— Author Name</cite></blockquote>',
  },
  {
    id: 'text-image-right',
    label: 'Text + Image',
    description: 'Text left, image right',
    icon: <ViewColumnIcon sx={{ transform: 'scaleX(-1)' }} />,
    category: 'mixed',
    html: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:2em 0;align-items:start"><div><h3>Section heading</h3><p>Your article text goes here. This layout puts the image on the right, drawing the eye across the page naturally.</p></div><figure style="margin:0"><img src="https://placehold.co/600x400/6A1B9A/ffffff?text=Image" alt="Article image" style="max-width:100%;border-radius:6px" /></figure></div>',
  },
  {
    id: 'gallery-row',
    label: 'Image Gallery',
    description: 'Three images in a row',
    icon: <GridViewIcon />,
    category: 'image',
    html: '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:2em 0"><figure style="margin:0"><img src="https://placehold.co/400x300/E65100/ffffff?text=Photo+1" alt="" style="max-width:100%;border-radius:6px" /></figure><figure style="margin:0"><img src="https://placehold.co/400x300/00838F/ffffff?text=Photo+2" alt="" style="max-width:100%;border-radius:6px" /></figure><figure style="margin:0"><img src="https://placehold.co/400x300/AD1457/ffffff?text=Photo+3" alt="" style="max-width:100%;border-radius:6px" /></figure></div>',
  },
  {
    id: 'info-box',
    label: 'Info Box',
    description: 'Callout / tip box',
    icon: <ViewHeadlineIcon />,
    category: 'text',
    html: '<div style="background:#e8f5e9;border:1px solid #4caf50;border-radius:8px;padding:16px 20px;margin:1.5em 0"><strong style="color:#2E7D32">💡 Did You Know?</strong><p style="margin:8px 0 0">Add your interesting fact or tip here. Info boxes are great for breaking up long articles and highlighting key points.</p></div>',
  },
  {
    id: 'data-callout',
    label: 'Stats / Data',
    description: 'Highlight a key statistic',
    icon: <TableChartIcon />,
    category: 'text',
    html: '<div style="text-align:center;background:linear-gradient(135deg,#1565C0,#0288D1);color:white;border-radius:12px;padding:32px 24px;margin:2em 0"><p style="font-size:3rem;font-weight:900;margin:0;line-height:1">42%</p><p style="font-size:1rem;margin:8px 0 0;opacity:0.9">Stat description — replace with your key data point</p></div>',
  },
  {
    id: 'portrait-feature',
    label: 'Portrait Feature',
    description: 'Tall portrait with caption',
    icon: <ImageIcon />,
    category: 'image',
    html: '<figure style="margin:2em auto;max-width:500px;text-align:center"><img src="https://placehold.co/500x700/4527A0/ffffff?text=Portrait" alt="Featured person" style="max-width:100%;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15)" /><figcaption style="font-size:0.85rem;color:#666;margin-top:8px;font-style:italic">Person name, title or photo credit</figcaption></figure>',
  },
];

function assetBg(id: string): string {
  const palette = ['#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00838F', '#AD1457', '#37474F', '#4527A0'];
  const idx = id.charCodeAt(id.length - 1) % palette.length;
  return `linear-gradient(135deg,${palette[idx]}99,${palette[(idx + 3) % palette.length]}66)`;
}

const CATEGORY_COLORS = { image: 'primary', text: 'secondary', mixed: 'success' } as const;

interface ContentBlocksPanelProps {
  onInsertBlock: (html: string) => void;
}

export default function ContentBlocksPanel({ onInsertBlock }: ContentBlocksPanelProps) {
  const { assets } = useMediaStore();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  const filteredBlocks = LAYOUT_BLOCKS.filter(
    (b) => !search || b.label.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredAssets = assets.filter(
    (a) => !search || a.filename.toLowerCase().includes(search.toLowerCase()) || a.altText.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDragStart = (e: React.DragEvent, html: string) => {
    e.dataTransfer.setData('text/html', html);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAssetDragStart = (e: React.DragEvent, assetHtml: string) => {
    e.dataTransfer.setData('text/html', assetHtml);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 1.5, background: 'linear-gradient(135deg,#E65100,#FF8A65)', color: 'white' }}>
        <Typography variant="subtitle2" fontWeight={700}>Content Blocks & Media</Typography>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>Drag blocks into the editor</Typography>
      </Box>

      <Box sx={{ px: 1.5, pt: 1 }}>
        <TextField
          size="small" fullWidth placeholder="Search…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 0.5 }} variant="fullWidth">
          <Tab label="Blocks" sx={{ fontSize: '0.75rem', minHeight: 36 }} />
          <Tab label="Media" sx={{ fontSize: '0.75rem', minHeight: 36 }} />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Drag a block into the editor or click to insert at cursor
            </Typography>
            {filteredBlocks.map((block) => (
              <Box
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, block.html)}
                onClick={() => onInsertBlock(block.html)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1, borderRadius: 1.5,
                  border: '1px solid', borderColor: 'divider',
                  cursor: 'grab',
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.light' },
                  '&:active': { cursor: 'grabbing' },
                  transition: 'all 0.15s',
                }}
              >
                <Box sx={{ color: 'text.secondary', display: 'flex', flexShrink: 0 }}>{block.icon}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" fontWeight={600} display="block">{block.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{block.description}</Typography>
                </Box>
                <Chip
                  label={block.category}
                  size="small"
                  color={CATEGORY_COLORS[block.category]}
                  sx={{ height: 16, fontSize: '0.6rem', px: 0, flexShrink: 0 }}
                />
              </Box>
            ))}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Drag images into the editor to insert them
            </Typography>
            <Grid container spacing={1}>
              {filteredAssets.map((asset) => {
                const imgSrc = asset.url?.startsWith('blob:')
                  ? asset.url
                  : `https://placehold.co/${asset.width ?? 400}x${asset.height ?? 300}/1565C0/ffffff?text=${encodeURIComponent(asset.altText || asset.filename)}`;
                const figureHtml = `<figure style="margin:1.5em 0;text-align:center"><img src="${imgSrc}" alt="${asset.altText || asset.filename}" style="max-width:100%;border-radius:4px" />${asset.caption ? `<figcaption style="font-size:0.8rem;color:#666;margin-top:4px">${asset.caption}</figcaption>` : ''}</figure>`;
                return (
                  <Grid item xs={6} key={asset.id}>
                    <Tooltip title={`Drag to insert: ${asset.filename}`} placement="right">
                      <Box
                        draggable
                        onDragStart={(e) => handleAssetDragStart(e, figureHtml)}
                        onClick={() => onInsertBlock(figureHtml)}
                        sx={{
                          borderRadius: 1.5, overflow: 'hidden', cursor: 'grab',
                          border: '2px solid transparent',
                          '&:hover': { borderColor: 'primary.light' },
                          '&:active': { cursor: 'grabbing' },
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <Box
                          sx={{
                            height: 70,
                            background: asset.url?.startsWith('blob:') ? undefined : assetBg(asset.id),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          }}
                        >
                          {asset.url?.startsWith('blob:') ? (
                            <Box component="img" src={asset.url} alt={asset.altText} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <ImageIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 24 }} />
                          )}
                        </Box>
                        <Box sx={{ p: 0.5, bgcolor: 'background.paper' }}>
                          <Typography variant="caption" noWrap display="block" sx={{ fontSize: '0.62rem' }}>{asset.filename}</Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  </Grid>
                );
              })}
            </Grid>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              Upload more assets in the Media Manager
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
