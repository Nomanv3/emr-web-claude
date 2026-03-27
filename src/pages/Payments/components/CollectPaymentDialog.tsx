import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  FormControl,
  FormHelperText,
  Stack,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentApi, invoiceApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { PaymentMethod, Invoice } from '@/types';

const schema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.enum(['Cash', 'Card', 'Online', 'UPI'] as const),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CollectPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  prefillInvoiceId?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

const paymentMethods: PaymentMethod[] = ['Cash', 'Card', 'Online', 'UPI'];

export default function CollectPaymentDialog({
  open,
  onClose,
  prefillInvoiceId,
}: CollectPaymentDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceId: prefillInvoiceId ?? '',
      amount: undefined as unknown as number,
      method: 'Cash',
      transactionRef: '',
      notes: '',
    },
  });

  const watchedInvoiceId = watch('invoiceId');
  const watchedMethod = watch('method');

  const { data: invoiceData } = useQuery({
    queryKey: ['invoice', watchedInvoiceId],
    queryFn: () => invoiceApi.getInvoice(watchedInvoiceId),
    enabled: !!watchedInvoiceId && watchedInvoiceId.length > 5 && open,
  });

  const invoice: Invoice | undefined = invoiceData?.data;

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      paymentApi.createPayment({
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        collectedBy: user?.name ?? 'current-user',
      }),
    onSuccess: () => {
      toast.success('Payment collected successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      handleClose();
    },
    onError: () => {
      toast.error('Failed to collect payment');
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: Record<string, unknown>) => {
    mutation.mutate(data as FormData);
  };

  const showTransactionRef = watchedMethod !== 'Cash';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>
          Collect Payment
        </Typography>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Controller
              name="invoiceId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Invoice ID"
                  placeholder="Enter invoice ID"
                  fullWidth
                  required
                  error={!!errors.invoiceId}
                  helperText={errors.invoiceId?.message}
                />
              )}
            />

            {invoice && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: '#F5F7FA',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Invoice Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(invoice.totalAmount)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Paid</Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    {formatCurrency(invoice.paidAmount)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={600}>Balance Due</Typography>
                  <Typography variant="body2" fontWeight={700} color="error.main">
                    {formatCurrency(invoice.balanceDue)}
                  </Typography>
                </Box>
              </Box>
            )}

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Amount"
                  type="number"
                  placeholder="0.00"
                  fullWidth
                  required
                  error={!!errors.amount}
                  helperText={
                    errors.amount?.message ??
                    (invoice ? `Max: ${formatCurrency(invoice.balanceDue)}` : undefined)
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Typography sx={{ mr: 1, color: 'text.secondary' }}>
                          &#8377;
                        </Typography>
                      ),
                    },
                    htmlInput: {
                      min: 0,
                      max: invoice?.balanceDue,
                      step: '0.01',
                    },
                  }}
                />
              )}
            />

            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.method}>
                  <FormLabel sx={{ fontWeight: 500, mb: 1 }}>Payment Method</FormLabel>
                  <RadioGroup row {...field}>
                    {paymentMethods.map((m) => (
                      <FormControlLabel key={m} value={m} control={<Radio />} label={m} />
                    ))}
                  </RadioGroup>
                  {errors.method && <FormHelperText>{errors.method.message}</FormHelperText>}
                </FormControl>
              )}
            />

            {showTransactionRef && (
              <Controller
                name="transactionRef"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Transaction Reference"
                    placeholder="Enter transaction/reference number"
                    fullWidth
                  />
                )}
              />
            )}

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  placeholder="Optional notes"
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Processing...' : 'Collect Payment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
