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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import { patientApi } from '@/services/api';
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

interface EditPatientDialogProps {
  open: boolean;
  onClose: () => void;
  patient: Patient;
}

function buildAddressString(addr?: Patient['address']): string {
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
}

export default function EditPatientDialog({ open, onClose, patient }: EditPatientDialogProps) {
  const queryClient = useQueryClient();

  const dobForInput = patient.dateOfBirth
    ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
    : '';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      salutation: patient.salutation || 'Mr',
      name: patient.name ? toTitleCase(patient.name) : '',
      gender: patient.gender || 'M',
      dateOfBirth: dobForInput,
      phone: patient.phone || '',
      email: patient.email || '',
      address: buildAddressString(patient.address),
      bloodGroup: patient.bloodGroup || '',
    },
  });

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

  // Repopulate when dialog re-opens or patient prop changes
  useEffect(() => {
    if (open) {
      reset({
        salutation: patient.salutation || 'Mr',
        name: patient.name ? toTitleCase(patient.name) : '',
        gender: patient.gender || 'M',
        dateOfBirth: dobForInput,
        phone: patient.phone || '',
        email: patient.email || '',
        address: buildAddressString(patient.address),
        bloodGroup: patient.bloodGroup || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      patientApi.updatePatient(patient.patientId, {
        salutation: data.salutation as Patient['salutation'],
        name: data.name,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        email: data.email || undefined,
        address: {
          street: data.address ?? '',
          city: '',
          state: '',
          pincode: '',
        },
        bloodGroup: (data.bloodGroup as Patient['bloodGroup']) || undefined,
      }),
    onSuccess: () => {
      toast.success('Patient updated successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', patient.patientId] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : undefined;
      toast.error(msg || 'Failed to update patient');
    },
  });

  const onSubmit = (data: FormData) => {
    if (data.dateOfBirth > todayStr) {
      toast.error('Date of birth cannot be in the future');
      return;
    }
    if (data.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          Edit Patient
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
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    required
                    autoComplete="off"
                    onChange={(e) => field.onChange(toTitleCase(e.target.value))}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
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
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
