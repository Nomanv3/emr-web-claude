import { useState } from 'react';
import {
  Box, TextField, Button, Autocomplete, Chip, Stack,
} from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useQuery } from '@tanstack/react-query';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';
import { mastersApi } from '@/services/api';

export default function ExaminationSection() {
  const {
    examinationFindings, addExaminationFinding, removeExaminationFinding,
    getTemplatesByType, addTemplate, deleteTemplate, applyTemplate,
  } = usePrescription();
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');

  const { data: masterFindings } = useQuery({
    queryKey: ['masters', 'examination-findings', searchTerm],
    queryFn: () => mastersApi.getExaminationFindings(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 60_000,
  });

  const options = masterFindings?.data?.map(f => f.name) || [];

  const handleAdd = (name: string) => {
    if (!name.trim()) return;
    addExaminationFinding({ name: name.trim(), notes: notes.trim() || undefined });
    setSearchTerm('');
    setNotes('');
  };

  const examinationTemplates = getTemplatesByType('examination').map(t => ({
    templateId: t.templateId,
    name: t.name,
  }));

  const handleSaveTemplate = (name: string) => {
    addTemplate(
      name,
      'examination',
      examinationFindings.map(f => ({ name: f.name, notes: f.notes })),
    );
  };

  return (
    <SectionHeader
      id="examination"
      title="Examination Findings"
      icon={<BiotechIcon />}
      itemCount={examinationFindings.length}
      templateType="examination"
      templates={examinationTemplates}
      onSaveTemplate={handleSaveTemplate}
      onApplyTemplate={(id) => applyTemplate(id, 'examination')}
      onDeleteTemplate={(id) => deleteTemplate(id, 'examination')}
    >
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Autocomplete
          freeSolo options={options} inputValue={searchTerm}
          onInputChange={(_, val) => setSearchTerm(val)}
          onChange={(_, val) => { if (val) handleAdd(val); }}
          renderInput={params => <TextField {...params} placeholder="Search findings..." size="small" />}
          sx={{ flex: 1 }} size="small"
        />
        <TextField placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} size="small" sx={{ width: 200 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleAdd(searchTerm)}>Add</Button>
      </Box>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {examinationFindings.map((f, i) => (
          <Chip
            key={i}
            label={f.notes ? `${f.name} — ${f.notes}` : f.name}
            onDelete={() => removeExaminationFinding(i)}
            deleteIcon={<DeleteIcon />}
            variant="outlined"
            color="primary"
          />
        ))}
      </Stack>
    </SectionHeader>
  );
}
