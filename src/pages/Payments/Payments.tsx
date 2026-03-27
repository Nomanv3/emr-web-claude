import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { paymentApi } from '@/services/api';
import PaymentStatsCards from './components/PaymentStatsCards';
import PaymentTable from './components/PaymentTable';
import CollectPaymentDialog from './components/CollectPaymentDialog';
import InvoiceDetailDialog from './components/InvoiceDetailDialog';
import PaymentHistoryDialog from './components/PaymentHistoryDialog';
import ReceiptDialog from './components/ReceiptDialog';
import type { Payment, PaymentMethod } from '@/types';

const MotionBox = motion.create(Box);

export default function Payments() {
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectInvoiceId, setCollectInvoiceId] = useState<string | undefined>();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyInvoiceId, setHistoryInvoiceId] = useState<string | null>(null);
  const [historyInvoiceTotal, setHistoryInvoiceTotal] = useState<number | undefined>();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: paymentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentApi.getPayments({ organizationId: 'org-001' }),
  });

  const payments = (paymentsData?.data as Payment[]) ?? [];

  const filteredPayments = useMemo(() => {
    let filtered = payments;
    if (methodFilter !== 'all') {
      filtered = filtered.filter((p) => p.method === methodFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.invoiceId?.toLowerCase().includes(q) ||
          p.receiptId?.toLowerCase().includes(q) ||
          p.collectedBy?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [payments, methodFilter, searchQuery]);

  const handleRowClick = (payment: Payment) => {
    setSelectedInvoiceId(payment.invoiceId);
    setInvoiceDialogOpen(true);
  };

  const handleViewReceipt = (payment: Payment) => {
    setReceiptPayment(payment);
    setReceiptOpen(true);
  };

  const handleViewInvoice = (payment: Payment) => {
    setSelectedInvoiceId(payment.invoiceId);
    setInvoiceDialogOpen(true);
  };

  const handleViewHistory = (payment: Payment) => {
    setHistoryInvoiceId(payment.invoiceId);
    setHistoryOpen(true);
  };

  const handleCollectFromInvoice = (invoiceId: string) => {
    setInvoiceDialogOpen(false);
    setCollectInvoiceId(invoiceId);
    setCollectOpen(true);
  };

  const handleViewHistoryFromInvoice = (invoiceId: string, total: number) => {
    setInvoiceDialogOpen(false);
    setHistoryInvoiceId(invoiceId);
    setHistoryInvoiceTotal(total);
    setHistoryOpen(true);
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Payments
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage invoices, collect payments, and generate receipts
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={() => {
              setCollectInvoiceId(undefined);
              setCollectOpen(true);
            }}
          >
            Collect Payment
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 3 }}>
        <PaymentStatsCards payments={payments} isLoading={isLoading} />
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by invoice, receipt, or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ minWidth: 280 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          label="Payment Method"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All Methods</MenuItem>
          {(['Cash', 'Card', 'Online', 'UPI'] as PaymentMethod[]).map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </TextField>
      </Paper>

      {/* Payment Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <PaymentTable
          payments={filteredPayments}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          onViewReceipt={handleViewReceipt}
          onViewInvoice={handleViewInvoice}
          onViewHistory={handleViewHistory}
        />
      </motion.div>

      {/* Dialogs */}
      <CollectPaymentDialog
        open={collectOpen}
        onClose={() => {
          setCollectOpen(false);
          setCollectInvoiceId(undefined);
        }}
        prefillInvoiceId={collectInvoiceId}
      />

      <InvoiceDetailDialog
        open={invoiceDialogOpen}
        onClose={() => {
          setInvoiceDialogOpen(false);
          setSelectedInvoiceId(null);
        }}
        invoiceId={selectedInvoiceId}
        onCollectPayment={handleCollectFromInvoice}
        onViewHistory={handleViewHistoryFromInvoice}
      />

      <PaymentHistoryDialog
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryInvoiceId(null);
          setHistoryInvoiceTotal(undefined);
        }}
        invoiceId={historyInvoiceId}
        invoiceTotal={historyInvoiceTotal}
      />

      <ReceiptDialog
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setReceiptPayment(null);
        }}
        payment={receiptPayment}
      />
    </MotionBox>
  );
}
