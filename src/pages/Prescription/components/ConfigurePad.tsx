import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Paper, Box, Typography, IconButton, List, ListItem, ListItemIcon,
  ListItemText, Checkbox, Divider, Button, Tooltip, alpha, Fade, Backdrop,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TuneIcon from '@mui/icons-material/Tune';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { usePrescription, ALL_SECTIONS, type SectionId } from '../context/PrescriptionContext';
import { SECTION_META } from './SmallNavbar';
import { prescriptionApi } from '@/services/api';
import { DEV_ORG, DEV_BRANCH, DEV_DOCTOR } from '../context/prescriptionHelpers';

interface ConfigurePadProps {
  open: boolean;
  onClose: () => void;
}

const PANEL_WIDTH = 380;
const INITIAL_HEIGHT = 540;

export default function ConfigurePad({ open, onClose }: ConfigurePadProps) {
  const { sectionConfig, toggleSection, reorderSections } = usePrescription();
  const [localOrder, setLocalOrder] = useState<SectionId[]>(sectionConfig.sectionOrder);
  const [localEnabled, setLocalEnabled] = useState<SectionId[]>(sectionConfig.enabledSections);
  const [saving, setSaving] = useState(false);

  // Draggable panel position
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync local state and reset position when panel opens
  useEffect(() => {
    if (open) {
      setLocalOrder([...sectionConfig.sectionOrder]);
      setLocalEnabled([...sectionConfig.enabledSections]);
      setPosition({
        x: Math.max(0, window.innerWidth - PANEL_WIDTH - 40),
        y: Math.max(0, Math.min(80, window.innerHeight - INITIAL_HEIGHT - 20)),
      });
    }
  }, [open, sectionConfig]);

  // Panel drag: mouse events on window
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - PANEL_WIDTH, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [open]);

  // Section toggle
  const handleToggle = useCallback((sectionId: SectionId) => {
    setLocalEnabled(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  // Drag-and-drop reorder within section list
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const items = [...localOrder];
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    setLocalOrder(items);
  }, [localOrder]);

  // Save configuration
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      reorderSections(localOrder);
      localEnabled.forEach(sec => {
        if (!sectionConfig.enabledSections.includes(sec)) toggleSection(sec);
      });
      sectionConfig.enabledSections.forEach(sec => {
        if (!localEnabled.includes(sec)) toggleSection(sec);
      });

      const enabledMap: Record<string, boolean> = {};
      ALL_SECTIONS.forEach(s => {
        enabledMap[s] = localEnabled.includes(s);
      });
      await prescriptionApi.saveConfiguration({
        organization_id: DEV_ORG,
        branch_id: DEV_BRANCH,
        doctor_id: DEV_DOCTOR,
        section_order: localOrder,
        enabled_sections: enabledMap,
      });
      toast.success('Pad configuration saved');
      onClose();
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }, [localOrder, localEnabled, reorderSections, toggleSection, sectionConfig.enabledSections, onClose]);

  const handleReset = useCallback(() => {
    setLocalOrder([...ALL_SECTIONS]);
    setLocalEnabled([...ALL_SECTIONS]);
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Semi-transparent backdrop — click to close */}
      <Backdrop
        open={open}
        onClick={onClose}
        sx={{ zIndex: 1299, bgcolor: 'rgba(0,0,0,0.15)' }}
      />

      <Fade in={open}>
        <Paper
          ref={panelRef}
          elevation={16}
          sx={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: PANEL_WIDTH,
            height: INITIAL_HEIGHT,
            maxHeight: 'calc(100vh - 40px)',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2.5,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* ── Drag handle header ── */}
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              px: 2, py: 1.5,
              display: 'flex', alignItems: 'center', gap: 1,
              borderBottom: '1px solid', borderColor: 'divider',
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
              cursor: isDragging.current ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
          >
            <Tooltip title="Drag to move">
              <OpenWithIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </Tooltip>
            <TuneIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
              Configure Pad
            </Typography>
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* ── Help text ── */}
          <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Drag sections to reorder. Toggle checkboxes to show/hide.
            </Typography>
          </Box>

          <Divider />

          {/* ── Drag-and-drop section list ── */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="configure-sections">
                {(provided) => (
                  <List
                    dense
                    disablePadding
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {localOrder.map((sectionId, index) => {
                      const meta = SECTION_META[sectionId];
                      const isEnabled = localEnabled.includes(sectionId);

                      return (
                        <Draggable key={sectionId} draggableId={sectionId} index={index}>
                          {(dragProvided, snapshot) => (
                            <ListItem
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              sx={{
                                px: 1, py: 0.5,
                                bgcolor: snapshot.isDragging
                                  ? (theme) => alpha(theme.palette.primary.main, 0.12)
                                  : isEnabled ? 'transparent' : 'action.disabledBackground',
                                opacity: isEnabled ? 1 : 0.55,
                                transition: snapshot.isDragging ? 'none' : 'background-color 0.15s ease',
                                '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) },
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                boxShadow: snapshot.isDragging ? 6 : 0,
                              }}
                            >
                              {/* Drag grip handle */}
                              <Box
                                {...dragProvided.dragHandleProps}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mr: 0.5,
                                  color: 'text.disabled',
                                  cursor: 'grab',
                                  '&:hover': { color: 'primary.main' },
                                }}
                              >
                                <DragIndicatorIcon fontSize="small" />
                              </Box>

                              <Checkbox
                                edge="start"
                                checked={isEnabled}
                                onChange={() => handleToggle(sectionId)}
                                size="small"
                                sx={{ mr: 0.5 }}
                              />

                              <ListItemIcon sx={{ minWidth: 28, color: isEnabled ? 'primary.main' : 'text.disabled' }}>
                                {meta.icon}
                              </ListItemIcon>

                              <ListItemText
                                primary={meta.label}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  fontWeight: isEnabled ? 600 : 400,
                                  color: isEnabled ? 'text.primary' : 'text.disabled',
                                }}
                              />
                            </ListItem>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
          </Box>

          <Divider />

          {/* ── Footer actions ── */}
          <Box
            sx={{
              px: 2, py: 1.5,
              display: 'flex', gap: 1, alignItems: 'center',
              borderTop: '1px solid', borderColor: 'divider',
              bgcolor: (theme) => alpha(theme.palette.grey[100], 0.5),
              flexShrink: 0,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
              color="inherit"
            >
              Reset
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </>
  );
}
