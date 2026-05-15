import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Button, IconButton, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Stepper,
  Step, StepLabel, Card, CardContent, Divider, Avatar, Tooltip,
  CircularProgress, Paper, FormControl, InputLabel, Select, MenuItem,
  Collapse, Slider,
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import DeleteIcon from '@mui/icons-material/Delete';
import MicIcon from '@mui/icons-material/Mic';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TuneIcon from '@mui/icons-material/Tune';
import BoltIcon from '@mui/icons-material/Bolt';

import { useMediaStore } from '../../stores/media.store';
import {
  generateVideoStory,
  type VideoCharacter,
  type VideoStory,
  type CharacterRole,
} from '../../services/ai.service';

// ── Production styles ─────────────────────────────────────────────────────────
export const PRODUCTION_STYLES = [
  { value: 'animated',    label: '2D Animation',  emoji: '🎨', desc: 'Bright cel-shaded cartoon'   },
  { value: 'cartoon',     label: 'Cartoon',       emoji: '🎭', desc: 'Playful character art'        },
  { value: 'cgi',         label: '3D / CGI',      emoji: '💫', desc: 'Photorealistic 3D render'     },
  { value: 'live_action', label: 'Live Action',   emoji: '🎬', desc: 'Real-world film aesthetic'    },
  { value: 'whiteboard',  label: 'Whiteboard',    emoji: '✏️', desc: 'Sketch explainer style'       },
  { value: 'manga',       label: 'Manga',         emoji: '📖', desc: 'Japanese ink panel art'       },
  { value: 'cinematic',   label: 'Cinematic',     emoji: '🌑', desc: 'Dark anamorphic film'         },
  { value: 'watercolor',  label: 'Watercolor',    emoji: '🖌️', desc: 'Soft painted washes'          },
  { value: 'stop_motion', label: 'Stop Motion',   emoji: '🪆', desc: 'Claymation / craft feel'      },
] as const;
export type ProductionStyleValue = typeof PRODUCTION_STYLES[number]['value'];

// ── Genres ────────────────────────────────────────────────────────────────────
const GENRES = [
  { value: 'adventure',   label: 'Adventure',   emoji: '🗺️' },
  { value: 'educational', label: 'Educational', emoji: '📚' },
  { value: 'mystery',     label: 'Mystery',     emoji: '🔍' },
  { value: 'fantasy',     label: 'Fantasy',     emoji: '✨' },
  { value: 'sci_fi',      label: 'Sci-Fi',      emoji: '🚀' },
  { value: 'comedy',      label: 'Comedy',      emoji: '😄' },
] as const;

// ── Character presets ─────────────────────────────────────────────────────────
const CHARACTER_PRESETS: VideoCharacter[] = [
  { id: 'p1', name: 'Alex',      role: 'hero',      personality: 'Brave, curious, determined',          color: '#2E7D32', emoji: '🦸' },
  { id: 'p2', name: 'Morgan',    role: 'mentor',    personality: 'Wise, patient, mysterious',            color: '#1565C0', emoji: '🧙' },
  { id: 'p3', name: 'Jordan',    role: 'sidekick',  personality: 'Loyal, funny, resourceful',            color: '#E65100', emoji: '🤝' },
  { id: 'p4', name: 'Sam',       role: 'explorer',  personality: 'Adventurous, bold, optimistic',        color: '#6A1B9A', emoji: '🧭' },
  { id: 'p5', name: 'Dr. Reed',  role: 'scientist', personality: 'Analytical, precise, enthusiastic',    color: '#00838F', emoji: '🔬' },
  { id: 'p6', name: 'Luna',      role: 'artist',    personality: 'Creative, empathetic, visionary',      color: '#AD1457', emoji: '🎨' },
  { id: 'p7', name: 'Rex',       role: 'villain',   personality: 'Cunning, ambitious, complex',          color: '#37474F', emoji: '😈' },
  { id: 'p8', name: 'The Voice', role: 'narrator',  personality: 'Articulate, engaging, warm',           color: '#455A64', emoji: '🎙️' },
];

const ROLE_EMOJIS: Record<CharacterRole, string> = {
  hero: '🦸', mentor: '🧙', sidekick: '🤝', explorer: '🧭',
  scientist: '🔬', artist: '🎨', villain: '😈', narrator: '🎙️', custom: '👤',
};

const CHAR_COLORS = ['#2E7D32','#1565C0','#E65100','#6A1B9A','#00838F','#AD1457','#37474F','#C62828','#F57F17','#00695C'];

// ── Prompt parser ─────────────────────────────────────────────────────────────
function parseVideoPrompt(text: string): { genre: string; style: ProductionStyleValue; premise: string } {
  const p = text.toLowerCase();

  let genre = 'adventure';
  if (/learn|teach|explain|educat|science|histor|how to|discover|fact/.test(p)) genre = 'educational';
  else if (/mystery|detect|clue|investig|secret|hidden|whodunit|crime/.test(p)) genre = 'mystery';
  else if (/magic|fantasy|dragon|wizard|elf|enchant|spell|mythic|fairy/.test(p)) genre = 'fantasy';
  else if (/space|robot|future|sci.?fi|alien|technolog|cyber|galax/.test(p)) genre = 'sci_fi';
  else if (/funny|humor|comedy|laugh|joke|silly|absurd|mishap|chaos/.test(p)) genre = 'comedy';

  let style: ProductionStyleValue = 'animated';
  if (/\bcartoon\b|looney|slapstick|toon/.test(p)) style = 'cartoon';
  else if (/manga|anime|japanese|ink panel/.test(p)) style = 'manga';
  else if (/cinematic|film noir|dramatic|dark film|moody|thriller/.test(p)) style = 'cinematic';
  else if (/whiteboard|explainer|tutorial|diagram|sketch/.test(p)) style = 'whiteboard';
  else if (/\b3[- ]?d\b|cgi|photorealistic|render/.test(p)) style = 'cgi';
  else if (/watercolou?r|painted|soft|pastel|wash/.test(p)) style = 'watercolor';
  else if (/stop.?motion|claymation|craft|paper.?cut/.test(p)) style = 'stop_motion';
  else if (/live.?action|real.?world|documentary/.test(p)) style = 'live_action';
  else if (genre === 'educational') style = 'whiteboard';
  else if (genre === 'fantasy') style = 'watercolor';

  return { genre, style, premise: text };
}

