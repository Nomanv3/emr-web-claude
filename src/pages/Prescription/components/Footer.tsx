import { useState, useCallback } from 'react';
import {
  Box, Button, MenuItem, TextField, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PrintIcon from '@mui/icons-material/Print';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import type { PrescriptionLanguage } from '@/types';
import { usePrescription } from '../context/PrescriptionContext';
import PrintSettingsPanel from './PrintSettingsPanel';

const LANGUAGES: { value: PrescriptionLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
];

interface FooterProps {
  onPreview: () => void;
  onSave: () => void;
  onConfigurePad: () => void;
  onClearAll: () => void;
  onFinish: () => void;
}

export default function Footer({
  onPreview, onSave, onConfigurePad, onClearAll, onFinish,
}: FooterProps) {
  const { language, setLanguage, isEditing, isSaving, copyToRxMode } = usePrescription();
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);

  const handleClearConfirm = useCallback(() => {
    onClearAll();
    setClearConfirmOpen(false);
  }, [onClearAll]);

  const clearMessage = isEditing
    ? 'This will discard all changes and reload original prescription data.'
    : copyToRxMode
    ? 'This will clear all data from the copied prescription.'
    : 'This will remove all entries from every section. This action cannot be undone.';

  const whiteBtnSx = {
    color: '#fff',
    borderColor: 'rgba(255,255,255,0.5)',
    '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
  };

  return (
    <>
      <Box
        sx={{
          flexShrink: 0,
          zIndex: 10,
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.15)',
          flexWrap: 'wrap',
          minHeight: 64,
        }}
      >
        {/* Language selector */}
        <TextField
          select
          value={language}
          onChange={e => setLanguage(e.target.value as PrescriptionLanguage)}
          size="small"
          sx={{
            width: 120,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
              '&:hover fieldset': { borderColor: '#fff' },
              '&.Mui-focused fieldset': { borderColor: '#fff' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
            '& .MuiSelect-icon': { color: '#fff' },
          }}
          label="Language"
        >
          {LANGUAGES.map(l => (
            <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
          ))}
        </TextField>

        {/* Clear All */}
        <Tooltip title="Clear all prescription data">
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setClearConfirmOpen(true)}
            sx={whiteBtnSx}
          >
            Clear All
          </Button>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        {/* Print Settings */}
        <Tooltip title="Configure Print Settings">
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => setPrintSettingsOpen(true)}
            sx={whiteBtnSx}
          >
            Print
          </Button>
        </Tooltip>

        {/* Configure Pad */}
        <Tooltip title="Configure Prescription Pad">
          <Button
            variant="outlined"
            size="small"
            startIcon={<SettingsIcon />}
            onClick={onConfigurePad}
            sx={whiteBtnSx}
          >
            Configure
          </Button>
        </Tooltip>

        {/* Preview */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<PreviewIcon />}
          onClick={onPreview}
          sx={whiteBtnSx}
        >
          Preview
        </Button>

        {/* Save / Update */}
        <Button
          variant="contained"
          size="medium"
          startIcon={isSaving ? <CircularProgress size={18} sx={{ color: '#1565c0' }} /> : <SaveIcon />}
          onClick={onSave}
          disabled={isSaving}
          sx={{
            bgcolor: '#fff',
            color: '#1565c0',
            fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.5)', color: 'rgba(21,101,192,0.5)' },
          }}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Update Prescription' : 'Save Prescription'}
        </Button>

        {/* Finish Prescription */}
        <Tooltip title="Save prescription and generate PDF">
          <Button
            variant="contained"
            size="medium"
            startIcon={isSaving ? <CircularProgress size={18} /> : <DoneAllIcon />}
            onClick={onFinish}
            disabled={isSaving}
            sx={{
              bgcolor: '#2e7d32',
              color: '#fff',
              fontWeight: 700,
              '&:hover': { bgcolor: '#1b5e20' },
              '&.Mui-disabled': { bgcolor: 'rgba(46,125,50,0.4)' },
            }}
          >
            Finish Prescription
          </Button>
        </Tooltip>
      </Box>

      {/* Print Settings Panel */}
      <PrintSettingsPanel
        open={printSettingsOpen}
        onClose={() => setPrintSettingsOpen(false)}
      />

      {/* Clear All confirmation dialog */}
      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Clear All Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>{clearMessage}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleClearConfirm} variant="contained" color="error">Clear All</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
