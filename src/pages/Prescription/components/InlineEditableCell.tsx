import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, MenuItem, ClickAwayListener, Chip,
} from '@mui/material';

export type CellOption = { value: string; label: string; id?: string | number };

interface Props {
  value: string;
  display?: string;
  onChange: (value: string, option?: CellOption) => void;
  options?: CellOption[];
  type?: 'text' | 'select' | 'number';
  placeholder?: string;
  chip?: boolean;
}

const FIELD_SX = {
  width: '100%',
  m: 0,
  '& .MuiInputBase-root': { height: 30, fontSize: 13 },
  '& .MuiInputBase-input': { fontSize: 13, py: 0.25, px: 0.75 },
  '& .MuiSelect-select': { py: 0.25, px: 0.75 },
} as const;

const DISPLAY_SX = {
  cursor: 'pointer',
  width: '100%',
  minHeight: 30,
  display: 'flex',
  alignItems: 'center',
  borderRadius: 0.5,
  px: 0.75,
  boxSizing: 'border-box',
  '&:hover': { bgcolor: 'action.hover' },
} as const;

export default function InlineEditableCell({
  value, display, onChange, options, type = 'text', placeholder, chip,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = (val: string) => {
    const matched = options?.find((o) => o.value === val);
    onChange(val, matched);
  };

  if (editing && options) {
    return (
      <ClickAwayListener onClickAway={() => setEditing(false)}>
        <TextField
          select
          size="small"
          autoFocus
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
            setEditing(false);
          }}
          sx={FIELD_SX}
          SelectProps={{ defaultOpen: true }}
        >
          {options.map((o) => (
            <MenuItem key={o.id ?? o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      </ClickAwayListener>
    );
  }

  if (editing) {
    return (
      <ClickAwayListener
        onClickAway={() => {
          if (draft !== value) commit(draft);
          setEditing(false);
        }}
      >
        <TextField
          size="small"
          autoFocus
          type={type}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (draft !== value) commit(draft);
              setEditing(false);
            }
            if (e.key === 'Escape') { setDraft(value); setEditing(false); }
          }}
          sx={FIELD_SX}
        />
      </ClickAwayListener>
    );
  }

  const shown = display ?? value;
  return (
    <Box onClick={() => setEditing(true)} sx={DISPLAY_SX}>
      {chip && shown ? (
        <Chip label={shown} size="small" variant="outlined" sx={{ height: 22, fontSize: 12 }} />
      ) : (
        <Typography variant="body2" noWrap sx={{ fontSize: 13 }}>
          {shown || <span style={{ color: '#9ca3af' }}>—</span>}
        </Typography>
      )}
    </Box>
  );
}
