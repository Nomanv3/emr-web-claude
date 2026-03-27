import { useState } from 'react';
import {
  Box, TextField, Button, Autocomplete, IconButton, Chip,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import HealingIcon from '@mui/icons-material/Healing';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useQuery } from '@tanstack/react-query';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';
import { mastersApi } from '@/services/api';

export default function ProceduresSection() {
  const {
    procedures, addProcedure, removeProcedure,
    getTemplatesByType, addTemplate, deleteTemplate, applyTemplate,
  } = usePrescription();
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');

  const { data: masterProcedures } = useQuery({
    queryKey: ['masters', 'procedures', searchTerm],
    queryFn: () => mastersApi.getProcedures(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 60_000,
  });

  const procedureOptions = masterProcedures?.data?.map(p => p.name) || [];

  const handleAdd = (name: string) => {
    if (!name.trim()) return;
    addProcedure({ name: name.trim(), date: new Date().toISOString().slice(0, 10), notes: notes.trim() || undefined });
    setSearchTerm('');
    setNotes('');
  };

  const procedureTemplates = getTemplatesByType('procedure').map(t => ({
    templateId: t.templateId,
    name: t.name,
  }));

  const handleSaveTemplate = (name: string) => {
    addTemplate(
      name,
      'procedure',
      procedures.map(p => ({ name: p.name, notes: p.notes })),
    );
  };

  return (
    <SectionHeader
      id="procedures"
      title="Procedures"
      icon={<HealingIcon />}
      itemCount={procedures.length}
      templateType="procedure"
      templates={procedureTemplates}
      onSaveTemplate={handleSaveTemplate}
      onApplyTemplate={(id) => applyTemplate(id, 'procedure')}
      onDeleteTemplate={(id) => deleteTemplate(id, 'procedure')}
    >
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Autocomplete
          freeSolo
          options={procedureOptions}
          inputValue={searchTerm}
          onInputChange={(_, val) => setSearchTerm(val)}
          onChange={(_, val) => { if (val) handleAdd(val); }}
          renderInput={params => <TextField {...params} label="Procedure Name" size="small" />}
          sx={{ flex: 1 }} size="small"
        />
        <TextField label="Notes" value={notes} onChange={e => setNotes(e.target.value)} size="small" sx={{ width: 200 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleAdd(searchTerm)} disabled={!searchTerm.trim()}>Add</Button>
      </Box>
      {procedures.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Procedure</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell sx={{ width: 50 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {procedures.map((p, i) => (
              <TableRow key={i}>
                <TableCell><Chip label={p.name} size="small" color="info" /></TableCell>
                <TableCell>{p.date}</TableCell>
                <TableCell>{p.notes || '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => removeProcedure(i)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionHeader>
  );
}
