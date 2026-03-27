import { Grid, TextField } from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';

export default function NotesSection() {
  const { surgicalNotes, privateNotes, setSurgicalNotes, setPrivateNotes } = usePrescription();
  const count = (surgicalNotes ? 1 : 0) + (privateNotes ? 1 : 0);

  return (
    <SectionHeader id="notes" title="Notes" icon={<NotesIcon />} itemCount={count}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Surgical Notes"
            value={surgicalNotes}
            onChange={e => setSurgicalNotes(e.target.value)}
            multiline rows={4} fullWidth size="small"
            placeholder="Surgical/procedural notes..."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Private / Internal Notes"
            value={privateNotes}
            onChange={e => setPrivateNotes(e.target.value)}
            multiline rows={4} fullWidth size="small"
            placeholder="Internal notes (not printed on patient PDF)..."
            helperText="These notes will NOT appear on the prescription PDF"
          />
        </Grid>
      </Grid>
    </SectionHeader>
  );
}
