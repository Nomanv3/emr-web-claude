import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Skeleton,
  Stack,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/services/api';
import type { Payment, PaymentMethod } from '@/types';

interface PaymentHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string | null;
  invoiceTotal?: number;
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

const methodColorMap: Record<PaymentMethod, 'success' | 'info' | 'secondary' | 'warning'> = {
  Cash: 'success',
  Card: 'info',
  Online: 'secondary',
  UPI: 'warning',
};

export default function PaymentHistoryDialog({
  open,
  onClose,
  invoiceId,
  invoiceTotal,
}: PaymentHistoryDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: () => paymentApi.getPayments({ organizationId: 'org-001' }),
    enabled: !!invoiceId && open,
    select: (result) => {
      const all = (result?.data as Payment[]) ?? [];
      return all.filter((p) => p.invoiceId === invoiceId);
    },
  });

  const payments = data ?? [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoiceTotal != null ? invoiceTotal - totalPaid : undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>
          Payment History
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Stack spacing={1}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={48} />
            ))}
          </Stack>
        ) : payments.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No payments recorded for this invoice.
          </Typography>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Invoice: <strong>{invoiceId?.slice(0, 16)}</strong>
              </Typography>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600, backgroundColor: '#F5F7FA' } }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Receipt #</TableCell>
                    <TableCell>Collected By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.paymentId} hover>
                      <TableCell>{formatDate(payment.collectedAt)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.method}
                          color={methodColorMap[payment.method] ?? 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontFamily="monospace" fontSize="0.85rem">
                          {payment.receiptId?.slice(0, 12) ?? '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{payment.collectedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Paid
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {formatCurrency(totalPaid)}
                </Typography>
              </Box>
              {balance != null && (
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Balance Due
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={balance > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(Math.max(0, balance))}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Transactions
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {payments.length}
                </Typography>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
