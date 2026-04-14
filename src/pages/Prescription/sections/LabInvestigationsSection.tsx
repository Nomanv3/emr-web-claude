import { useState, useCallback } from 'react';
import {
  Box, TextField, Button, Autocomplete, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, Switch, FormControlLabel,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import SectionHeader from '../components/SectionHeader';
import InlineEditableName, { type SearchOption } from '../components/InlineEditableName';
import InlineEditableCell from '../components/InlineEditableCell';
import { usePrescription } from '../context/PrescriptionContext';
import { mastersApi } from '@/services/api';
import type { LabInvestigation } from '@/types';

export default function LabInvestigationsSection() {
  const {
    labInvestigations, addLabInvestigation, removeLabInvestigation, updateLabInvestigation,
    reorderLabInvestigations,
    getTemplatesByType, addTemplate, deleteTemplate, applyTemplate,
  } = usePrescription();
  const [searchTerm, setSearchTerm] = useState('');

  const searchLabName = useCallback(async (q: string): Promise<SearchOption[]> => {
    const res = await mastersApi.getLabTests(q);
    return (res.data || []).map(t => ({
      label: t.name,
      secondary: t.category,
      payload: { name: t.name, category: t.category },
    }));
  }, []);

  const { data: masterTests } = useQuery({
    queryKey: ['masters', 'lab-tests', searchTerm],
    queryFn: () => mastersApi.getLabTests(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 60_000,
  });

  const options = masterTests?.data?.map(t => ({
    label: `${t.name} (${t.category})`,
    name: t.name,
    category: t.category,
  })) || [];

  const handleAdd = (opt: { name: string; category: string } | null) => {
    const name = opt?.name || searchTerm.trim();
    if (!name) return;
    const lab: LabInvestigation = {
      testName: name,
      category: opt?.category,
      urgent: false,
    };
    addLabInvestigation(lab);
    setSearchTerm('');
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(labInvestigations);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    reorderLabInvestigations(items);
  }, [labInvestigations, reorderLabInvestigations]);

  const labTemplates = getTemplatesByType('labtest').map(t => ({
    templateId: t.templateId,
    name: t.name,
  }));

  const handleSaveTemplate = (name: string) => {
    addTemplate(
      name,
      'labtest',
      labInvestigations.map(l => ({ testName: l.testName, category: l.category })),
    );
  };

  return (
    <SectionHeader
      id="labInvestigations"
      title="Lab Investigations"
      icon={<ScienceIcon />}
      itemCount={labInvestigations.length}
      templateType="labtest"
      templates={labTemplates}
      onSaveTemplate={handleSaveTemplate}
      onApplyTemplate={(id) => applyTemplate(id, 'labtest')}
      onDeleteTemplate={(id) => deleteTemplate(id, 'labtest')}
    >
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Autocomplete
          freeSolo
          options={options}
          getOptionLabel={opt => typeof opt === 'string' ? opt : opt.label}
          inputValue={searchTerm}
          onInputChange={(_, val) => setSearchTerm(val)}
          onChange={(_, val) => {
            if (typeof val === 'string') handleAdd(null);
            else handleAdd(val);
          }}
          renderInput={params => <TextField {...params} placeholder="Search lab tests..." size="small" />}
          sx={{ flex: 1 }} size="small"
        />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleAdd(null)}>Add</Button>
      </Box>

      {labInvestigations.length > 0 && (
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 36, p: 0.5 }} />
              <TableCell>Test Name</TableCell>
              <TableCell sx={{ width: 130 }}>Category</TableCell>
              <TableCell sx={{ width: 130 }}>Test Date</TableCell>
              <TableCell sx={{ width: 130 }}>Repeat Date</TableCell>
              <TableCell sx={{ width: 150 }}>Remarks</TableCell>
              <TableCell sx={{ width: 70 }}>Urgent</TableCell>
              <TableCell sx={{ width: 44 }} />
            </TableRow>
          </TableHead>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="labInvestigations">
              {(provided) => (
                <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                  {labInvestigations.map((lab, i) => (
                    <Draggable key={`lab-${i}`} draggableId={`lab-${i}`} index={i}>
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
                            <InlineEditableName
                              value={lab.testName}
                              searchFn={searchLabName}
                              placeholder="Search test..."
                              onRename={(name) => updateLabInvestigation(i, { ...lab, testName: name })}
                              onReplace={(opt) => {
                                const p = opt.payload as { name: string; category: string } | undefined;
                                updateLabInvestigation(i, { ...lab, testName: p?.name ?? opt.label, category: p?.category ?? lab.category });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <InlineEditableCell
                              value={lab.category || ''}
                              placeholder="Category"
                              onChange={(val) => updateLabInvestigation(i, { ...lab, category: val || undefined })}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField type="date" value={lab.testOn || ''} size="small" fullWidth
                              slotProps={{ inputLabel: { shrink: true } }}
                              sx={{ m: 0, '& .MuiInputBase-root': { height: 30, fontSize: 13 }, '& .MuiInputBase-input': { py: 0.25, px: 0.75 } }}
                              onChange={e => updateLabInvestigation(i, { ...lab, testOn: e.target.value })} />
                          </TableCell>
                          <TableCell>
                            <TextField type="date" value={lab.repeatOn || ''} size="small" fullWidth
                              slotProps={{ inputLabel: { shrink: true } }}
                              sx={{ m: 0, '& .MuiInputBase-root': { height: 30, fontSize: 13 }, '& .MuiInputBase-input': { py: 0.25, px: 0.75 } }}
                              onChange={e => updateLabInvestigation(i, { ...lab, repeatOn: e.target.value })} />
                          </TableCell>
                          <TableCell>
                            <TextField value={lab.remarks || ''} size="small" fullWidth placeholder="Remarks"
                              sx={{ m: 0, '& .MuiInputBase-root': { height: 30, fontSize: 13 }, '& .MuiInputBase-input': { py: 0.25, px: 0.75 } }}
                              onChange={e => updateLabInvestigation(i, { ...lab, remarks: e.target.value })} />
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={<Switch size="small" checked={lab.urgent || false}
                                onChange={e => updateLabInvestigation(i, { ...lab, urgent: e.target.checked })} />}
                              label="" sx={{ m: 0 }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => removeLabInvestigation(i)}>
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
