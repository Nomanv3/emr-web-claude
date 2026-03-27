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
  Divider,
  Chip,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '@/services/api';
import type { Invoice, InvoiceStatus } from '@/types';

interface InvoiceDetailDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string | null;
  onCollectPayment?: (invoiceId: string) => void;
  onViewHistory?: (invoiceId: string, total: number) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

const statusColorMap: Record<InvoiceStatus, 'success' | 'warning' | 'error'> = {
  Paid: 'success',
  Partial: 'warning',
  Unpaid: 'error',
};

export default function InvoiceDetailDialog({
  open,
  onClose,
  invoiceId,
  onCollectPayment,
  onViewHistory,
}: InvoiceDetailDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoiceApi.getInvoice(invoiceId!),
    enabled: !!invoiceId && open,
  });

  const invoice: Invoice | undefined = data?.data;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>
          Invoice Details
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Stack spacing={2}>
            <Skeleton height={40} />
            <Skeleton height={200} />
            <Skeleton height={80} />
          </Stack>
        ) : !invoice ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Invoice not found
          </Typography>
        ) : (
          <Stack spacing={3}>
            {/* Invoice header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Invoice ID
                </Typography>
                <Typography fontFamily="monospace" fontWeight={600}>
                  {invoice.invoiceId.slice(0, 16)}
                </Typography>
              </Box>
              <Chip
                label={invoice.status}
                color={statusColorMap[invoice.status]}
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              Created: {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Typography>

            {/* Line items table */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600, backgroundColor: '#F5F7FA' } }}>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.lineItems.map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.discount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            {/* Totals */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(invoice.subtotal)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" color="text.secondary">Discount</Typography>
                <Typography variant="body2" fontWeight={500} color="success.main">
                  -{formatCurrency(invoice.discount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" color="text.secondary">Tax</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(invoice.tax)}
                </Typography>
              </Box>
              <Divider sx={{ width: 200, my: 0.5 }} />
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography fontWeight={600}>Total</Typography>
                <Typography fontWeight={700}>
                  {formatCurrency(invoice.totalAmount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" color="text.secondary">Paid</Typography>
                <Typography variant="body2" fontWeight={500} color="success.main">
                  {formatCurrency(invoice.paidAmount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" color="text.secondary">Balance Due</Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={invoice.balanceDue > 0 ? 'error.main' : 'success.main'}
                >
                  {formatCurrency(invoice.balanceDue)}
                </Typography>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {invoice && onViewHistory && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<HistoryIcon />}
              onClick={() => onViewHistory(invoice.invoiceId, invoice.totalAmount)}
            >
              Payment History
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            disabled={!invoice}
          >
            Print
          </Button>
          {invoice && invoice.balanceDue > 0 && onCollectPayment && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => onCollectPayment(invoice.invoiceId)}
            >
              Collect Payment
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
