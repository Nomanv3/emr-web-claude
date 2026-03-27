import { useState } from 'react';
import {
  Box, TextField, Button, IconButton, Typography, Grid, Paper,
} from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SectionHeader from '../components/SectionHeader';
import { usePrescription } from '../context/PrescriptionContext';
import { v4 as uuidv4 } from 'uuid';
import type { CustomSection } from '@/types';

export default function CustomSectionsSection() {
  const { customSections, addCustomSection, removeCustomSection, updateCustomSection } = usePrescription();
  const [newTitle, setNewTitle] = useState('');

  const handleAddSection = () => {
    if (!newTitle.trim()) return;
    const section: CustomSection = {
      id: uuidv4(),
      title: newTitle.trim(),
      items: [{ key: '', value: '' }],
    };
    addCustomSection(section);
    setNewTitle('');
  };

  const addItem = (sectionIndex: number) => {
    const section = customSections[sectionIndex];
    updateCustomSection(sectionIndex, {
      ...section,
      items: [...section.items, { key: '', value: '' }],
    });
  };

  const updateItem = (sectionIndex: number, itemIndex: number, field: 'key' | 'value', val: string) => {
    const section = customSections[sectionIndex];
    const newItems = section.items.map((item, i) =>
      i === itemIndex ? { ...item, [field]: val } : item
    );
    updateCustomSection(sectionIndex, { ...section, items: newItems });
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    const section = customSections[sectionIndex];
    updateCustomSection(sectionIndex, {
      ...section,
      items: section.items.filter((_, i) => i !== itemIndex),
    });
  };

  return (
    <SectionHeader id="customSections" title="Custom Sections" icon={<AddBoxIcon />} itemCount={customSections.length}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="Section Title" value={newTitle} onChange={e => setNewTitle(e.target.value)}
          size="small" sx={{ flex: 1 }} placeholder="e.g. Physiotherapy Instructions"
        />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddSection}>
          Add Section
        </Button>
      </Box>

      {customSections.map((section, si) => (
        <Paper key={section.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>{section.title}</Typography>
            <IconButton size="small" color="error" onClick={() => removeCustomSection(si)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          {section.items.map((item, ii) => (
            <Grid container spacing={1} key={ii} sx={{ mb: 1 }}>
              <Grid size={{ xs: 5 }}>
                <TextField
                  value={item.key} onChange={e => updateItem(si, ii, 'key', e.target.value)}
                  placeholder="Label" size="small" fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  value={item.value} onChange={e => updateItem(si, ii, 'value', e.target.value)}
                  placeholder="Value" size="small" fullWidth
                />
              </Grid>
              <Grid size={{ xs: 1 }}>
                <IconButton size="small" onClick={() => removeItem(si, ii)} disabled={section.items.length <= 1}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => addItem(si)}>Add Row</Button>
        </Paper>
      ))}
    </SectionHeader>
  );
}
