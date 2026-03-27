import { TextField } from '@mui/material';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';

export default function AdviceSection() {
  const { advice, setAdvice } = usePrescription();

  return (
    <SectionHeader id="advice" title="Advice / Instructions" icon={<TipsAndUpdatesIcon />} itemCount={advice ? 1 : 0}>
      <TextField
        label="Patient Instructions"
        value={advice}
        onChange={e => setAdvice(e.target.value)}
        multiline rows={4} fullWidth
        placeholder="Diet, lifestyle, exercise, medications to avoid, when to seek emergency care..."
        size="small"
      />
    </SectionHeader>
  );
}
