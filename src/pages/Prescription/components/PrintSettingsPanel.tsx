import { useState, useEffect, useCallback } from 'react';
import {
  Paper, Box, Typography, IconButton, Switch, Divider, Button,
  alpha, Fade, Backdrop, Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { usePrescription } from '../context/PrescriptionContext';

// ── Default print settings (all enabled) ──────────────────────────
const DEFAULT_PRINT_SETTINGS: Record<string, boolean> = {
  // Clinical Sections
  vitals: true, patientMedicalHistory: true, symptoms: true, diagnosis: true,
  medication: true, labTests: true, labResults: true, followup: true,
  advices: true, examinationFindings: true, notes: true, referToDoctor: true,
  procedures: true, customSection: true, additionalNotes: true,
  // Display Toggles
  hidePropertyHeaders: false, hideHeaders: false,
  hidePropertyHeadersSymptoms: false, hidePropertyHeadersHistory: false,
  // Medication Options
  genericName: true, productType: true, hideBrandName: false,
  taperingDoseShowTitle: true, replaceFreqToDoseFreq: false,
  printDose: true, printFrequency: true, printDuration: true,
  printInstruction: true, printQuantity: true,
  genericNameInjections: true, hideBrandNameInjections: false,
  // Lab Options
  outOfRangeValuesOnly: false,
  // Medical History Subcategories
  existingConditions: true, familyHistory: true, lifestyleHabits: true,
  foodOtherAllergy: true, drugAllergy: true, pastSurgicalProcedures: true,
  currentMedications: true, travelHistory: true, otherMedicalHistory: true,
  // Patient Info
  nameAge: true, mobileNumber: true, gender: true, uhid: true,
  patientAddress: true, city: true, pincode: true, mailId: true,
  bloodGroup: true, alternativePhone: true, referredByDoctor: true,
  maritalStatus: true, patientsOccupation: true, notesForPatient: true,
  patientForm: true, guardianName: true,
};

// ── Category definitions ──────────────────────────────────────────
interface SettingItem { key: string; label: string }
interface Category { title: string; items: SettingItem[] }

const CATEGORIES: Category[] = [
  {
    title: 'Clinical Sections',
    items: [
      { key: 'vitals', label: 'Vitals' },
      { key: 'patientMedicalHistory', label: 'Medical History' },
      { key: 'symptoms', label: 'Symptoms' },
      { key: 'diagnosis', label: 'Diagnosis' },
      { key: 'medication', label: 'Medication' },
      { key: 'labTests', label: 'Lab Investigations' },
      { key: 'labResults', label: 'Lab Results' },
      { key: 'followup', label: 'Follow Up' },
      { key: 'advices', label: 'Advice' },
      { key: 'examinationFindings', label: 'Examination Findings' },
      { key: 'notes', label: 'Notes' },
      { key: 'referToDoctor', label: 'Refer to Doctor' },
      { key: 'procedures', label: 'Procedures' },
      { key: 'customSection', label: 'Custom Sections' },
      { key: 'additionalNotes', label: 'Additional Notes' },
    ],
  },
  {
    title: 'Display Options',
    items: [
      { key: 'hidePropertyHeaders', label: 'Hide Table Column Headers' },
      { key: 'hideHeaders', label: 'Hide Section Headers' },
      { key: 'hidePropertyHeadersSymptoms', label: 'Hide Symptom Property Headers' },
      { key: 'hidePropertyHeadersHistory', label: 'Hide History Property Headers' },
    ],
  },
  {
    title: 'Medication Print Options',
    items: [
      { key: 'genericName', label: 'Show Generic Name' },
      { key: 'productType', label: 'Show Product Type' },
      { key: 'hideBrandName', label: 'Hide Brand Name' },
      { key: 'taperingDoseShowTitle', label: 'Show Tapering Dose Title' },
      { key: 'replaceFreqToDoseFreq', label: 'Replace Frequency with Dose Frequency' },
      { key: 'printDose', label: 'Print Dose' },
      { key: 'printFrequency', label: 'Print Frequency' },
      { key: 'printDuration', label: 'Print Duration' },
      { key: 'printInstruction', label: 'Print Instructions' },
      { key: 'printQuantity', label: 'Print Quantity' },
      { key: 'genericNameInjections', label: 'Generic Name for Injections' },
      { key: 'hideBrandNameInjections', label: 'Hide Brand Name for Injections' },
    ],
  },
  {
    title: 'Lab Options',
    items: [
      { key: 'outOfRangeValuesOnly', label: 'Only Print Out-of-Range Values' },
    ],
  },
  {
    title: 'Medical History Subcategories',
    items: [
      { key: 'existingConditions', label: 'Existing Conditions' },
      { key: 'familyHistory', label: 'Family History' },
      { key: 'lifestyleHabits', label: 'Lifestyle Habits' },
      { key: 'foodOtherAllergy', label: 'Food/Other Allergies' },
      { key: 'drugAllergy', label: 'Drug Allergies' },
      { key: 'pastSurgicalProcedures', label: 'Past Surgical Procedures' },
      { key: 'currentMedications', label: 'Current Medications' },
      { key: 'travelHistory', label: 'Travel History' },
      { key: 'otherMedicalHistory', label: 'Other Medical History' },
    ],
  },
  {
    title: 'Patient Info Fields',
    items: [
      { key: 'nameAge', label: 'Name / Age' },
      { key: 'mobileNumber', label: 'Mobile Number' },
      { key: 'gender', label: 'Gender' },
      { key: 'uhid', label: 'UHID' },
      { key: 'patientAddress', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'mailId', label: 'Email' },
      { key: 'bloodGroup', label: 'Blood Group' },
      { key: 'alternativePhone', label: 'Alternative Phone' },
      { key: 'referredByDoctor', label: 'Referred By Doctor' },
      { key: 'maritalStatus', label: 'Marital Status' },
      { key: 'patientsOccupation', label: 'Occupation' },
      { key: 'notesForPatient', label: 'Notes for Patient' },
      { key: 'patientForm', label: 'Patient Form' },
      { key: 'guardianName', label: 'Guardian Name' },
    ],
  },
];

interface PrintSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function PrintSettingsPanel({ open, onClose }: PrintSettingsPanelProps) {
  const { printEnabledSections, savePrintSettings, refreshPrintSettings } = usePrescription();

  const [localSettings, setLocalSettings] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Sync local state when panel opens
  useEffect(() => {
    if (open) {
      const merged = { ...DEFAULT_PRINT_SETTINGS, ...printEnabledSections };
      setLocalSettings(merged);
      setHasUnsavedChanges(false);
      // Expand first category by default
      const initial: Record<string, boolean> = {};
      CATEGORIES.forEach((c, i) => { initial[c.title] = i === 0; });
      setExpandedCategories(initial);
    }
  }, [open, printEnabledSections]);

  const handleToggle = useCallback((key: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setHasUnsavedChanges(true);
  }, []);

  const toggleCategory = useCallback((title: string) => {
    setExpandedCategories(prev => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const handleApply = useCallback(async () => {
    setSaving(true);
    await savePrintSettings(localSettings);
    setHasUnsavedChanges(false);
    setSaving(false);
    onClose();
  }, [localSettings, savePrintSettings, onClose]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPrintSettings();
    setHasUnsavedChanges(false);
    setRefreshing(false);
  }, [refreshPrintSettings]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    onClose();
  }, [hasUnsavedChanges, onClose]);

  if (!open) return null;

  return (
    <>
      <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1299, bgcolor: 'rgba(0,0,0,0.2)' }} />
      <Fade in={open}>
        <Paper
          elevation={16}
          sx={{
            position: 'fixed',
            bottom: 76,
            left: 20,
            width: { xs: '90%', sm: '45%', md: '38%' },
            height: '75vh',
            maxHeight: 'calc(100vh - 100px)',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* ── Header ── */}
          <Box
            sx={{
              px: 2.5, py: 1.5,
              display: 'flex', alignItems: 'center', gap: 1.5,
              borderBottom: '1px solid', borderColor: 'divider',
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              flexShrink: 0,
            }}
          >
            <PrintIcon color="primary" />
            <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 700 }}>
              Print Settings
            </Typography>
            {hasUnsavedChanges && (
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                Unsaved
              </Typography>
            )}
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ px: 2.5, py: 1, bgcolor: 'grey.50', flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Control which sections and fields appear in the printed prescription PDF.
            </Typography>
          </Box>

          <Divider />

          {/* ── Settings List ── */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
            {CATEGORIES.map((category) => {
              const expanded = expandedCategories[category.title] ?? false;
              const enabledCount = category.items.filter(it => localSettings[it.key]).length;

              return (
                <Box key={category.title} sx={{ my: 0.5 }}>
                  <Box
                    onClick={() => toggleCategory(category.title)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1.5, py: 1, cursor: 'pointer', borderRadius: 1.5,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                      {category.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {enabledCount}/{category.items.length}
                    </Typography>
                  </Box>

                  <Collapse in={expanded}>
                    <Box sx={{ pl: 1.5, pr: 0.5 }}>
                      {category.items.map((item) => (
                        <Box
                          key={item.key}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            py: 0.25, px: 1.5, borderRadius: 1,
                            '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
                          }}
                        >
                          <Typography variant="body2" sx={{ flex: 1 }} color={localSettings[item.key] ? 'text.primary' : 'text.disabled'}>
                            {item.label}
                          </Typography>
                          <Switch
                            size="small"
                            checked={localSettings[item.key] ?? true}
                            onChange={() => handleToggle(item.key)}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>

          <Divider />

          {/* ── Footer ── */}
          <Box
            sx={{
              px: 2.5, py: 1.5,
              display: 'flex', gap: 1, alignItems: 'center',
              borderTop: '1px solid', borderColor: 'divider',
              bgcolor: (theme) => alpha(theme.palette.grey[100], 0.5),
              flexShrink: 0,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              color="inherit"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleApply}
              disabled={saving || !hasUnsavedChanges}
            >
              {saving ? 'Applying...' : 'Apply'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </>
  );
}
