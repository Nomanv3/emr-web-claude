import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box, Typography, IconButton, TextField, Paper, List, ListItemButton,
  ListItemText, ClickAwayListener, CircularProgress, Button, InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const PAGE_SIZE = 6;

export type SearchOption = {
  label: string;
  secondary?: string;
  payload?: Record<string, unknown>;
};

interface Props {
  value: string;
  secondary?: string;
  onRename: (name: string) => void;
  onReplace?: (opt: SearchOption) => void;
  searchFn?: (query: string) => Promise<SearchOption[]>;
  placeholder?: string;
}

export default function InlineEditableName({
  value, secondary, onRename, onReplace, searchFn, placeholder = 'Search...',
}: Props) {
  const [mode, setMode] = useState<'view' | 'edit' | 'search'>('view');
  const [draft, setDraft] = useState(value);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (mode !== 'search' || !searchFn) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const out = await searchFn(query);
        setResults(out);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mode, searchFn]);

  const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);

  const handleSaveEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onRename(trimmed);
    setMode('view');
  };

  const handlePick = (opt: SearchOption) => {
    if (onReplace) onReplace(opt);
    else onRename(opt.label);
    setMode('view');
    setQuery('');
    setResults([]);
    setVisibleCount(PAGE_SIZE);
  };

  if (mode === 'edit') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, width: '100%' }}>
        <TextField
          size="small"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') { setDraft(value); setMode('view'); }
          }}
          sx={{
            flex: 1, minWidth: 0, m: 0,
            '& .MuiInputBase-root': { height: 30, fontSize: 13 },
            '& .MuiInputBase-input': { fontSize: 13, py: 0.25, px: 0.75 },
          }}
        />
        <IconButton size="small" color="primary" onClick={handleSaveEdit} sx={{ p: 0.25 }}>
          <CheckIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" onClick={() => { setDraft(value); setMode('view'); }} sx={{ p: 0.25 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    );
  }

  if (mode === 'search' && searchFn) {
    return (
      <ClickAwayListener onClickAway={() => { setMode('view'); setQuery(''); setVisibleCount(PAGE_SIZE); }}>
        <Box sx={{ position: 'relative', width: '100%' }}>
          <TextField
            size="small"
            autoFocus
            fullWidth
            placeholder={placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setMode('view'); }}
            sx={{
              m: 0,
              '& .MuiInputBase-root': { height: 30, fontSize: 13 },
              '& .MuiInputBase-input': { fontSize: 13, py: 0.25, px: 0.75 },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0.5 }}>
                    <SearchIcon sx={{ fontSize: 14 }} />
                  </InputAdornment>
                ),
                sx: { fontSize: 13 },
              },
            }}
          />
          {query.trim() && (
            <Paper
              elevation={8}
              sx={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                mt: 0.5, maxHeight: 320, overflow: 'auto',
                border: '1px solid', borderColor: 'divider',
              }}
            >
              {loading ? (
                <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={16} />
                </Box>
              ) : results.length === 0 ? (
                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    No matches. Press Enter to keep typed name.
                  </Typography>
                  <Button
                    fullWidth
                    size="small"
                    sx={{ mt: 0.5, fontSize: 11 }}
                    onClick={() => { onRename(query.trim()); setMode('view'); setQuery(''); }}
                    disabled={!query.trim()}
                  >
                    Use "{query.trim()}"
                  </Button>
                </Box>
              ) : (
                <>
                  <List dense disablePadding>
                    {visibleResults.map((opt, idx) => (
                      <ListItemButton
                        key={idx}
                        onClick={() => handlePick(opt)}
                        sx={{ py: 0.5 }}
                      >
                        <ListItemText
                          primary={opt.label}
                          secondary={opt.secondary}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                  {visibleCount < results.length && (
                    <Button
                      fullWidth
                      size="small"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      sx={{ fontSize: 11, py: 0.5 }}
                    >
                      Show More ({results.length - visibleCount} more)
                    </Button>
                  )}
                </>
              )}
            </Paper>
          )}
        </Box>
      </ClickAwayListener>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.25, width: '100%', minHeight: 30,
        '&:hover .edit-btn': { opacity: 1 },
      }}
    >
      <Box
        onClick={() => { if (searchFn) setMode('search'); }}
        sx={{
          flex: 1, minWidth: 0, px: 0.5, borderRadius: 0.5,
          cursor: searchFn ? 'pointer' : 'default',
          '&:hover': searchFn ? { bgcolor: 'action.hover' } : undefined,
        }}
      >
        <Typography variant="body2" fontWeight={500} noWrap sx={{ fontSize: 13 }}>
          {value || '—'}
        </Typography>
        {secondary && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>
            {secondary}
          </Typography>
        )}
      </Box>
      <IconButton
        className="edit-btn"
        size="small"
        onClick={(e) => { e.stopPropagation(); setMode('edit'); }}
        sx={{ opacity: 0, transition: 'opacity 0.15s', p: 0.25, flexShrink: 0 }}
      >
        <EditIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}
