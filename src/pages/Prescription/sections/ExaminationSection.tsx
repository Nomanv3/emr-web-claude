import { useState, useCallback } from 'react';
import {
  Box, TextField, Button, Autocomplete, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';
import { mastersApi } from '@/services/api';

export default function ExaminationSection() {
  const {
    examinationFindings, addExaminationFinding, removeExaminationFinding, reorderExaminationFindings,
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

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(examinationFindings);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    reorderExaminationFindings(items);
  }, [examinationFindings, reorderExaminationFindings]);

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

      {examinationFindings.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40, p: 0.5 }} />
              <TableCell>Finding</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell sx={{ width: 50 }} />
            </TableRow>
          </TableHead>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="examinationFindings">
              {(provided) => (
                <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                  {examinationFindings.map((f, i) => (
                    <Draggable key={`exam-${i}`} draggableId={`exam-${i}`} index={i}>
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
                          <TableCell>{f.name}</TableCell>
                          <TableCell>{f.notes || '-'}</TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => removeExaminationFinding(i)}>
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
