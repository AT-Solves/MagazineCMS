import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  Box, IconButton, Tooltip, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, Typography,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import MediaPickerDialog from './MediaPickerDialog';

export interface RichTextEditorHandle {
  insertHTML: (html: string) => void;
}

interface ToolbarBtn {
  label: string;
  icon?: React.ReactNode;
  text?: string;
  action: () => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
  showWordCount?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  className?: string;
}

const TOOLBAR_BTN_SX = { borderRadius: 1, p: 0.5 };

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({
  value,
  onChange,
  placeholder = 'Start writing your content here...',
  readOnly = false,
  minHeight = 300,
  showWordCount = false,
  showCharCount = false,
  maxLength,
  className,
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isComposing = useRef(false);

  useImperativeHandle(ref, () => ({
    insertHTML: (html: string) => exec('insertHTML', html),
  }));

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const savedRange = useRef<Range | null>(null);

  const rawText = value.replace(/<[^>]*>/g, '');
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = rawText.length;

  // Sync external value → DOM only when editor is not focused
  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    if (el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    onChangeRef.current(html === '<br>' ? '' : html);
  }, []);

  // execCommand wrapper — synchronous emit so tests can observe the call
  const exec = useCallback((cmd: string, val?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, val);
    emitChange();
  }, [emitChange]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const el = editorRef.current;
    if (!el) return;
    if (maxLength && (el.innerText || '').length > maxLength) return;
    emitChange();
  }, [maxLength, emitChange]);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const openLinkDialog = () => {
    saveRange();
    const sel = window.getSelection();
    setLinkText(sel?.toString() ?? '');
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const insertLink = () => {
    restoreRange();
    if (linkUrl) {
      if (linkText && window.getSelection()?.toString() === '') {
        exec('insertHTML', `<a href="${linkUrl}" target="_blank" rel="noopener">${linkText || linkUrl}</a>`);
      } else {
        exec('createLink', linkUrl);
      }
    }
    setLinkDialogOpen(false);
  };

  // Native paste: strip HTML, insert plain text
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') ?? '';
      document.execCommand('insertText', false, text);
      emitChange();
    };
    // Handle drag-drop of layout blocks / media from the blocks panel
    const onDrop = (e: DragEvent) => {
      const html = e.dataTransfer?.getData('text/html');
      if (html) {
        e.preventDefault();
        // Place caret at drop point then insert
        const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
        if (range) {
          const sel = window.getSelection();
          if (sel) { sel.removeAllRanges(); sel.addRange(range); }
        }
        document.execCommand('insertHTML', false, html);
        emitChange();
      }
    };
    el.addEventListener('paste', onPaste);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('paste', onPaste);
      el.removeEventListener('drop', onDrop);
    };
  }, [emitChange]);

  const toolbarButtons: Array<ToolbarBtn | null> = [
    { label: 'Bold',             icon: <FormatBoldIcon fontSize="small" />,         action: () => exec('bold') },
    { label: 'Italic',           icon: <FormatItalicIcon fontSize="small" />,       action: () => exec('italic') },
    { label: 'Underline',        icon: <FormatUnderlinedIcon fontSize="small" />,   action: () => exec('underline') },
    null,
    { label: 'Heading 2',        text: 'H2',                                        action: () => exec('formatBlock', '<h2>') },
    { label: 'Heading 3',        text: 'H3',                                        action: () => exec('formatBlock', '<h3>') },
    { label: 'Heading 4',        text: 'H4',                                        action: () => exec('formatBlock', '<h4>') },
    null,
    { label: 'Bullet List',      icon: <FormatListBulletedIcon fontSize="small" />, action: () => exec('insertUnorderedList') },
    { label: 'Numbered List',    icon: <FormatListNumberedIcon fontSize="small" />, action: () => exec('insertOrderedList') },
    { label: 'Block Quote',      icon: <FormatQuoteIcon fontSize="small" />,        action: () => exec('formatBlock', '<blockquote>') },
    null,
    { label: 'Insert Link',      icon: <LinkIcon fontSize="small" />,               action: openLinkDialog },
    { label: 'Insert Image',     icon: <ImageIcon fontSize="small" />,              action: () => { saveRange(); setMediaPickerOpen(true); } },
    null,
    { label: 'Undo',             icon: <UndoIcon fontSize="small" />,               action: () => exec('undo') },
    { label: 'Redo',             icon: <RedoIcon fontSize="small" />,               action: () => exec('redo') },
    { label: 'Clear Formatting', icon: <FormatClearIcon fontSize="small" />,        action: () => exec('removeFormat') },
  ];

  return (
    <Box className={className} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      {!readOnly && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.25, px: 1, py: 0.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          {toolbarButtons.map((btn, i) =>
            btn === null ? (
              <Divider key={i} orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            ) : (
              <Tooltip key={btn.label} title={btn.label}>
                <IconButton
                  size="small"
                  aria-label={btn.label}
                  onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
                  sx={TOOLBAR_BTN_SX}
                >
                  {btn.icon ?? (
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem', lineHeight: 1, px: 0.25 }}>
                      {btn.text}
                    </Typography>
                  )}
                </IconButton>
              </Tooltip>
            ),
          )}
        </Box>
      )}

      {/* Editable area */}
      <Box
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        data-placeholder={placeholder}
        sx={{
          minHeight,
          p: 2,
          outline: 'none',
          fontSize: '1rem',
          lineHeight: 1.7,
          color: 'text.primary',
          '&:empty:before': { content: 'attr(data-placeholder)', color: 'text.disabled', pointerEvents: 'none' },
          '& blockquote': { borderLeft: '4px solid', borderColor: 'primary.main', ml: 0, pl: 2, fontStyle: 'italic', color: 'text.secondary' },
          '& a': { color: 'primary.main' },
          '& img': { maxWidth: '100%', borderRadius: 1 },
          '& ul, & ol': { pl: 3 },
        }}
      />

      {/* Footer counts */}
      {(showWordCount || showCharCount) && (
        <Box sx={{ px: 2, py: 0.75, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 3 }}>
          {showWordCount && (
            <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {wordCount} words
            </Box>
          )}
          {showCharCount && (
            <Box component="span" sx={{ fontSize: '0.75rem', color: maxLength && charCount > maxLength * 0.9 ? 'warning.main' : 'text.secondary' }}>
              {charCount}{maxLength ? ` / ${maxLength} characters` : ' characters'}
            </Box>
          )}
        </Box>
      )}

      {/* Media picker dialog */}
      <MediaPickerDialog
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onInsert={(html) => { restoreRange(); exec('insertHTML', html); }}
      />

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Insert Link</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="URL" placeholder="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} size="small" autoFocus />
          <TextField label="Link Text (optional)" value={linkText} onChange={(e) => setLinkText(e.target.value)} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={insertLink} disabled={!linkUrl}>Insert</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };
export default RichTextEditor;
