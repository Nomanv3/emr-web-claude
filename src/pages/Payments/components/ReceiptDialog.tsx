import { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  Divider,
  Stack,
  Skeleton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import type { Payment } from '@/types';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReceiptContent({ payment }: { payment: Payment }) {
  return (
    <Box
      sx={{
        p: 4,
        maxWidth: 400,
        mx: 'auto',
        fontFamily: '"Roboto Mono", monospace',
      }}
    >
      {/* Clinic Header */}
      <Box textAlign="center" mb={3}>
        <Typography variant="h6" fontWeight={700}>
          EMR Clinic
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Healthcare Management System
        </Typography>
        <Divider sx={{ mt: 1.5 }} />
      </Box>

      {/* Receipt Title */}
      <Box textAlign="center" mb={2}>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 2,
            border: '1px solid',
            borderColor: 'divider',
            display: 'inline-block',
            px: 2,
            py: 0.5,
          }}
        >
          Payment Receipt
        </Typography>
      </Box>

      {/* Receipt Details */}
      <Stack spacing={1.5} mb={3}>
        <DetailRow label="Receipt #" value={payment.receiptId?.slice(0, 16) ?? '-'} mono />
        <DetailRow label="Date" value={formatDate(payment.collectedAt)} />
        <DetailRow label="Invoice #" value={payment.invoiceId?.slice(0, 16) ?? '-'} mono />
      </Stack>

      <Divider sx={{ borderStyle: 'dashed', mb: 2 }} />

      {/* Payment Info */}
      <Stack spacing={1.5} mb={3}>
        <DetailRow label="Payment Method" value={payment.method} />
        {payment.transactionRef && (
          <DetailRow label="Transaction Ref" value={payment.transactionRef} mono />
        )}
        <DetailRow label="Collected By" value={payment.collectedBy} />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Amount */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5,
          px: 2,
          backgroundColor: '#F5F7FA',
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Amount Paid
        </Typography>
        <Typography variant="h5" fontWeight={700} color="success.main">
          {formatCurrency(payment.amount)}
        </Typography>
      </Box>

      {/* Footer */}
      <Box textAlign="center" mt={3}>
        <Divider sx={{ mb: 1.5 }} />
        <Typography variant="caption" color="text.secondary">
          Thank you for your payment
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          This is a computer-generated receipt
        </Typography>
      </Box>
    </Box>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={500}
        sx={mono ? { fontFamily: 'monospace', fontSize: '0.85rem' } : undefined}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function ReceiptDialog({ open, onClose, payment }: ReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${payment?.receiptId ?? 'unknown'}`,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>
          Payment Receipt
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!payment ? (
          <Stack spacing={2} py={2}>
            <Skeleton height={40} />
            <Skeleton height={200} />
            <Skeleton height={60} />
          </Stack>
        ) : (
          <Box ref={printRef}>
            <ReceiptContent payment={payment} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handlePrint()}
          disabled={!payment}
        >
          Download
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint()}
          disabled={!payment}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
