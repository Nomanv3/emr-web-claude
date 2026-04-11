import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Typography,
  Box,
  Paper,
  Popper,
  ClickAwayListener,
  CircularProgress,
  Chip,
  Checkbox,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import { patientApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/types';

const toTitleCase = (val: string): string =>
  val.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());

const todayStr = new Date().toISOString().split('T')[0];

const schema = z.object({
  salutation: z.string().min(1, 'Required'),
  name: z
    .string()
    .min(2, 'Name is required')
    .regex(/^[A-Za-z\s.'-]+$/, 'Name can only contain letters'),
  gender: z.enum(['M', 'F', 'Other'] as const, { message: 'Gender is required' }),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => val <= todayStr, { message: 'Date of birth cannot be in the future' }),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RegisterPatientDialogProps {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  initialPhone?: string;
}

// ─── Medical History Types & Defaults ──────────────────────────────
interface MedicalCondition {
  name: string;
  value: 'Y' | 'N' | '-';
  since?: string;
}

const DEFAULT_CONDITIONS: MedicalCondition[] = [
  { name: 'Diabetes mellitus', value: '-' }, { name: 'Hypertension', value: '-' },
  { name: 'Hypothyroidism', value: '-' }, { name: 'Alcohol', value: '-' },
  { name: 'Tobacco', value: '-' }, { name: 'Tobacco (Chewing)', value: '-' },
  { name: 'Smoking', value: '-' }, { name: 'Dustel 0.5Mg Tablet', value: '-' },
];

// ─── Toggle Pill Sub-component ─────────────────────────────────────
function TogglePill({ label, active, activeColor, activeFg, onClick }: {
  label: string; active: boolean; activeColor: string; activeFg?: string; onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontWeight: 600, fontSize: 12,
        bgcolor: active ? activeColor : 'transparent',
        color: active ? (activeFg || '#fff') : '#6b7280',
        transition: 'all 0.15s', userSelect: 'none',
        '&:hover': { opacity: 0.85 },
      }}
    >
      {label}
    </Box>
  );
}

// ─── Condition Card Sub-component ──────────────────────────────────
function ConditionCard({ condition, index, onValueChange, onSinceChange }: {
  condition: MedicalCondition; index: number;
  onValueChange: (i: number, v: 'Y' | 'N' | '-') => void;
  onSinceChange: (i: number, s: string) => void;
}) {
  const borderColor = condition.value === 'Y' ? '#86efac' : condition.value === 'N' ? '#fca5a5' : 'divider';
  const bgColor = condition.value === 'Y' ? '#f0fdf4' : condition.value === 'N' ? '#fef2f2' : 'background.paper';

  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor, borderRadius: 2, bgcolor: bgColor, transition: 'all 0.2s' }}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#1f2937', fontSize: 13 }}>
        {condition.name}
      </Typography>
      <Box sx={{ display: 'flex', borderRadius: '9999px', bgcolor: '#f3f4f6', overflow: 'hidden', height: 28 }}>
        <TogglePill label="Y" active={condition.value === 'Y'} activeColor="#10b981" onClick={() => onValueChange(index, 'Y')} />
        <TogglePill label="-" active={condition.value === '-'} activeColor="#d1d5db" activeFg="#374151" onClick={() => onValueChange(index, '-')} />
        <TogglePill label="N" active={condition.value === 'N'} activeColor="#ef4444" onClick={() => onValueChange(index, 'N')} />
      </Box>
      {condition.value === 'Y' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11, whiteSpace: 'nowrap' }}>Since</Typography>
          <TextField
            value={condition.since || ''}
            onChange={(e) => onSinceChange(index, e.target.value)}
            size="small"
            placeholder="Year"
            sx={{ '& .MuiInputBase-root': { height: 26, fontSize: 12 } }}
            fullWidth
          />
        </Box>
      )}
    </Box>
  );
}


/** Compute age string from DOB for display in suggestions */
function computeAge(dob: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) {
    years--;
  }
  return years > 0 ? `${years}y` : '';
}

