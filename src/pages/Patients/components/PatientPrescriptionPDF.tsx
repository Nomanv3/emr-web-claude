/**
 * PatientPrescriptionPDF — Dialog that renders a pdfmake PDF preview of a historical
 * prescription. Opens from PrescriptionHistoryTab when user clicks "View PDF".
 */
import { useMemo, useCallback, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, IconButton, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { toast } from 'sonner';
import PrescriptionPdf, { downloadPdfFromUrl } from '@/pages/Prescription/components/PrescriptionPdf';
import type { PrescriptionPdfData } from '@/pages/Prescription/components/PrescriptionPdf';
import type { Prescription } from '@/types';

interface PatientPrescriptionPDFProps {
  prescription: Prescription;
  open: boolean;
  onClose: () => void;
}

export default function PatientPrescriptionPDF({ prescription, open, onClose }: PatientPrescriptionPDFProps) {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  const pdfData: PrescriptionPdfData = useMemo(() => ({
    vitals: prescription.vitals || {},
    symptoms: prescription.symptoms || [],
    diagnoses: prescription.diagnoses || [],
    examinationFindings: prescription.examinationFindings || [],
    medications: prescription.medications || [],
    labInvestigations: prescription.labInvestigations || [],
    labResults: prescription.labResults || [],
    procedures: prescription.procedures || [],
    followUp: prescription.followUp || null,
    referral: prescription.referral || null,
    advice: prescription.advice || '',
    notes: { surgicalNotes: prescription.notes?.surgicalNotes || '', privateNotes: prescription.notes?.privateNotes || '' },
    customSections: prescription.customSections || [],
    medicalConditions: [],
    noRelevantHistory: false,
  }), [prescription]);

  const patientInfo = useMemo(() => {
    if (!prescription.patientId) return null;
    // Try to extract patient info from the prescription if available
    const raw = prescription as unknown as Record<string, unknown>;
    const patientData = raw.patient as Record<string, unknown> | undefined;
    if (patientData) {
      return {
        name: (patientData.name || patientData.fullName || '') as string,
        age: (patientData.age || patientData.ageDisplay || '') as string,
        gender: (patientData.gender || patientData.genderDisplay || '') as string,
        phone: (patientData.phone || patientData.phoneDisplay || '') as string,
        address: (patientData.address || '') as string,
      };
    }
    return null;
  }, [prescription]);

  const handlePdfReady = useCallback((dataUrl: string) => {
    setPdfDataUrl(dataUrl);
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfDataUrl) {
      toast.error('PDF is still generating...');
      return;
    }
    const date = prescription.visitDate
      ? new Date(prescription.visitDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    downloadPdfFromUrl(pdfDataUrl, `Prescription_${date}.pdf`);
    toast.success('PDF downloaded');
  }, [pdfDataUrl, prescription.visitDate]);

  const handlePrint = useCallback(() => {
    if (pdfDataUrl) {
      const printWindow = window.open(pdfDataUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => printWindow.print());
      }
    }
  }, [pdfDataUrl]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, height: '85vh', maxHeight: '85vh' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>Prescription PDF</Typography>
          <Typography variant="caption" color="text.secondary">
            {prescription.visitDate
              ? new Date(prescription.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Date not available'
            }
            {prescription.prescriptionId && ` | ID: ${prescription.prescriptionId}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          bgcolor: '#525659',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flex: 1, p: 2 }}>
          <PrescriptionPdf
            data={pdfData}
            patientInfo={patientInfo}
            onPdfReady={handlePdfReady}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
        <Tooltip title="Print prescription">
          <Button
            startIcon={<PrintIcon />}
            variant="outlined"
            size="small"
            onClick={handlePrint}
            disabled={!pdfDataUrl}
          >
            Print
          </Button>
        </Tooltip>
        <Tooltip title="Download PDF">
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="small"
            onClick={handleDownload}
            disabled={!pdfDataUrl}
          >
            Download
          </Button>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="contained" size="small">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
