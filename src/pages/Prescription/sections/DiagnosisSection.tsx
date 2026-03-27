import { useState, useCallback } from 'react';
import {
  Box, TextField, Button, Autocomplete, IconButton, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, MenuItem,
} from '@mui/material';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';
import { mastersApi } from '@/services/api';
import type { Diagnosis, DiagnosisType, DiagnosisStatus } from '@/types';

const TYPE_OPTIONS: DiagnosisType[] = ['Primary', 'Secondary', 'Differential'];
const FALLBACK_STATUS: DiagnosisStatus[] = ['Active', 'Resolved', 'Chronic'];

export default function DiagnosisSection() {
  const {
    diagnoses, addDiagnosis, removeDiagnosis, updateDiagnosis, reorderDiagnoses,
    getTemplatesByType, addTemplate, deleteTemplate, applyTemplate,
    dropdownOptions,
  } = usePrescription();
  const statusOptions = dropdownOptions?.diagnosis?.status;
  const [searchTerm, setSearchTerm] = useState('');

  const { data: masterDiagnoses } = useQuery({
    queryKey: ['masters', 'diagnoses', searchTerm],
    queryFn: () => mastersApi.getDiagnoses(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 60_000,
  });

  const diagnosisOptions = masterDiagnoses?.data?.map(d => ({
    label: `${d.icdCode} — ${d.description}`,
    code: d.icdCode,
    description: d.description,
  })) || [];

  const handleAdd = (option: { code: string; description: string } | null, freeText?: string) => {
    const newDiag: Diagnosis = {
      icdCode: option?.code || '',
      description: option?.description || freeText || searchTerm,
      type: 'Primary',
      status: 'Active',
    };
    if (newDiag.description.trim()) {
      addDiagnosis(newDiag);
      setSearchTerm('');
    }
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(diagnoses);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    reorderDiagnoses(items);
  }, [diagnoses, reorderDiagnoses]);

  const diagnosisTemplates = getTemplatesByType('diagnosis').map(t => ({
    templateId: t.templateId,
    name: t.name,
  }));

  const handleSaveTemplate = (name: string) => {
    addTemplate(
      name,
      'diagnosis',
      diagnoses.map(d => ({ icdCode: d.icdCode, description: d.description, type: d.type, status: d.status })),
    );
  };

  return (
    <SectionHeader
      id="diagnosis"
      title="Diagnosis"
      icon={<MedicalInformationIcon />}
      itemCount={diagnoses.length}
      templateType="diagnosis"
      templates={diagnosisTemplates}
      onSaveTemplate={handleSaveTemplate}
      onApplyTemplate={(id) => applyTemplate(id, 'diagnosis')}
      onDeleteTemplate={(id) => deleteTemplate(id, 'diagnosis')}
    >
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Autocomplete
          freeSolo
          options={diagnosisOptions}
          getOptionLabel={opt => typeof opt === 'string' ? opt : opt.label}
          inputValue={searchTerm}
          onInputChange={(_, val) => setSearchTerm(val)}
          onChange={(_, val) => {
            if (typeof val === 'string') handleAdd(null, val);
            else if (val) handleAdd(val);
          }}
          renderInput={params => (
            <TextField {...params} placeholder="Search ICD-10 diagnoses..." size="small" />
          )}
          sx={{ flex: 1 }}
          size="small"
        />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleAdd(null)}>
          Add
        </Button>
      </Box>

      {diagnoses.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40, p: 0.5 }} />
              <TableCell>ICD Code</TableCell>
              <TableCell>Description</TableCell>
              <TableCell sx={{ width: 130 }}>Type</TableCell>
              <TableCell sx={{ width: 120 }}>Status</TableCell>
              <TableCell sx={{ width: 140 }}>Notes</TableCell>
              <TableCell sx={{ width: 50 }} />
            </TableRow>
          </TableHead>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="diagnoses">
              {(provided) => (
                <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                  {diagnoses.map((d, i) => (
                    <Draggable key={`diag-${i}`} draggableId={`diag-${i}`} index={i}>
                      {(dragProvided, snapshot) => (
                        <TableRow
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          sx={{
                            ...(snapshot.isDragging && {
                              display: 'table',
                              bgcolor: 'action.hover',
                              boxShadow: 4,
                            }),
                          }}
                        >
                          <TableCell sx={{ width: 40, p: 0.5 }}>
                            <Box
                              {...dragProvided.dragHandleProps}
                              sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
                            >
                              <DragIndicatorIcon fontSize="small" />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {d.icdCode && <Chip label={d.icdCode} size="small" color="info" variant="outlined" />}
                          </TableCell>
                          <TableCell>{d.description}</TableCell>
                          <TableCell>
                            <TextField
                              select value={d.type} size="small" fullWidth
                              onChange={e => updateDiagnosis(i, { ...d, type: e.target.value as DiagnosisType })}
                            >
                              {TYPE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              select value={d.status} size="small" fullWidth
                              onChange={e => updateDiagnosis(i, { ...d, status: e.target.value as DiagnosisStatus })}
                            >
                              {statusOptions && statusOptions.length > 0
                                ? statusOptions.map(s => <MenuItem key={s.dropdown_option_id} value={s.option_value}>{s.option_value}</MenuItem>)
                                : FALLBACK_STATUS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={d.notes || ''} size="small" fullWidth placeholder="Notes"
                              onChange={e => updateDiagnosis(i, { ...d, notes: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => removeDiagnosis(i)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </TableBody>
              )}
            </Droppable>
          </DragDropContext>
        </Table>
      )}
    </SectionHeader>
  );
}