export default function RegisterPatientDialog({ open, onClose, initialName, initialPhone }: RegisterPatientDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      salutation: 'Mr',
      name: initialName ? toTitleCase(initialName) : '',
      gender: 'M',
      dateOfBirth: '',
      phone: initialPhone ?? '',
      email: '',
      address: '',
      bloodGroup: '',
    },
  });

  // --- Medical History State ---
  const [medicalConditions, setMedicalConditions] = useState<MedicalCondition[]>(
    DEFAULT_CONDITIONS.map((c) => ({ ...c }))
  );
  const [noRelevantHistory, setNoRelevantHistory] = useState(false);

  // --- Name-based patient suggestions ---
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const [nameSuggestionsOpen, setNameSuggestionsOpen] = useState(false);
  const [debouncedNameSearch, setDebouncedNameSearch] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetNameSearch = useCallback(
    debounce((val: string) => setDebouncedNameSearch(val), 300),
    [],
  );

  const { data: nameSuggestionsData, isLoading: nameSuggestionsLoading } = useQuery({
    queryKey: ['register-name-search', debouncedNameSearch],
    queryFn: () => patientApi.searchPatients(debouncedNameSearch),
    enabled: debouncedNameSearch.length >= 2,
  });

  const nameSuggestions: Patient[] = nameSuggestionsData?.data ?? [];

  // --- Google Places Address Autocomplete ---
  const addressFieldRef = useRef<HTMLDivElement>(null);
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false);
  const [addressPredictions, setAddressPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      setGoogleLoaded(true);
      return;
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) return;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      setGoogleLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  const fetchAddressPredictions = useCallback(
    debounce((input: string) => {
      if (!autocompleteServiceRef.current || input.length < 3) { setAddressPredictions([]); return; }
      autocompleteServiceRef.current.getPlacePredictions(
        { input, componentRestrictions: { country: 'in' } },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setAddressPredictions(predictions);
          } else { setAddressPredictions([]); }
        },
      );
    }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Repopulate when dialog re-opens
  useEffect(() => {
    if (open) {
      reset({
        salutation: 'Mr',
        name: initialName ? toTitleCase(initialName) : '',
        gender: 'M',
        dateOfBirth: '',
        phone: initialPhone ?? '',
        email: '',
        address: '',
        bloodGroup: '',
      });
      setMedicalConditions(DEFAULT_CONDITIONS.map((c) => ({ ...c })));
      setNoRelevantHistory(false);
      setDebouncedNameSearch(initialName && initialName.length >= 2 ? initialName : '');
      setNameSuggestionsOpen(false);
    }
  }, [open, initialName, initialPhone, reset]);

  // Medical history handlers
  const handleValueChange = (index: number, newValue: 'Y' | 'N' | '-') => {
    setMedicalConditions((prev) =>
      prev.map((c, i) => i === index ? { ...c, value: newValue, since: newValue === 'Y' ? c.since : '' } : c)
    );
  };

  const handleSinceChange = (index: number, since: string) => {
    setMedicalConditions((prev) =>
      prev.map((c, i) => i === index ? { ...c, since } : c)
    );
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const addressStr = data.address ?? '';
      // Build medical history payload
      const medicalHistory = noRelevantHistory ? { noRelevantHistory: true, conditions: [] } : {
        noRelevantHistory: false,
        conditions: medicalConditions.filter((c) => c.value !== '-'),
      };
      return patientApi.createPatient({
        organizationId: user?.organizationId ?? '',
        branchId: user?.branchId ?? '',
        salutation: data.salutation as 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Master' | 'Baby',
        name: data.name,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        email: data.email || undefined,
        address: {
          street: addressStr,
          city: '',
          state: '',
          pincode: '',
        },
        bloodGroup: (data.bloodGroup as 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-') || undefined,
        createdBy: user?.userId ?? '',
        medicalHistory,
      });
    },
    onSuccess: () => {
      toast.success('Patient registered successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-search'] });
      queryClient.invalidateQueries({ queryKey: ['header-patient-search'] });
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : undefined;
      toast.error(msg || 'Failed to register patient');
    },
  });

  const onSubmit = (data: FormData) => {
    if (data.dateOfBirth > todayStr) {
      toast.error('Date of birth cannot be in the future');
      return;
    }
    // Phone validation via toast
    if (data.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setNameSuggestionsOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          Register New Patient
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          <Grid container spacing={2.5}>
            {/* Salutation */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Controller
                name="salutation"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Salutation</InputLabel>
                    <Select {...field} label="Salutation">
                      {['Mr', 'Mrs', 'Ms', 'Dr', 'Master', 'Baby'].map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Full Name */}
            <Grid size={{ xs: 12, sm: 9 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Box ref={nameFieldRef} sx={{ position: 'relative' }}>
                    <TextField
                      {...field}
                      label="Full Name"
                      fullWidth
                      required
                      autoComplete="off"
                      onChange={(e) => {
                        const val = toTitleCase(e.target.value);
                        field.onChange(val);
                        debouncedSetNameSearch(val);
                        setNameSuggestionsOpen(val.length >= 2);
                      }}
                      onFocus={() => { if (field.value.length >= 2) setNameSuggestionsOpen(true); }}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                    <Popper
                      open={nameSuggestionsOpen && nameSuggestions.length > 0}
                      anchorEl={nameFieldRef.current}
                      placement="bottom-start"
                      sx={{ zIndex: 1500, width: nameFieldRef.current?.offsetWidth }}
                    >
                      <ClickAwayListener onClickAway={() => setNameSuggestionsOpen(false)}>
                        <Paper elevation={8} sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', mt: 0.5 }}>
                          <Typography variant="caption" sx={{ px: 1.5, pt: 1, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                            Existing patients
                          </Typography>
                          {nameSuggestionsLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={18} /></Box>
                          )}
                          {nameSuggestions.map((p) => (
                            <Box
                              key={p.patientId}
                              onClick={() => { toast.info(`Patient "${p.name}" already exists (${p.uhid}).`, { duration: 5000 }); setNameSuggestionsOpen(false); }}
                              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid', borderColor: 'divider' }}
                            >
                              <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {p.dateOfBirth && <Chip label={computeAge(p.dateOfBirth)} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                  {p.gender && <Chip label={p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                  {p.phone && <Chip label={p.phone} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Paper>
                      </ClickAwayListener>
                    </Popper>
                  </Box>
                )}
              />
            </Grid>

            {/* Row: Phone + Email */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                    required
                    slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            {/* Row: Gender + DOB + Blood Group */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.gender} fullWidth>
                    <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Gender</FormLabel>
                    <RadioGroup row {...field}>
                      <FormControlLabel value="M" control={<Radio size="small" />} label="M" />
                      <FormControlLabel value="F" control={<Radio size="small" />} label="F" />
                      <FormControlLabel value="Other" control={<Radio size="small" />} label="Other" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date of Birth"
                    type="date"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayStr } }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val > todayStr) { toast.error('Date of birth cannot be in the future'); return; }
                      field.onChange(val);
                    }}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Controller
                name="bloodGroup"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Blood Group</InputLabel>
                    <Select {...field} label="Blood Group">
                      <MenuItem value="">None</MenuItem>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Address */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Box ref={addressFieldRef}>
                    <TextField
                      {...field}
                      label="Address"
                      fullWidth
                      placeholder={googleLoaded ? 'Start typing to search address...' : 'Enter full address'}
                      autoComplete="off"
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (googleLoaded) {
                          fetchAddressPredictions(e.target.value);
                          setAddressSuggestionsOpen(e.target.value.length >= 3);
                        }
                      }}
                      onFocus={() => { if (addressPredictions.length > 0) setAddressSuggestionsOpen(true); }}
                    />
                    <Popper
                      open={addressSuggestionsOpen && addressPredictions.length > 0}
                      anchorEl={addressFieldRef.current}
                      placement="bottom-start"
                      sx={{ zIndex: 1500, width: addressFieldRef.current?.offsetWidth }}
                    >
                      <ClickAwayListener onClickAway={() => setAddressSuggestionsOpen(false)}>
                        <Paper elevation={8} sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', mt: 0.5 }}>
                          {addressPredictions.map((pred) => (
                            <Box
                              key={pred.place_id}
                              onClick={() => { field.onChange(pred.description); setAddressSuggestionsOpen(false); setAddressPredictions([]); }}
                              sx={{ px: 1.5, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid', borderColor: 'divider' }}
                            >
                              <Typography variant="body2">{pred.description}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      </ClickAwayListener>
                    </Popper>
                  </Box>
                )}
              />
            </Grid>

            {/* ─── Medical History Section ─────────────────────────────── */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <HistoryIcon sx={{ color: 'primary.main', fontSize: 20, mr: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>Patient Medical History</Typography>
              </Box>

              <FormControlLabel
                control={<Checkbox checked={noRelevantHistory} onChange={(e) => setNoRelevantHistory(e.target.checked)} size="small" />}
                label={<Typography variant="body2" color="text.secondary">No known medical history</Typography>}
                sx={{ mb: 1.5 }}
              />

              <Collapse in={!noRelevantHistory}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                  {medicalConditions.map((condition, index) => (
                    <ConditionCard
                      key={`${condition.name}-${index}`}
                      condition={condition}
                      index={index}
                      onValueChange={handleValueChange}
                      onSinceChange={handleSinceChange}
                    />
                  ))}
                </Box>
              </Collapse>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Registering...' : 'Register Patient'}
          </Button>
        </DialogActions>
      </form>

    </Dialog>
  );
}
