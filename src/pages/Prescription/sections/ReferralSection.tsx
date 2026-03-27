import { Grid, TextField, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';

export default function ReferralSection() {
  const { referral, setReferral } = usePrescription();

  const updateField = (field: string, value: string) => {
    setReferral({
      doctorName: referral?.doctorName || '',
      specialty: referral?.specialty || '',
      reason: referral?.reason || '',
      notes: referral?.notes || '',
      [field]: value,
    });
  };

  return (
    <SectionHeader id="referral" title="Refer to Doctor" icon={<SendIcon />} itemCount={referral?.doctorName ? 1 : 0}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Doctor Name" value={referral?.doctorName || ''}
            onChange={e => updateField('doctorName', e.target.value)}
            size="small" fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Specialty" value={referral?.specialty || ''}
            onChange={e => updateField('specialty', e.target.value)}
            size="small" fullWidth placeholder="e.g. Cardiology"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Reason" value={referral?.reason || ''}
            onChange={e => updateField('reason', e.target.value)}
            size="small" fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Notes" value={referral?.notes || ''}
            onChange={e => updateField('notes', e.target.value)}
            size="small" fullWidth multiline rows={2}
          />
        </Grid>
      </Grid>
      {referral?.doctorName && (
        <Button size="small" color="error" onClick={() => setReferral(null)} sx={{ mt: 1 }}>Clear Referral</Button>
      )}
    </SectionHeader>
  );
}
