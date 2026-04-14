/**
 * AddPrescriptionPage — Final prescription page shown after "Finish Prescription".
 * Shows success banner, live PDF preview, and post-save action buttons.
 */
import { useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid, Divider, Chip,
  IconButton, Tooltip, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  List, ListItem, ListItemText, CircularProgress, InputAdornment,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentIcon from '@mui/icons-material/Payment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import HomeIcon from '@mui/icons-material/Home';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PrescriptionPdf, { downloadPdfFromUrl } from './components/PrescriptionPdf';
import type { PrescriptionPdfData } from './components/PrescriptionPdf';
import type { PatientInfo, DropdownOptions, PrescriptionLanguage, PrescriptionTemplate } from '@/types';
import { whatsappApi, templatesApi } from '@/services/api';
import { DEV_ORG, DEV_BRANCH, DEV_DOCTOR } from './context/prescriptionHelpers';

const EDIT_PAGE_SIZE = 6;

const MotionBox = motion.create(Box);

interface LocationState {
  patientId?: string;
  prescriptionId?: string;
  patientInfo?: PatientInfo;
  prescriptionData?: PrescriptionPdfData;
  dropdownOptions?: DropdownOptions;
  printSettings?: Record<string, boolean>;
  language?: PrescriptionLanguage;
}

export default function AddPrescriptionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;
  const { patientId, prescriptionId, patientInfo, prescriptionData, dropdownOptions, printSettings, language = 'en' } = state;

  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);
  const [sharingWhatsapp, setSharingWhatsapp] = useState(false);

  // Save-as-template dialog
  const [saveTmplOpen, setSaveTmplOpen] = useState(false);
  const [tmplName, setTmplName] = useState('');
  const [savingTmpl, setSavingTmpl] = useState(false);

  // Edit-existing-template dialog (rename / delete — does NOT apply)
  const [editTmplOpen, setEditTmplOpen] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState<PrescriptionTemplate[]>([]);
  const [loadingTmpls, setLoadingTmpls] = useState(false);
  const [editSearch, setEditSearch] = useState('');
  const [editVisibleCount, setEditVisibleCount] = useState(EDIT_PAGE_SIZE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingRename, setSavingRename] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handlePdfReady = useCallback((dataUrl: string) => {
    setPdfDataUrl(dataUrl);
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfDataUrl) {
      toast.error('PDF is still generating, please wait...');
      return;
    }
    const name = patientInfo?.name?.replace(/\s+/g, '_') || 'Patient';
    const date = new Date().toISOString().slice(0, 10);
    downloadPdfFromUrl(pdfDataUrl, `Prescription_${name}_${date}.pdf`);
    toast.success('PDF downloaded successfully');
  }, [pdfDataUrl, patientInfo]);

  const handlePrint = useCallback(() => {
    if (!pdfDataUrl) {
      window.print();
      return;
    }
    // Chrome blocks window.open() on data: URLs — convert to a blob URL first.
    try {
      const [meta, b64] = pdfDataUrl.split(',');
      const mime = /data:(.*?);base64/.exec(meta)?.[1] || 'application/pdf';
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => printWindow.print());
      }
      // Revoke after giving the new window time to load
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (e) {
      console.error('[handlePrint] failed:', e);
      window.print();
    }
  }, [pdfDataUrl]);

  const handleShare = useCallback(async () => {
    if (!patientInfo?.phone) {
      toast.info('No patient phone number available');
      return;
    }
    if (!pdfDataUrl) {
      toast.error('PDF is still generating, please wait...');
      return;
    }
    if (sharingWhatsapp) return;

    setSharingWhatsapp(true);
    const toastId = toast.loading('Uploading prescription PDF...');
    try {
      // 1) Upload PDF to backend → get public URL
      const nameForFile = patientInfo.name?.replace(/\s+/g, '_') || 'Patient';
      const uploadResp = await whatsappApi.uploadPrescriptionPdf({
        pdfBase64: pdfDataUrl,
        filename: `Prescription_${nameForFile}.pdf`,
      });
      const publicUrl = uploadResp.data?.url;
      if (!publicUrl) throw new Error('Upload did not return a URL');

      // 2) Open api.whatsapp.com/send — same flow as eka.care
      const phone = patientInfo.phone.replace(/\D/g, '');
      const fullPhone = phone.length === 10 ? `91${phone}` : phone;
      const patientName = patientInfo.name || 'Patient';

      const message =
        `Your Prescription Are In!\n\n` +
        `Hello ${patientName},\n\n` +
        `Your Prescription results are available for review. Please find the PDF file attached to access your results:\n` +
        `${publicUrl}\n\n` +
        `Please feel free to reach us if you have any questions or need further assistance.\n\n` +
        `Best regards,\nAgentQure Team`;

      window.open(
        `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`,
        '_blank',
      );

      toast.success('WhatsApp opened — send the message to share', { id: toastId });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      toast.error(msg || 'Failed to share via WhatsApp', { id: toastId });
    } finally {
      setSharingWhatsapp(false);
    }
  }, [patientInfo, pdfDataUrl, sharingWhatsapp]);

  const handleEditPrescription = useCallback(() => {
    if (!patientId || !prescriptionData) return;
    // Map PrescriptionPdfData back to PrescriptionState shape for loadPrescription
    navigate(`/visit-details/${patientId}`, {
      state: {
        isEditing: true,
        prescriptionData: {
          prescriptionId,
          vitals: prescriptionData.vitals,
          symptoms: prescriptionData.symptoms,
          diagnoses: prescriptionData.diagnoses,
          examinationFindings: prescriptionData.examinationFindings,
          medications: prescriptionData.medications,
          labInvestigations: prescriptionData.labInvestigations,
          labResults: prescriptionData.labResults,
          procedures: prescriptionData.procedures,
          followUp: prescriptionData.followUp,
          referral: prescriptionData.referral,
          advice: prescriptionData.advice,
          surgicalNotes: prescriptionData.notes?.surgicalNotes || '',
          privateNotes: prescriptionData.notes?.privateNotes || '',
          customSections: prescriptionData.customSections,
          medicalConditions: prescriptionData.medicalConditions,
          noRelevantHistory: prescriptionData.noRelevantHistory,
        },
      },
    });
  }, [patientId, prescriptionId, prescriptionData, navigate]);

  // Save current prescription as a reusable main template
  const handleSaveAsTemplate = useCallback(async () => {
    const name = tmplName.trim();
    if (!name) { toast.error('Please enter a template name'); return; }
    if (!prescriptionData) { toast.error('No prescription data to save'); return; }
    setSavingTmpl(true);
    try {
      await templatesApi.createTemplate({
        organization_id: DEV_ORG,
        branch_id: DEV_BRANCH,
        doctor_id: DEV_DOCTOR,
        name,
        type: 'main',
        items: [prescriptionData as unknown as Record<string, unknown>],
        created_by: DEV_DOCTOR,
        updated_by: DEV_DOCTOR,
      });
      toast.success(`Template "${name}" saved`);
      setSaveTmplOpen(false);
      setTmplName('');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : undefined;
      toast.error(msg || 'Failed to save template');
    } finally {
      setSavingTmpl(false);
    }
  }, [tmplName, prescriptionData]);

  const loadTemplates = useCallback(async () => {
    setLoadingTmpls(true);
    try {
      const res = await templatesApi.getMainTemplates({
        organization_id: DEV_ORG,
        branch_id: DEV_BRANCH,
      });
      const data = res.data as unknown;
      const list = Array.isArray(data)
        ? (data as PrescriptionTemplate[])
        : (data && typeof data === 'object' && 'templates' in data)
          ? (data as { templates: PrescriptionTemplate[] }).templates
          : [];
      setExistingTemplates(list);
    } catch {
      toast.error('Failed to load templates');
      setExistingTemplates([]);
    } finally {
      setLoadingTmpls(false);
    }
  }, []);

  // Open "Edit Existing" dialog — fetch user's main templates
  const handleOpenEditExisting = useCallback(() => {
    setEditTmplOpen(true);
    setEditSearch('');
    setEditVisibleCount(EDIT_PAGE_SIZE);
    setEditingId(null);
    setEditingName('');
    loadTemplates();
  }, [loadTemplates]);

  // Begin inline editing (rename)
  const handleStartRename = useCallback((tmpl: PrescriptionTemplate) => {
    setEditingId(tmpl.templateId);
    setEditingName(tmpl.name);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditingName('');
  }, []);

  const handleSaveRename = useCallback(async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) { toast.error('Name cannot be empty'); return; }
    setSavingRename(true);
    try {
      await templatesApi.updateTemplate({
        template_id: editingId, name, type: 'main',
        organization_id: DEV_ORG, branch_id: DEV_BRANCH, updated_by: DEV_DOCTOR,
      });
      toast.success('Template renamed');
      setEditingId(null);
      setEditingName('');
      await loadTemplates();
    } catch {
      toast.error('Failed to rename template');
    } finally {
      setSavingRename(false);
    }
  }, [editingId, editingName, loadTemplates]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    setDeletingId(templateId);
    try {
      await templatesApi.deleteTemplate({
        organization_id: DEV_ORG, branch_id: DEV_BRANCH,
        template_id: templateId, template_type: 'main',
      });
      toast.success('Template deleted');
      await loadTemplates();
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  }, [loadTemplates]);

  // Client-side search + pagination for Edit dialog
  const filteredEditTemplates = useMemo(() => {
    if (!editSearch.trim()) return existingTemplates;
    const q = editSearch.toLowerCase();
    return existingTemplates.filter(t => t.name.toLowerCase().includes(q));
  }, [existingTemplates, editSearch]);

  const visibleEditTemplates = useMemo(
    () => filteredEditTemplates.slice(0, editVisibleCount),
    [filteredEditTemplates, editVisibleCount],
  );

  const pdfData = useMemo(() => prescriptionData || null, [prescriptionData]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f1f5f9' }}>
      {/* ── Top Bar ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0D7C66 0%, #17B890 100%)',
          px: 3, py: 1.5,
          display: 'flex', alignItems: 'center', gap: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Tooltip title="Back to Queue">
          <IconButton onClick={() => navigate('/')} sx={{ color: '#fff' }}>
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <CheckCircleIcon sx={{ color: '#a5d6a7', fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#fff">
            Prescription Saved Successfully
          </Typography>
          {prescriptionId && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              ID: {prescriptionId}
            </Typography>
          )}
        </Box>
        {patientInfo && (
          <Chip
            icon={<PersonIcon />}
            label={`${patientInfo.name} • ${patientInfo.age} • ${patientInfo.gender}`}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
          />
        )}
      </Box>

      {/* ── Main Content ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Grid container spacing={3}>
          {/* Left: Action Cards */}
          <Grid size={{ xs: 12, md: pdfFullscreen ? 0 : 4 }} sx={{ display: pdfFullscreen ? 'none' : 'block' }}>
            <MotionBox
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Quick Actions */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: '#475569' }}>
                QUICK ACTIONS
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <ActionCard
                  icon={<DownloadIcon sx={{ fontSize: 28, color: '#1976d2' }} />}
                  title="Download PDF"
                  subtitle="Save prescription as PDF file"
                  onClick={handleDownload}
                  variant="primary"
                />
                <ActionCard
                  icon={<PrintIcon sx={{ fontSize: 28, color: '#7b1fa2' }} />}
                  title="Print Prescription"
                  subtitle="Send to connected printer"
                  onClick={handlePrint}
                />
                <ActionCard
                  icon={<WhatsAppIcon sx={{ fontSize: 28, color: '#25D366' }} />}
                  title={sharingWhatsapp ? 'Sending on WhatsApp...' : 'Share via WhatsApp'}
                  subtitle={patientInfo?.phone ? `Send to ${patientInfo.phone}` : 'No phone available'}
                  onClick={handleShare}
                />
                <ActionCard
                  icon={<PaymentIcon sx={{ fontSize: 28, color: '#ed6c02' }} />}
                  title="Collect Payment"
                  subtitle="Open billing for this visit"
                  onClick={() => navigate('/payments')}
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5, color: '#475569' }}>
                  NAVIGATION
                </Typography>

                <Tooltip title="Back to Queue">
                  <IconButton
                    onClick={() => navigate('/')}
                    sx={{
                      alignSelf: 'flex-start',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {patientId && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      startIcon={<EditIcon />}
                      onClick={handleEditPrescription}
                      sx={{ justifyContent: 'flex-start', py: 1, fontWeight: 600 }}
                      disabled={!prescriptionData}
                    >
                      Edit Prescription
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/visit-details/${patientId}`)}
                      sx={{ justifyContent: 'flex-start', py: 1 }}
                    >
                      New Prescription
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="success"
                      startIcon={<BookmarkAddIcon />}
                      onClick={() => setSaveTmplOpen(true)}
                      sx={{ justifyContent: 'flex-start', py: 1 }}
                      disabled={!prescriptionData}
                    >
                      Save as Template
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="info"
                      startIcon={<PlaylistPlayIcon />}
                      onClick={handleOpenEditExisting}
                      sx={{ justifyContent: 'flex-start', py: 1 }}
                    >
                      Edit Existing
                    </Button>
                  </>
                )}
              </Box>
            </MotionBox>
          </Grid>

          {/* Right: PDF Preview */}
          <Grid size={{ xs: 12, md: pdfFullscreen ? 12 : 8 }}>
            <MotionBox
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#475569' }}>
                  PRESCRIPTION PDF PREVIEW
                </Typography>
                <Tooltip title={pdfFullscreen ? 'Exit fullscreen' : 'Fullscreen preview'}>
                  <IconButton size="small" onClick={() => setPdfFullscreen(f => !f)}>
                    {pdfFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </IconButton>
                </Tooltip>
              </Box>

              <Paper
                elevation={3}
                sx={{
                  height: pdfFullscreen ? 'calc(100vh - 200px)' : 600,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: '#525659',
                }}
              >
                {pdfData ? (
                  <PrescriptionPdf
                    data={pdfData}
                    patientInfo={patientInfo}
                    dropdownOptions={dropdownOptions}
                    printSettings={printSettings}
                    language={language}
                    onPdfReady={handlePdfReady}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="grey.400">
                      No prescription data available for preview
                    </Typography>
                  </Box>
                )}
              </Paper>
            </MotionBox>
          </Grid>
        </Grid>
      </Box>

      {/* Save as Template dialog */}
      <Dialog open={saveTmplOpen} onClose={() => !savingTmpl && setSaveTmplOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Save as Template</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Save this prescription as a reusable template.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Template name"
            value={tmplName}
            onChange={(e) => setTmplName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !savingTmpl) handleSaveAsTemplate(); }}
            disabled={savingTmpl}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSaveTmplOpen(false)} color="inherit" disabled={savingTmpl}>Cancel</Button>
          <Button
            onClick={handleSaveAsTemplate}
            variant="contained"
            disabled={savingTmpl || !tmplName.trim()}
            startIcon={savingTmpl ? <CircularProgress size={16} /> : <BookmarkAddIcon />}
          >
            {savingTmpl ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Existing Templates dialog — rename / delete only (no apply) */}
      <Dialog open={editTmplOpen} onClose={() => setEditTmplOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Templates
          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 400 }}>
            Rename or delete saved templates. To apply a template, use the Templates dropdown in the prescription pad.
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, minHeight: 280 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search templates..."
            value={editSearch}
            onChange={(e) => { setEditSearch(e.target.value); setEditVisibleCount(EDIT_PAGE_SIZE); }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />

          {loadingTmpls ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : filteredEditTemplates.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
              <Typography color="text.secondary" variant="body2">
                {editSearch ? 'No matching templates' : 'No saved templates yet. Use "Save as Template" to create one.'}
              </Typography>
            </Box>
          ) : (
            <>
              <List dense disablePadding>
                {visibleEditTemplates.map((tmpl) => {
                  const isEditing = editingId === tmpl.templateId;
                  const isDeleting = deletingId === tmpl.templateId;
                  return (
                    <ListItem
                      key={tmpl.templateId}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: isEditing ? 'action.hover' : 'background.paper',
                      }}
                      secondaryAction={
                        isEditing ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Save">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={handleSaveRename}
                                  disabled={savingRename || !editingName.trim()}
                                >
                                  {savingRename ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" onClick={handleCancelRename} disabled={savingRename}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Rename">
                              <IconButton size="small" onClick={() => handleStartRename(tmpl)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteTemplate(tmpl.templateId)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? <CircularProgress size={16} /> : <DeleteOutlineIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        )
                      }
                    >
                      {isEditing ? (
                        <TextField
                          size="small"
                          fullWidth
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !savingRename) handleSaveRename();
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          disabled={savingRename}
                          sx={{ mr: 10 }}
                        />
                      ) : (
                        <ListItemText
                          primary={tmpl.name}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      )}
                    </ListItem>
                  );
                })}
              </List>
              {editVisibleCount < filteredEditTemplates.length && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setEditVisibleCount(c => c + EDIT_PAGE_SIZE)}
                    sx={{ fontWeight: 600 }}
                  >
                    Show More ({filteredEditTemplates.length - editVisibleCount} more)
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditTmplOpen(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Action Card component ──
function ActionCard({
  icon, title, subtitle, onClick, variant,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  variant?: 'primary';
}) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 4,
          borderColor: variant === 'primary' ? '#1976d2' : '#90caf9',
          transform: 'translateY(-1px)',
        },
        ...(variant === 'primary' && {
          borderColor: '#1976d2',
          bgcolor: '#e3f2fd',
        }),
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {icon}
        <Box>
          <Typography variant="body2" fontWeight={600}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
