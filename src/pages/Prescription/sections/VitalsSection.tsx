import { Grid, TextField, Typography, InputAdornment, Chip } from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';

export default function VitalsSection() {
  const { vitals, updateVitals } = usePrescription();

  const setBp = (field: 'systolic' | 'diastolic', value: string) => {
    updateVitals({ bp: { ...vitals.bp, systolic: vitals.bp?.systolic || '', diastolic: vitals.bp?.diastolic || '', [field]: value } });
  };

  const bmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'warning' as const };
    if (bmi < 25) return { label: 'Normal', color: 'success' as const };
    if (bmi < 30) return { label: 'Overweight', color: 'warning' as const };
    return { label: 'Obese', color: 'error' as const };
  };

  const bmiValue = parseFloat(vitals.bmi || '');

  return (
    <SectionHeader id="vitals" title="Vitals" icon={<MonitorHeartIcon />}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <TextField
            label="Height"
            value={vitals.height?.value || ''}
            onChange={e => updateVitals({ height: { value: e.target.value, unit_id: 1 } })}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">cm</InputAdornment> } }}
            size="small"
            fullWidth
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <TextField
            label="Weight"
            value={vitals.weight?.value || ''}
            onChange={e => updateVitals({ weight: { value: e.target.value, unit_id: 1 } })}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
            size="small"
            fullWidth
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <TextField
            label="BMI"
            value={vitals.bmi || ''}
            slotProps={{ input: {
              readOnly: true,
              endAdornment: bmiValue > 0 ? (
                <Chip label={bmiCategory(bmiValue).label} color={bmiCategory(bmiValue).color} size="small" sx={{ height: 20, fontSize: 11 }} />
              ) : null,
            } }}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Blood Pressure
          </Typography>
          <Grid container spacing={1}>
            <Grid size={6}>
              <TextField
                placeholder="Sys"
                value={vitals.bp?.systolic || ''}
                onChange={e => setBp('systolic', e.target.value)}
                size="small"
                fullWidth
                type="number"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                placeholder="Dia"
                value={vitals.bp?.diastolic || ''}
                onChange={e => setBp('diastolic', e.target.value)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">mmHg</InputAdornment> } }}
                size="small"
                fullWidth
                type="number"
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <TextField
            label="Heart Rate"
            value={vitals.heartRate || ''}
            onChange={e => updateVitals({ heartRate: e.target.value })}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">bpm</InputAdornment> } }}
            size="small"
            fullWidth
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <TextField
            label="Temperature"
            value={vitals.temp?.value || ''}
            onChange={e => updateVitals({ temp: { value: e.target.value, unit_id: 1 } })}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">°F</InputAdornment> } }}
            size="small"
            fullWidth
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <TextField
            label="SpO2"
            value={vitals.spo2 || ''}
            onChange={e => updateVitals({ spo2: e.target.value })}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
            size="small"
            fullWidth
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <TextField
            label="Resp. Rate"
            value={vitals.rr || ''}
            onChange={e => updateVitals({ rr: e.target.value })}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">/min</InputAdornment> } }}
            size="small"
            fullWidth
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <TextField
            label="Pulse"
            value={vitals.pulse?.value || ''}
            onChange={e => updateVitals({ pulse: { value: e.target.value, unit_id: 1 } })}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">bpm</InputAdornment> } }}
            size="small"
            fullWidth
            type="number"
          />
        </Grid>
      </Grid>
    </SectionHeader>
  );
}
