import {
  Box, Grid, Typography, ToggleButtonGroup, ToggleButton, TextField,
  FormControlLabel, Checkbox,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SectionHeader from '../components/SectionHeader';
import { usePrescription, type MedicalCondition } from '../context/PrescriptionContext';

export default function MedicalHistorySection() {
  const { medicalConditions, noRelevantHistory, updateMedicalCondition, setNoRelevantHistory } = usePrescription();

  const filledCount = medicalConditions.filter(c => c.value !== '-').length;

  return (
    <SectionHeader id="medicalHistory" title="Patient Medical History" icon={<HistoryIcon />} itemCount={filledCount}>
      <FormControlLabel
        control={
          <Checkbox
            checked={noRelevantHistory}
            onChange={e => setNoRelevantHistory(e.target.checked)}
          />
        }
        label={<Typography variant="body2">No relevant medical history</Typography>}
        sx={{ mb: 2 }}
      />

      {!noRelevantHistory && (
        <Grid container spacing={2}>
          {medicalConditions.map((condition, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={condition.name}>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>{condition.name}</Typography>
                <ToggleButtonGroup
                  value={condition.value}
                  exclusive
                  onChange={(_, val) => {
                    if (val) updateMedicalCondition(i, { ...condition, value: val as MedicalCondition['value'] });
                  }}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="Y" color="error" sx={{ flex: 1 }}>Yes</ToggleButton>
                  <ToggleButton value="N" color="success" sx={{ flex: 1 }}>No</ToggleButton>
                  <ToggleButton value="-" sx={{ flex: 1 }}>Unknown</ToggleButton>
                </ToggleButtonGroup>
                {condition.value === 'Y' && (
                  <TextField
                    placeholder="Since when?"
                    value={condition.since || ''}
                    onChange={e => updateMedicalCondition(i, { ...condition, since: e.target.value })}
                    size="small" fullWidth sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </SectionHeader>
  );
}
