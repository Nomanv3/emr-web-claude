import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Badge,
  CircularProgress,
  Skeleton,
  Collapse,
  InputAdornment,
  Paper,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  MedicalServices as ServiceIcon,
  Add as AddIcon,
  ChevronRight as ChevronRightIcon,
  LocalHospital as HospitalIcon,
  CurrencyRupee as RupeeIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import { mastersApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { MasterService, ServiceDetail, PaymentEntry, PaymentMethod, PaymentSummary } from '@/types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Online', label: 'Online' },
];

interface ServiceSelectionProps {
  selectedServices: ServiceDetail[];
  onChange: (services: ServiceDetail[], paymentData?: PaymentSummary) => void;
  showPayment?: boolean;
  paymentSummary?: PaymentSummary | null;
  onPaymentUpdate?: (data: PaymentSummary) => void;
}

export default function ServiceSelection({
  selectedServices,
  onChange,
  paymentSummary,
  onPaymentUpdate,
}: ServiceSelectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [localSelected, setLocalSelected] = useState<ServiceDetail[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Payment state
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('Cash');
  const [paymentAmount, setPaymentAmount] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((val: string) => setDebouncedSearch(val), 400),
    [],
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSetSearch(value);
  };

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services-search', debouncedSearch, user?.organizationId],
    queryFn: () =>
      mastersApi.searchServices({
        organizationId: user?.organizationId ?? '',
        search: debouncedSearch || undefined,
      }),
    enabled: dialogOpen,
  });

  const services: MasterService[] = servicesData?.data ?? [];

  const createServiceMutation = useMutation({
    mutationFn: (data: { name: string; price: number; description?: string; organizationId?: string }) =>
      mastersApi.createService(data),
    onSuccess: (result) => {
      toast.success('Service created successfully');
      queryClient.invalidateQueries({ queryKey: ['services-search'] });
      const newService = result.data?.service;
      if (newService) {
        const detail: ServiceDetail = { service: newService, price: newService.defaultPrice };
        setLocalSelected((prev) => [...prev, detail]);
      }
      setAddDialogOpen(false);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDesc('');
    },
    onError: () => {
      toast.error('Failed to create service');
    },
  });

  const totalAmount = useMemo(
    () => selectedServices.reduce((sum, d) => sum + (Number(d.price) || 0), 0),
    [selectedServices],
  );

  const localTotalAmount = useMemo(
    () => localSelected.reduce((sum, d) => sum + (Number(d.price) || 0), 0),
    [localSelected],
  );

  const localTotalPaid = useMemo(
    () => paymentEntries.reduce((s, e) => s + e.amount, 0),
    [paymentEntries],
  );

  const localBalance = localTotalAmount - localTotalPaid;

  const isSelected = (serviceId: string) =>
    localSelected.some((s) => s.service.serviceId === serviceId);

  const handleToggleService = (service: MasterService) => {
    setLocalSelected((prev) => {
      const exists = prev.find((s) => s.service.serviceId === service.serviceId);
      if (exists) {
        return prev.filter((s) => s.service.serviceId !== service.serviceId);
      }
      return [...prev, { service, price: service.defaultPrice }];
    });
    // Reset payment when services change
    setPaymentEntries([]);
    setIsPaymentComplete(false);
    setShowPaymentSection(false);
    setPaymentAmount('');
  };

  const handleOpenDialog = () => {
    setLocalSelected([...selectedServices]);
    setSearchQuery('');
    setDebouncedSearch('');
    // Restore payment state from parent if available
    if (paymentSummary && paymentSummary.entries.length > 0) {
      setPaymentEntries([...paymentSummary.entries]);
      setIsPaymentComplete(true);
      setShowPaymentSection(true);
    } else {
      setPaymentEntries([]);
      setIsPaymentComplete(false);
      setShowPaymentSection(false);
    }
    setPaymentAmount('');
    setPaymentMode('Cash');
    setDialogOpen(true);
  };

  const handleConfirmSelection = () => {
    if (paymentEntries.length > 0) {
      const totalPaid = paymentEntries.reduce((s, e) => s + e.amount, 0);
      const summary: PaymentSummary = {
        entries: paymentEntries.filter((e) => e.amount > 0),
        totalPaid,
        balance: localTotalAmount - totalPaid,
      };
      onChange(localSelected, summary);
      onPaymentUpdate?.(summary);
    } else {
      onChange(localSelected);
    }
    setDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleAddNewService = () => {
    if (!newServiceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    createServiceMutation.mutate({
      name: newServiceName.trim(),
      price: Number(newServicePrice) || 0,
      description: newServiceDesc.trim() || undefined,
      organizationId: user?.organizationId ?? '',
    });
  };

  // Payment handlers
  const handleAddPayment = () => {
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setPaymentEntries((prev) => [...prev, { method: paymentMode, amount: amt }]);
    setPaymentAmount('');
    setIsPaymentComplete(false);
  };

  const handleRemovePayment = (index: number) => {
    setPaymentEntries((prev) => prev.filter((_, i) => i !== index));
    setIsPaymentComplete(false);
  };

  const handleConfirmPayment = () => {
    const validEntries = paymentEntries.filter((e) => e.amount > 0);
    if (validEntries.length === 0) {
      toast.error('Add at least one payment');
      return;
    }
    setIsPaymentComplete(true);
    toast.success('Payment confirmed');
  };

  const handleModifyPayment = () => {
    setIsPaymentComplete(false);
  };

  // Determine if trigger should show payment summary
  const hasPayment = paymentSummary && paymentSummary.entries.length > 0;

  return (
    <>
      {/* Trigger Field */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Services
        </Typography>

        {selectedServices.length === 0 ? (
          <Paper
            variant="outlined"
            onClick={handleOpenDialog}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderStyle: 'dashed',
              borderColor: 'divider',
              '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.02) },
              transition: 'all 0.2s',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ServiceIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Select services
              </Typography>
            </Box>
            <ChevronRightIcon fontSize="small" color="action" />
          </Paper>
        ) : hasPayment ? (
          /* Summary card with payment info */
          <Paper
            variant="outlined"
            onClick={handleOpenDialog}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              borderColor: 'success.light',
              '&:hover': { borderColor: 'success.main', bgcolor: (t) => alpha(t.palette.success.main, 0.02) },
              transition: 'all 0.2s',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={selectedServices.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
                  <ServiceIcon fontSize="small" color="primary" />
                </Badge>
                <Typography variant="body2" fontWeight={600}>
                  {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
                </Typography>
              </Box>
              <Chip
                icon={<RupeeIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={totalAmount.toLocaleString('en-IN')}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Box>
            {/* Service chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {selectedServices.map((sd) => (
                <Chip
                  key={sd.service.serviceId}
                  label={`${sd.service.name} — ₹${sd.price}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
              ))}
            </Box>
            {/* Payment status chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              <Chip
                label={`Paid: ₹${paymentSummary!.totalPaid.toLocaleString('en-IN')}`}
                size="small"
                color="success"
                sx={{ fontWeight: 700, fontSize: '0.7rem', height: 24 }}
              />
              {paymentSummary!.balance > 0 && (
                <Chip
                  label={`Balance: ₹${paymentSummary!.balance.toLocaleString('en-IN')}`}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.7rem', height: 24 }}
                />
              )}
              {paymentSummary!.entries.map((e, i) => (
                <Chip
                  key={i}
                  label={`${e.method}: ₹${e.amount.toLocaleString('en-IN')}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 22 }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
              Click to modify
            </Typography>
          </Paper>
        ) : (
          /* Services selected, no payment */
          <Paper
            variant="outlined"
            onClick={handleOpenDialog}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.02) },
              transition: 'all 0.2s',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={selectedServices.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
                  <ServiceIcon fontSize="small" color="primary" />
                </Badge>
                <Typography variant="body2" fontWeight={600}>
                  {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                </Typography>
              </Box>
              <Chip
                icon={<RupeeIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={totalAmount.toLocaleString('en-IN')}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {selectedServices.map((sd) => (
                <Chip
                  key={sd.service.serviceId}
                  label={`${sd.service.name} - ₹${sd.price}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Click to modify
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Service Search Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Gradient Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0D7C66 0%, #17B890 100%)',
            px: 3,
            pt: 2.5,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
              Select Services
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&::placeholder': { color: 'rgba(255,255,255,0.5)' },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.5)', opacity: 1 },
                },
              },
            }}
            size="small"
          />
        </Box>

        {/* Selected Services Summary + Collect Payment button */}
        {localSelected.length > 0 && (
          <Box sx={{ px: 3, py: 1.5, bgcolor: (t) => alpha(t.palette.success.main, 0.06), borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight={600} color="success.dark">
                {localSelected.length} selected
              </Typography>
              <Chip
                icon={<RupeeIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={localTotalAmount.toLocaleString('en-IN')}
                size="small"
                color="success"
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {localSelected.map((sd) => (
                <Chip
                  key={sd.service.serviceId}
                  label={sd.service.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={() => handleToggleService(sd.service)}
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
              ))}
            </Box>

            {/* Collect Payment Button — always visible when services selected */}
            {!showPaymentSection && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                startIcon={<PaymentIcon />}
                onClick={() => setShowPaymentSection(true)}
                sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700 }}
              >
                Collect Payment — ₹{localTotalAmount.toLocaleString('en-IN')}
              </Button>
            )}
          </Box>
        )}

        {/* Inline Payment Section — shows right below selected services */}
        {localSelected.length > 0 && showPaymentSection && (
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => alpha(t.palette.warning.main, 0.04), borderBottom: 1, borderColor: 'divider' }}>
            {/* Payment Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentIcon fontSize="small" color="success" />
                <Typography variant="subtitle2" fontWeight={700}>
                  Payment Collection
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => { setShowPaymentSection(false); setPaymentEntries([]); setIsPaymentComplete(false); }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Total & Balance chips */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<RupeeIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={`Total: ₹${localTotalAmount.toLocaleString('en-IN')}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              {localTotalPaid > 0 && (
                <Chip
                  label={`Paid: ₹${localTotalPaid.toLocaleString('en-IN')}`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700 }}
                />
              )}
              <Chip
                label={`Balance: ₹${Math.max(0, localBalance).toLocaleString('en-IN')}`}
                size="small"
                color={localBalance <= 0 ? 'primary' : 'error'}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Box>

            {/* Payment entry chips */}
            {paymentEntries.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {paymentEntries.map((entry, i) => (
                  <Chip
                    key={i}
                    label={`${entry.method}: ₹${entry.amount.toLocaleString('en-IN')}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={isPaymentComplete ? undefined : () => handleRemovePayment(i)}
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Box>
            )}

            {/* Payment input — hidden after confirm */}
            {!isPaymentComplete && (
              <>
                {/* Payment method selector */}
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

                {/* Amount input + Add button */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddPayment(); }}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddPayment}
                  >
                    Add
                  </Button>
                </Box>

                {/* Confirm payment button */}
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  fullWidth
                  onClick={handleConfirmPayment}
                  disabled={paymentEntries.length === 0}
                  sx={{ fontWeight: 700 }}
                >
                  Confirm Payment
                </Button>
              </>
            )}

            {/* After payment confirmed */}
            {isPaymentComplete && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="success.main" fontWeight={700}>
                  Payment confirmed
                </Typography>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={handleModifyPayment}
                  sx={{ textTransform: 'none' }}
                >
                  Modify Payment
                </Button>
              </Box>
            )}
          </Box>
        )}

        <DialogContent sx={{ p: 0, minHeight: 300, maxHeight: 400 }}>
          {/* Empty search state */}
          {!debouncedSearch && !isLoading && services.length === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, px: 3 }}>
              <SearchIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                Type to search services
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                Search by name or category
              </Typography>
            </Box>
          )}

          {/* Loading state */}
          {isLoading && (
            <Box sx={{ p: 2 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="60%" height={20} />
                    <Skeleton width="40%" height={16} />
                  </Box>
                  <Skeleton width={60} height={28} variant="rounded" />
                </Box>
              ))}
            </Box>
          )}

          {/* No results */}
          {!isLoading && debouncedSearch && services.length === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, px: 3 }}>
              <HospitalIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                No services found
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, mb: 2 }}>
                Try a different search or add a new service
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setNewServiceName(searchQuery);
                  setAddDialogOpen(true);
                }}
              >
                Add New Service
              </Button>
            </Box>
          )}

          {/* Service list */}
          {!isLoading && services.length > 0 && (
            <List disablePadding>
              {services.map((service, index) => {
                const selected = isSelected(service.serviceId);
                return (
                  <Collapse key={service.serviceId} in timeout={150 + index * 30}>
                    <ListItemButton
                      onClick={() => handleToggleService(service)}
                      sx={{
                        px: 3,
                        py: 1.5,
                        ...(selected && {
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                        }),
                        '&:hover': {
                          bgcolor: (t) => alpha(t.palette.primary.main, selected ? 0.1 : 0.04),
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {selected ? (
                          <CheckIcon color="primary" sx={{ fontSize: 24 }} />
                        ) : (
                          <UncheckedIcon sx={{ fontSize: 24, color: 'action.disabled' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={selected ? 700 : 500}>
                            {service.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {service.category || 'General'}
                            {service.description ? ` — ${service.description}` : ''}
                          </Typography>
                        }
                      />
                      <Chip
                        label={`₹${(service.defaultPrice || 0).toLocaleString('en-IN')}`}
                        size="small"
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, minWidth: 60 }}
                      />
                    </ListItemButton>
                    {index < services.length - 1 && <Divider component="li" />}
                  </Collapse>
                );
              })}
            </List>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add New Service
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmSelection}
              disabled={localSelected.length === 0}
            >
              Confirm ({localSelected.length})
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add New Service Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Add New Service</Typography>
        </Box>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Service Name"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Price"
            value={newServicePrice}
            onChange={(e) => setNewServicePrice(e.target.value.replace(/[^0-9.]/g, ''))}
            type="text"
            fullWidth
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              },
            }}
          />
          <TextField
            label="Description (Optional)"
            value={newServiceDesc}
            onChange={(e) => setNewServiceDesc(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddNewService}
            disabled={createServiceMutation.isPending || !newServiceName.trim()}
          >
            {createServiceMutation.isPending ? <CircularProgress size={20} /> : 'Add Service'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
