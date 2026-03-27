import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Divider,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  CurrencyRupee as RupeeIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import type { PaymentEntry, PaymentMethod } from '@/types';

interface PaymentCollectionSectionProps {
  totalAmount: number;
  paymentEntries: PaymentEntry[];
  onAddEntry: (entry: PaymentEntry) => void;
  onRemoveEntry: (index: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  isComplete: boolean;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Online', label: 'Online' },
];

export default function PaymentCollectionSection({
  totalAmount,
  paymentEntries,
  onAddEntry,
  onRemoveEntry,
  onConfirm,
  onClose,
  isComplete,
}: PaymentCollectionSectionProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('Cash');
  const [amount, setAmount] = useState('');

  const totalPaid = paymentEntries.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalAmount - totalPaid;

  const handleAdd = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    onAddEntry({ method: paymentMode, amount: amt });
    setAmount('');
  };

  return (
    <Box sx={{ px: 3, py: 2, bgcolor: (t) => alpha(t.palette.success.main, 0.04), borderTop: 1, borderColor: 'divider' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Collect Payment
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Total & Balance */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip
          icon={<RupeeIcon sx={{ fontSize: '0.85rem !important' }} />}
          label={`Total: ₹${totalAmount.toLocaleString('en-IN')}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
        {totalPaid > 0 && (
          <Chip
            label={`Paid: ₹${totalPaid.toLocaleString('en-IN')}`}
            size="small"
            color="success"
            sx={{ fontWeight: 700 }}
          />
        )}
        <Chip
          label={`Balance: ₹${balance.toLocaleString('en-IN')}`}
          size="small"
          color={balance <= 0 ? 'success' : 'error'}
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {/* Payment mode selector */}
      {!isComplete && (
        <>
          <RadioGroup
            row
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as PaymentMethod)}
            sx={{ mb: 1.5 }}
          >
            {PAYMENT_METHODS.map((m) => (
              <FormControlLabel
                key={m.value}
                value={m.value}
                control={<Radio size="small" />}
                label={<Typography variant="body2">{m.label}</Typography>}
                sx={{ mr: 2 }}
              />
            ))}
          </RadioGroup>

          {/* Amount input + Add */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <TextField
              size="small"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                },
              }}
              sx={{ flex: 1 }}
            />
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAdd}>
              Add
            </Button>
          </Box>
        </>
      )}

      {/* Payment entries */}
      {paymentEntries.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {paymentEntries.map((entry, i) => (
            <Chip
              key={i}
              label={`${entry.method}: ₹${entry.amount.toLocaleString('en-IN')}`}
              size="small"
              color="primary"
              variant="outlined"
              onDelete={isComplete ? undefined : () => onRemoveEntry(i)}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Confirm button */}
      {!isComplete && (
        <Button
          variant="contained"
          color="success"
          size="small"
          fullWidth
          onClick={onConfirm}
          disabled={paymentEntries.length === 0}
        >
          Confirm Payment
        </Button>
      )}
      {isComplete && (
        <Typography variant="body2" color="success.main" fontWeight={600} textAlign="center">
          Payment confirmed
        </Typography>
      )}
    </Box>
  );
}