// ── Canvas renderer per style ─────────────────────────────────────────────────
function renderSceneCanvas(
  canvas: HTMLCanvasElement,
  style: ProductionStyleValue,
  cast: VideoCharacter[],
  sceneTitle: string,
  sceneNum: number,
) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);

  const drawEmoji = (emoji: string, x: number, y: number, size: number) => {
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
  };

  const charX = (i: number, total: number) => W * (0.5 - (total - 1) * 0.15 + i * 0.3);

  if (style === 'animated' || style === 'cartoon') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, style === 'animated' ? '#42A5F5' : '#80DEEA');
    sky.addColorStop(0.62, style === 'animated' ? '#B3E5FC' : '#E0F7FA');
    sky.addColorStop(0.62, '#66BB6A');
    sky.addColorStop(1, '#388E3C');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath(); ctx.arc(W * 0.82, H * 0.16, H * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFCC02'; ctx.lineWidth = 2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      ctx.beginPath();
      ctx.moveTo(W*0.82 + Math.cos(a)*H*0.14, H*0.16 + Math.sin(a)*H*0.14);
      ctx.lineTo(W*0.82 + Math.cos(a)*H*0.19, H*0.16 + Math.sin(a)*H*0.19);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    [[W*0.22, H*0.14, H*0.08], [W*0.28, H*0.10, H*0.07], [W*0.15, H*0.12, H*0.06]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = '#000'; ctx.lineWidth = style === 'animated' ? 3 : 2;
    ctx.strokeRect(2, 2, W - 4, H - 4);
    const shown = cast.slice(0, 4);
    shown.forEach((ch, i) => {
      const x = charX(i, shown.length), y = H * 0.64;
      ctx.fillStyle = ch.color;
      ctx.beginPath(); ctx.arc(x, y, H * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
      drawEmoji(ch.emoji, x, y, H * 0.18);
    });

  } else if (style === 'cgi') {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#06001a'); bg.addColorStop(1, '#001030');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * W, y = Math.random() * H * 0.6, a = Math.random();
      ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`;
      ctx.fillRect(x, y, a > 0.95 ? 2 : 1, a > 0.95 ? 2 : 1);
    }
    ctx.strokeStyle = 'rgba(80,40,200,0.22)'; ctx.lineWidth = 0.5;
    const vp = { x: W / 2, y: H * 0.55 };
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath(); ctx.moveTo((W / 12) * i, H); ctx.lineTo(vp.x, vp.y); ctx.stroke();
    }
    for (let j = 0; j <= 5; j++) {
      const t = j / 5;
      ctx.beginPath();
      ctx.moveTo(0, vp.y + (H - vp.y) * t); ctx.lineTo(W, vp.y + (H - vp.y) * t);
      ctx.stroke();
    }
    const shown = cast.slice(0, 4);
    shown.forEach((ch, i) => {
      const x = charX(i, shown.length), y = H * 0.58;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, H * 0.18);
      glow.addColorStop(0, ch.color + 'cc'); glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.fillRect(x - H*0.18, y - H*0.18, H*0.36, H*0.36);
      drawEmoji(ch.emoji, x, y, H * 0.25);
    });

  } else if (style === 'live_action') {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#100800'); bg.addColorStop(0.5, '#1a1008'); bg.addColorStop(1, '#00080a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const shaft = ctx.createLinearGradient(W * 0.25, 0, W * 0.75, H);
    shaft.addColorStop(0, 'rgba(255,160,40,0.10)'); shaft.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.fillStyle = shaft; ctx.fillRect(0, 0, W, H);
    const gd = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < gd.data.length; i += 16) {
      const n = (Math.random() - 0.5) * 25;
      gd.data[i] = Math.max(0, Math.min(255, gd.data[i] + n));
      gd.data[i+3] = 18;
    }
    ctx.putImageData(gd, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H * 0.13); ctx.fillRect(0, H * 0.87, W, H * 0.13);
    const shown = cast.slice(0, 3);
    shown.forEach((ch, i) => {
      const x = charX(i, shown.length), hy = H * 0.56;
      const glow = ctx.createRadialGradient(x, hy + H*0.1, 0, x, hy, H*0.35);
      glow.addColorStop(0, ch.color + '44'); glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.beginPath(); ctx.arc(x, hy, H * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - H*0.05, hy + H*0.07, H * 0.1, H * 0.24);
    });

  } else if (style === 'whiteboard') {
    ctx.fillStyle = '#FAFAFA'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 0.5;
    for (let y = H * 0.06; y < H; y += H * 0.09) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]); ctx.strokeRect(8, 8, W - 16, H - 16); ctx.setLineDash([]);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W * 0.75, H * 0.5, H * 0.23, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const y = H * (0.22 + i * 0.13);
      ctx.beginPath(); ctx.moveTo(W * 0.07, y); ctx.lineTo(W * (0.3 + Math.random() * 0.2), y); ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(W * 0.47, H * 0.5); ctx.lineTo(W * 0.51, H * 0.5);
    ctx.moveTo(W * 0.49, H * 0.46); ctx.lineTo(W * 0.51, H * 0.5); ctx.lineTo(W * 0.49, H * 0.54);
    ctx.stroke();
    const shown = cast.slice(0, 3);
    shown.forEach((ch, i) => {
      const x = W * (0.14 + i * 0.13), y = H * 0.8;
      ctx.strokeStyle = ch.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - H*0.16, H*0.04, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - H*0.12); ctx.lineTo(x, y - H*0.01); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - H*0.05, y - H*0.09); ctx.lineTo(x + H*0.05, y - H*0.09); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - H*0.01); ctx.lineTo(x - H*0.04, y + H*0.09); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - H*0.01); ctx.lineTo(x + H*0.04, y + H*0.09); ctx.stroke();
    });

  } else if (style === 'manga') {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for (let x = 0; x < W; x += 7) for (let y = 0; y < H; y += 7) {
      ctx.beginPath(); ctx.arc(x + 3, y + 3, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.8;
    const fc = { x: W * 0.32, y: H * 0.44 };
    for (let a = 0; a < Math.PI * 2; a += 0.045) {
      ctx.beginPath();
      ctx.moveTo(fc.x + Math.cos(a) * 4, fc.y + Math.sin(a) * 4);
      ctx.lineTo(fc.x + Math.cos(a) * W, fc.y + Math.sin(a) * H);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(W * 0.04, H * 0.06, W * 0.58, H * 0.78);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.04, H * 0.06, W * 0.58, H * 0.78);
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.65, H * 0.06, W * 0.3, H * 0.38);
    ctx.strokeRect(W * 0.65, H * 0.48, W * 0.3, H * 0.36);
    ctx.lineWidth = 3; ctx.strokeRect(2, 2, W - 4, H - 4);
    if (cast[0]) {
      drawEmoji(cast[0].emoji, W * 0.31, H * 0.47, H * 0.42);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
      for (let a = 0; a < Math.PI * 2; a += 0.28) {
        ctx.beginPath();
        ctx.moveTo(W*0.31 + Math.cos(a)*H*0.24, H*0.47 + Math.sin(a)*H*0.24);
        ctx.lineTo(W*0.31 + Math.cos(a)*H*0.32, H*0.47 + Math.sin(a)*H*0.32);
        ctx.stroke();
      }
    }
    cast.slice(1, 3).forEach((ch, i) => drawEmoji(ch.emoji, W * 0.8, H * (0.27 + i * 0.44), H * 0.22));

  } else if (style === 'cinematic') {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#03060a'); bg.addColorStop(0.5, '#071825'); bg.addColorStop(1, '#000');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const haze = ctx.createRadialGradient(W*0.5, H*0.65, 0, W*0.5, H*0.65, W*0.55);
    haze.addColorStop(0, 'rgba(30,70,120,0.28)'); haze.addColorStop(1, 'transparent');
    ctx.fillStyle = haze; ctx.fillRect(0, 0, W, H);
    const flare = ctx.createLinearGradient(0, H * 0.32, W, H * 0.32);
    flare.addColorStop(0, 'transparent'); flare.addColorStop(0.45, 'rgba(120,180,255,0.07)');
    flare.addColorStop(0.5, 'rgba(180,220,255,0.14)');
    flare.addColorStop(0.55, 'rgba(120,180,255,0.07)'); flare.addColorStop(1, 'transparent');
    ctx.fillStyle = flare; ctx.fillRect(0, H * 0.30, W, H * 0.05);
    const shown = cast.slice(0, 3);
    shown.forEach((ch, i) => {
      const x = charX(i, shown.length), y = H * 0.75;
      const cg = ctx.createRadialGradient(x, y, 0, x, y, H * 0.32);
      cg.addColorStop(0, ch.color + '50'); cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      drawEmoji(ch.emoji, x, y, H * 0.28);
    });
    const lb = H * 0.14;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb);

  } else if (style === 'watercolor') {
    ctx.fillStyle = '#fff9f0'; ctx.fillRect(0, 0, W, H);
    const washes = [
      { x: W*0.1, y: H*0.1, r: H*0.45, c: 'rgba(255,170,110,0.22)' },
      { x: W*0.85, y: H*0.25, r: H*0.4, c: 'rgba(110,180,255,0.18)' },
      { x: W*0.5,  y: H*0.75, r: H*0.35, c: 'rgba(160,255,180,0.18)' },
      { x: W*0.3,  y: H*0.55, r: H*0.28, c: 'rgba(255,140,200,0.14)' },
    ];
    washes.forEach(({ x, y, r, c }) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    ctx.strokeStyle = 'rgba(110,70,50,0.3)'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.roundRect(5, 5, W - 10, H - 10, 6); ctx.stroke();
    const shown = cast.slice(0, 4);
    shown.forEach((ch, i) => {
      const x = charX(i, shown.length), y = H * 0.62;
      const cg = ctx.createRadialGradient(x, y, 0, x, y, H * 0.16);
      cg.addColorStop(0, ch.color + '55'); cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      drawEmoji(ch.emoji, x, y, H * 0.26);
    });

  } else {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#eadcc8'); bg.addColorStop(1, '#c9a87c');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const gd = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < gd.data.length; i += 8) {
      const n = (Math.random() - 0.5) * 18;
      gd.data[i+3] = Math.max(0, Math.min(40, n + 20));
    }
    ctx.putImageData(gd, 0, 0);
    ctx.strokeStyle = '#7B5230'; ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]); ctx.strokeRect(7, 7, W - 14, H - 14); ctx.setLineDash([]);
    const shown = cast.slice(0, 3);
    shown.forEach((ch, i) => {
      const x = charX(i, shown.length), y = H * 0.59;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x - H*0.17, y - H*0.17, H*0.34, H*0.34);
      ctx.strokeStyle = '#6B3F1C'; ctx.lineWidth = 1;
      ctx.strokeRect(x - H*0.17, y - H*0.17, H*0.34, H*0.34);
      drawEmoji(ch.emoji, x, y, H * 0.26);
    });
  }

  // Overlay: scene label & title
  const dark = ['cgi', 'live_action', 'cinematic'].includes(style);
  const tc = dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)';
  const bc = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  if (sceneNum > 0) {
    ctx.fillStyle = bc;
    ctx.fillRect(6, H - 24, 72, 20);
    ctx.font = `bold ${Math.max(9, H * 0.076)}px sans-serif`;
    ctx.fillStyle = tc; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`Scene ${sceneNum}`, 10, H - 14);
  }
  if (sceneTitle) {
    const short = sceneTitle.length > 26 ? `${sceneTitle.slice(0, 24)}…` : sceneTitle;
    ctx.font = `${Math.max(8, H * 0.065)}px sans-serif`;
    ctx.fillStyle = tc; ctx.textAlign = 'right';
    ctx.fillText(short, W - 8, H - 14);
  }
}

// ── Audio waveform ────────────────────────────────────────────────────────────
function AudioWave({ active, color = 'secondary.main' }: { active: boolean; color?: string }) {
  const heights = [0.4, 0.65, 1, 0.65, 0.4];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', height: 18, width: 28 }}>
      {heights.map((h, i) => (
        <Box
          key={i}
          sx={{
            width: 3,
            height: active ? `${h * 100}%` : '25%',
            bgcolor: color,
            borderRadius: 0.5,
            transition: 'height 0.1s ease',
            '@keyframes wavebar': {
              '0%, 100%': { transform: 'scaleY(0.4)' },
              '50%':       { transform: 'scaleY(1)' },
            },
            animation: active ? `wavebar ${0.45 + i * 0.08}s ease-in-out infinite` : 'none',
            transformOrigin: 'center',
          }}
        />
      ))}
    </Box>
  );
}

// ── Custom character form ─────────────────────────────────────────────────────
function CustomCharForm({ onAdd }: { onAdd: (c: VideoCharacter) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<CharacterRole>('custom');
  const [personality, setPersonality] = useState('');
  const [colorIdx, setColorIdx] = useState(0);

  const handle = () => {
    if (!name.trim()) return;
    onAdd({
      id: Date.now().toString(),
      name: name.trim(),
      role,
      personality: personality || 'Unique and memorable',
      color: CHAR_COLORS[colorIdx],
      emoji: ROLE_EMOJIS[role],
    });
    setName(''); setPersonality('');
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end', mt: 1 }}>
      <TextField size="small" label="Name" value={name} onChange={e => setName(e.target.value)} sx={{ width: 130 }} />
      <FormControl size="small" sx={{ width: 130 }}>
        <InputLabel>Role</InputLabel>
        <Select value={role} label="Role" onChange={e => setRole(e.target.value as CharacterRole)}>
          {(['hero','mentor','sidekick','explorer','scientist','artist','villain','narrator','custom'] as CharacterRole[]).map(r => (
            <MenuItem key={r} value={r}>{ROLE_EMOJIS[r]} {r.charAt(0).toUpperCase()+r.slice(1)}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField size="small" label="Personality" value={personality} onChange={e => setPersonality(e.target.value)} sx={{ flex: 1, minWidth: 140 }} placeholder="e.g. brave, witty…" />
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {CHAR_COLORS.map((c, i) => (
          <Box key={c} onClick={() => setColorIdx(i)} sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: colorIdx === i ? '2px solid #000' : '2px solid transparent' }} />
        ))}
      </Box>
      <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handle} disabled={!name.trim()}>Add</Button>
    </Box>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────
const STEPS = ['Concept', 'Cast', 'Story', 'Preview'];

export default function VideoCreatorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addAsset, assets } = useMediaStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Concept
  const [style,    setStyle]    = useState<ProductionStyleValue>('animated');
  const [genre,    setGenre]    = useState('adventure');
  const [duration, setDuration] = useState(5);

  // Prompt (top-level quick input)
  const [promptText,    setPromptText]    = useState('');
  const [promptApplied, setPromptApplied] = useState(false);
  const [showAudioOpts, setShowAudioOpts] = useState(false);

  // Cast
  const [cast, setCast] = useState<VideoCharacter[]>([CHARACTER_PRESETS[0], CHARACTER_PRESETS[1]]);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Story
  const [premise,        setPremise]        = useState('');
  const [story,          setStory]          = useState<VideoStory | null>(null);
  const [generating,     setGenerating]     = useState(false);
  const [activeScene,    setActiveScene]    = useState(0);
  const [showFullScript, setShowFullScript] = useState(false);

  // Audio
  const utteranceRef   = useRef<SpeechSynthesisUtterance | null>(null);
  const [speaking,      setSpeaking]      = useState(false);
  const [speakingIdx,   setSpeakingIdx]   = useState<number | null>(null); // null = full script
  const [voices,        setVoices]        = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIdx,      setVoiceIdx]      = useState(0);
  const [speechRate,    setSpeechRate]    = useState(0.92);

  // Stepper
  const [step, setStep]       = useState(0);
  const [creating, setCreating] = useState(false);

  const currentStyle = PRODUCTION_STYLES.find(s => s.value === style)!;
  const imageAssets  = assets.filter(a => a.mimeType.startsWith('image/') && a.url);

  // ── Load speech voices ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      if (v.length) setVoices(v);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);

  // ── Canvas re-render ────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = story?.scenes[activeScene];
    renderSceneCanvas(canvas, style, cast, scene?.title ?? currentStyle.label, scene ? scene.sceneNumber : 0);
  }, [style, cast, story, activeScene, currentStyle.label]);

  useEffect(() => { if (open) redraw(); }, [open, redraw]);

  // ── Speech functions ────────────────────────────────────────────────────────
  const handleSpeak = useCallback((text: string, idx: number | null) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = speechRate;
    u.pitch = 1.0;
    if (voices[voiceIdx]) u.voice = voices[voiceIdx];
    u.onstart = () => { setSpeaking(true);  setSpeakingIdx(idx); };
    u.onend   = () => { setSpeaking(false); setSpeakingIdx(null); };
    u.onerror = () => { setSpeaking(false); setSpeakingIdx(null); };
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }, [speechRate, voices, voiceIdx]);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeakingIdx(null);
  }, []);

  // ── Prompt auto-configure ───────────────────────────────────────────────────
  const handleApplyPrompt = () => {
    if (!promptText.trim()) return;
    const parsed = parseVideoPrompt(promptText);
    setGenre(parsed.genre);
    setStyle(parsed.style);
    setPremise(parsed.premise);
    setPromptApplied(true);
  };

  // ── Story generation ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const effectivePremise = premise.trim() || promptText.trim();
    if (!effectivePremise || cast.length === 0) return;
    setGenerating(true);
    setStory(null);
    try {
      const result = await generateVideoStory({ premise: effectivePremise, genre, cast, productionStyle: style, durationMin: duration });
      setStory(result);
      setActiveScene(0);
    } finally {
      setGenerating(false);
    }
  };

  // ── Add to library ──────────────────────────────────────────────────────────
  const handleAddToLibrary = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCreating(true);
    canvas.toBlob(blob => {
      if (!blob) { setCreating(false); return; }
      const thumbUrl = URL.createObjectURL(blob);
      addAsset({
        filename: `video-${genre}-${style}-${Date.now()}.mp4`,
        mimeType: 'video/generated',
        size: 0,
        url: thumbUrl,
        altText: story?.title ?? premise ?? `${currentStyle.label} video`,
        caption: story ? JSON.stringify({ story: story.narrationScript, logline: story.logline }) : premise,
        usageCount: 0,
        uploadedBy: 'Studio',
      });
      setCreating(false);
      handleClose();
    }, 'image/jpeg', 0.93);
  };

  const handleClose = () => {
    handleStop();
    setStep(0); setStory(null); setPremise(''); setActiveScene(0); setPromptText(''); setPromptApplied(false);
    setCast([CHARACTER_PRESETS[0], CHARACTER_PRESETS[1]]);
    setStyle('animated'); setGenre('adventure'); setDuration(5);
    onClose();
  };

  // ── Cast helpers ────────────────────────────────────────────────────────────
  const toggleCast = (preset: VideoCharacter) => {
    setCast(prev => prev.some(c => c.id === preset.id) ? prev.filter(c => c.id !== preset.id) : [...prev, preset]);
  };

  // ── Audio options panel ─────────────────────────────────────────────────────
  const audioOptionsPanel = (
    <Collapse in={showAudioOpts}>
      <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'grey.50' }}>
        <Typography variant="caption" fontWeight={700} display="block" gutterBottom>Audio Settings</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {voices.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Voice</InputLabel>
              <Select value={voiceIdx} label="Voice" onChange={e => setVoiceIdx(Number(e.target.value))}>
                {voices.map((v, i) => (
                  <MenuItem key={i} value={i}>{v.name} ({v.lang})</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Box sx={{ flex: 1, minWidth: 160 }}>
            <Typography variant="caption" color="text.secondary">Speed: {speechRate.toFixed(2)}x</Typography>
            <Slider
              size="small"
              value={speechRate}
              min={0.5} max={2} step={0.05}
              onChange={(_, v) => setSpeechRate(v as number)}
              valueLabelDisplay="off"
            />
          </Box>
        </Box>
        {voices.length === 0 && (
          <Typography variant="caption" color="text.disabled">No English voices found — browser TTS will use system default.</Typography>
        )}
      </Paper>
    </Collapse>
  );

  // ── Step: Concept ──────────────────────────────────────────────────────────
  const stepConcept = (
    <Box>
      {/* Prompt field */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2.5, bgcolor: 'secondary.50', borderColor: 'secondary.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <BoltIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
          <Typography variant="body2" fontWeight={700} color="secondary.main">Quick Prompt</Typography>
          <Typography variant="caption" color="text.disabled">— describe your video, we auto-configure everything</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth size="small"
            placeholder='e.g. "A funny animated cartoon about a robot who wants to become a chef" or "Dark cinematic sci-fi thriller on Mars"'
            value={promptText}
            onChange={e => { setPromptText(e.target.value); setPromptApplied(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPrompt(); } }}
          />
          <Button
            variant="contained" color="secondary" sx={{ flexShrink: 0 }}
            startIcon={<BoltIcon />}
            onClick={handleApplyPrompt}
            disabled={!promptText.trim()}
          >
            Configure
          </Button>
        </Box>
        {promptApplied && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
            <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
            <Typography variant="caption" color="success.main">
              Auto-configured: {PRODUCTION_STYLES.find(s => s.value === style)?.label} · {GENRES.find(g => g.value === genre)?.label}. Proceed to Cast, then Story to generate.
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Style grid */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={700} gutterBottom>Visual Style</Typography>
          <Grid container spacing={1}>
            {PRODUCTION_STYLES.map(s => (
              <Grid item xs={6} sm={4} key={s.value}>
                <Paper
                  variant="outlined"
                  onClick={() => setStyle(s.value)}
                  sx={{
                    p: 1.25, cursor: 'pointer', textAlign: 'center', borderRadius: 2,
                    border: style === s.value ? '2px solid' : '1px solid',
                    borderColor: style === s.value ? 'primary.main' : 'divider',
                    bgcolor: style === s.value ? 'primary.50' : 'background.paper',
                    '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
                    transition: 'all 0.15s',
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: '1.4rem', lineHeight: 1.3 }}>{s.emoji}</Typography>
                  <Typography variant="caption" fontWeight={style === s.value ? 700 : 400} display="block">{s.label}</Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.58rem' }}>{s.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" fontWeight={700} gutterBottom>Genre</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {GENRES.map(g => (
              <Chip
                key={g.value}
                label={`${g.emoji} ${g.label}`}
                clickable size="small"
                variant={genre === g.value ? 'filled' : 'outlined'}
                color={genre === g.value ? 'secondary' : 'default'}
                onClick={() => setGenre(g.value)}
              />
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>Duration: {duration} min</Typography>
            <Box component="input" type="range" min={1} max={20} value={duration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1565C0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.disabled">1 min</Typography>
              <Typography variant="caption" color="text.disabled">20 min</Typography>
            </Box>
          </Box>
        </Box>

        {/* Live canvas preview */}
        <Box sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
          <Typography variant="body2" fontWeight={700} gutterBottom>Live Preview</Typography>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', bgcolor: '#111' }}>
            <canvas ref={canvasRef} width={260} height={146} style={{ width: '100%', display: 'block' }} />
          </Box>
          <Paper variant="outlined" sx={{ mt: 1.5, p: 1.25, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{currentStyle.emoji} {currentStyle.label}</Typography>
            <Typography variant="caption" color="text.disabled">{currentStyle.desc}</Typography>
            <Divider sx={{ my: 0.75 }} />
            <Typography variant="caption" color="text.secondary">{GENRES.find(g => g.value === genre)?.emoji} {GENRES.find(g => g.value === genre)?.label} · {duration} min</Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );

  // ── Step: Cast ─────────────────────────────────────────────────────────────
  const stepCast = (
    <Box>
      <Typography variant="body2" fontWeight={700} gutterBottom>Character Presets</Typography>
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {CHARACTER_PRESETS.map(preset => {
          const selected = cast.some(c => c.id === preset.id);
          return (
            <Grid item xs={6} sm={3} key={preset.id}>
              <Card
                variant={selected ? 'elevation' : 'outlined'}
                elevation={selected ? 3 : 0}
                onClick={() => toggleCast(preset)}
                sx={{
                  cursor: 'pointer', p: 1, textAlign: 'center',
                  border: selected ? '2px solid' : '1px solid',
                  borderColor: selected ? preset.color : 'divider',
                  bgcolor: selected ? preset.color + '12' : 'background.paper',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: preset.color, bgcolor: preset.color + '08' },
                }}
              >
                <Avatar sx={{ width: 40, height: 40, bgcolor: preset.color, fontSize: '1.4rem', mx: 'auto', mb: 0.5 }}>
                  {preset.emoji}
                </Avatar>
                <Typography variant="caption" fontWeight={selected ? 700 : 400} display="block" noWrap>{preset.name}</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>{preset.role}</Typography>
                {selected && <CheckCircleIcon sx={{ fontSize: 14, color: preset.color, mt: 0.25 }} />}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {imageAssets.length > 0 && (
        <>
          <Typography variant="body2" fontWeight={700} gutterBottom>From Your Media Library</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {imageAssets.slice(0, 8).map(asset => {
              const already = cast.some(c => c.imageUrl === asset.url);
              return (
                <Tooltip key={asset.id} title={already ? 'Already in cast' : `Add "${asset.altText}" as character`}>
                  <Box
                    onClick={() => {
                      if (already) return;
                      const ch: VideoCharacter = {
                        id: `lib-${asset.id}`, name: asset.altText.slice(0, 20),
                        role: 'custom', personality: 'From your media library',
                        color: CHAR_COLORS[cast.length % CHAR_COLORS.length],
                        emoji: '🖼️', imageUrl: asset.url,
                      };
                      setCast(prev => [...prev, ch]);
                    }}
                    sx={{
                      width: 56, height: 56, borderRadius: 1, overflow: 'hidden',
                      border: already ? '2px solid' : '1px solid',
                      borderColor: already ? 'success.main' : 'divider',
                      cursor: already ? 'default' : 'pointer',
                      opacity: already ? 0.6 : 1,
                      '&:hover': !already ? { borderColor: 'primary.main' } : {},
                    }}
                  >
                    <Box component="img" src={asset.url} alt={asset.altText} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="body2" fontWeight={700}>Custom Character</Typography>
        <Chip label={showCustomForm ? 'Hide' : 'Create'} size="small" clickable icon={<AddIcon sx={{ fontSize: '0.8rem !important' }} />}
          onClick={() => setShowCustomForm(v => !v)} variant={showCustomForm ? 'filled' : 'outlined'} color="primary" />
      </Box>
      <Collapse in={showCustomForm}>
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
          <CustomCharForm onAdd={ch => { setCast(prev => [...prev, ch]); setShowCustomForm(false); }} />
        </Paper>
      </Collapse>

      {cast.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={700} gutterBottom>Your Cast ({cast.length})</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {cast.map(ch => (
              <Chip
                key={ch.id}
                avatar={<Avatar sx={{ bgcolor: ch.color, fontSize: '0.9rem' }}>{ch.emoji}</Avatar>}
                label={`${ch.name} · ${ch.role}`}
                onDelete={() => setCast(prev => prev.filter(c => c.id !== ch.id))}
                variant="outlined"
                sx={{ borderColor: ch.color }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  // ── Step: Story ────────────────────────────────────────────────────────────
  const stepStory = (
    <Box>
      <Typography variant="body2" fontWeight={700} gutterBottom>Story Premise</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
        <TextField
          fullWidth multiline rows={2} size="small"
          placeholder={promptApplied && promptText ? 'Prompt already applied — click Generate Story below, or refine here.' : 'Describe your story in 1-2 sentences…'}
          value={premise || promptText}
          onChange={e => setPremise(e.target.value)}
        />
        <Button
          variant="contained" color="secondary"
          sx={{ flexShrink: 0, alignSelf: 'stretch' }}
          startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={handleGenerate}
          disabled={(!premise.trim() && !promptText.trim()) || cast.length === 0 || generating}
        >
          {generating ? 'Generating…' : 'Generate Story'}
        </Button>
      </Box>

      {cast.length === 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>Add at least one character in the Cast step before generating.</Alert>
      )}

      {story && (
        <Box>
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'secondary.50', borderColor: 'secondary.200' }}>
            <Typography variant="caption" fontWeight={700} color="secondary.main" display="block">LOGLINE</Typography>
            <Typography variant="body2" fontStyle="italic">"{story.logline}"</Typography>
          </Paper>

          <Typography variant="body2" fontWeight={700} gutterBottom>
            {story.scenes.length} Scenes · ~{Math.round(story.totalDuration / 60)} min total
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {story.scenes.map((scene, i) => {
              const isActive = activeScene === i;
              const isSpeakingThis = speaking && speakingIdx === i;
              return (
                <Card
                  key={i}
                  variant={isActive ? 'elevation' : 'outlined'}
                  elevation={isActive ? 2 : 0}
                  onClick={() => setActiveScene(i)}
                  sx={{
                    cursor: 'pointer',
                    border: isActive ? '2px solid' : '1px solid',
                    borderColor: isActive ? 'secondary.main' : 'divider',
                    transition: 'all 0.12s',
                  }}
                >
                  <CardContent sx={{ py: '10px !important', px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {scene.sceneNumber}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600}>{scene.title}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{scene.setting}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {scene.characters.map(n => {
                            const ch = cast.find(c => c.name === n);
                            return (
                              <Chip key={n} label={n} size="small"
                                avatar={ch ? <Avatar sx={{ bgcolor: ch.color, fontSize: '0.65rem' }}>{ch.emoji}</Avatar> : undefined}
                                sx={{ height: 18, fontSize: '0.6rem' }} />
                            );
                          })}
                          <Chip label={`~${scene.duration}s`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                        </Box>
                      </Box>
                      {/* Play/stop button */}
                      <Tooltip title={isSpeakingThis ? 'Stop narration' : 'Play scene narration'}>
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); isSpeakingThis ? handleStop() : handleSpeak(scene.narration, i); }}
                          sx={{ color: isSpeakingThis ? 'error.main' : 'secondary.main', flexShrink: 0 }}
                        >
                          {isSpeakingThis ? <StopIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                      {isSpeakingThis && <AudioWave active={true} />}
                    </Box>
                    {isActive && (
                      <Box sx={{ mt: 1, pl: 4.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', lineHeight: 1.5 }}>
                          <MicIcon sx={{ fontSize: 11, mr: 0.5, verticalAlign: 'middle' }} />
                          "{scene.narration}"
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', display: 'block', mt: 0.5 }}>
                          Visual: {scene.visualNote}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* Full narration script */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<MenuBookIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={showFullScript ? 'Hide narration script' : 'View full narration script'}
                size="small" clickable variant={showFullScript ? 'filled' : 'outlined'} color="primary"
                onClick={() => setShowFullScript(v => !v)}
              />
              {showFullScript && (
                <Tooltip title={speaking && speakingIdx === null ? 'Stop' : 'Read full script aloud'}>
                  <IconButton
                    size="small"
                    onClick={() => (speaking && speakingIdx === null) ? handleStop() : handleSpeak(story.narrationScript, null)}
                    sx={{ color: (speaking && speakingIdx === null) ? 'error.main' : 'primary.main' }}
                  >
                    {(speaking && speakingIdx === null)
                      ? <StopIcon sx={{ fontSize: 16 }} />
                      : <VolumeUpIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              )}
              {speaking && speakingIdx === null && <AudioWave active={true} color="primary.main" />}
            </Box>
            <Collapse in={showFullScript}>
              <Paper variant="outlined" sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', maxHeight: 240, overflow: 'auto' }}>
                <Typography component="pre" variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.7rem', color: 'text.secondary' }}>
                  {story.narrationScript}
                </Typography>
              </Paper>
            </Collapse>
          </Box>
        </Box>
      )}
    </Box>
  );

  // ── Step: Preview ──────────────────────────────────────────────────────────
  const activeSceneData = story?.scenes[activeScene];
  const stepPreview = (
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Main canvas */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={700} gutterBottom>Storyboard Preview</Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', bgcolor: '#111' }}>
          <canvas ref={canvasRef} width={520} height={292} style={{ width: '100%', display: 'block' }} />
        </Box>

        {/* Scene navigation */}
        {story && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <IconButton size="small" onClick={() => setActiveScene(s => Math.max(0, s - 1))} disabled={activeScene === 0}>
              <NavigateBeforeIcon />
            </IconButton>
            {story.scenes.map((sc, i) => (
              <Tooltip key={i} title={sc.title}>
                <Box
                  onClick={() => setActiveScene(i)}
                  sx={{
                    width: 36, height: 22, borderRadius: 0.5, bgcolor: activeScene === i ? 'secondary.main' : 'grey.300',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    '&:hover': { bgcolor: activeScene === i ? 'secondary.dark' : 'grey.400' },
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: activeScene === i ? 'white' : 'text.secondary', fontWeight: 700 }}>
                    {i + 1}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
            <IconButton size="small" onClick={() => setActiveScene(s => Math.min(story.scenes.length - 1, s + 1))} disabled={activeScene === story.scenes.length - 1}>
              <NavigateNextIcon />
            </IconButton>
          </Box>
        )}

        {/* Audio panel for preview */}
        {activeSceneData && (
          <Paper variant="outlined" sx={{ mt: 1.5, p: 1.25, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <MicIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary">Scene {activeSceneData.sceneNumber} Narration</Typography>
              <Box sx={{ flex: 1 }} />
              <Tooltip title={speaking && speakingIdx === activeScene ? 'Stop' : 'Play narration'}>
                <IconButton
                  size="small"
                  onClick={() => (speaking && speakingIdx === activeScene) ? handleStop() : handleSpeak(activeSceneData.narration, activeScene)}
                  sx={{ color: (speaking && speakingIdx === activeScene) ? 'error.main' : 'secondary.main' }}
                >
                  {(speaking && speakingIdx === activeScene)
                    ? <StopIcon sx={{ fontSize: 18 }} />
                    : <PlayArrowIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
              {speaking && speakingIdx === activeScene && <AudioWave active={true} />}
              <Tooltip title="Audio settings">
                <IconButton size="small" onClick={() => setShowAudioOpts(v => !v)} color={showAudioOpts ? 'secondary' : 'default'}>
                  <TuneIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.5, display: 'block' }}>
              "{activeSceneData.narration}"
            </Typography>
            {audioOptionsPanel}
          </Paper>
        )}
      </Box>

      {/* Summary card */}
      <Box sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0 }}>
        <Typography variant="body2" fontWeight={700} gutterBottom>Production Summary</Typography>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="caption" fontWeight={700} display="block" gutterBottom>{currentStyle.emoji} {currentStyle.label}</Typography>
          {GENRES.find(g => g.value === genre) && (
            <Typography variant="caption" color="text.secondary" display="block">
              {GENRES.find(g => g.value === genre)?.emoji} {GENRES.find(g => g.value === genre)?.label}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block">{duration} min · {story?.scenes.length ?? 0} scenes</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" fontWeight={700} display="block" gutterBottom>Cast</Typography>
          {cast.map(ch => (
            <Box key={ch.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <Avatar sx={{ width: 20, height: 20, bgcolor: ch.color, fontSize: '0.65rem' }}>{ch.emoji}</Avatar>
              <Typography variant="caption">{ch.name}</Typography>
              <Typography variant="caption" color="text.disabled">· {ch.role}</Typography>
            </Box>
          ))}
          {story && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" fontWeight={700} display="block" gutterBottom>Story</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', lineHeight: 1.4 }}>
                "{story.logline}"
              </Typography>
            </>
          )}
        </Paper>
        {!story && (
          <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
            Complete the Story step to add narration and scenes to your video.
          </Alert>
        )}
      </Box>
    </Box>
  );

  const stepsContent = [stepConcept, stepCast, stepStory, stepPreview];
  const canNext = step < 3 && (
    step === 0 ? true :
    step === 1 ? cast.length > 0 :
    true
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { height: '90vh', display: 'flex', flexDirection: 'column' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <MovieIcon color="secondary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>Video Creator</Typography>
          <Typography variant="caption" color="text.secondary">Animated · Cartoon · Cinematic · Manga · and more</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>
      <Divider />

      <DialogContent sx={{ flex: 1, overflow: 'auto', pt: 2 }}>
        {stepsContent[step]}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button startIcon={<NavigateBeforeIcon />} onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        {step < 3 ? (
          <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={() => setStep(s => s + 1)} disabled={!canNext}>
            Next
          </Button>
        ) : (
          <Button
            variant="contained" color="secondary"
            startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <MovieIcon />}
            onClick={handleAddToLibrary} disabled={creating}
          >
            {creating ? 'Adding…' : 'Add to Library'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
