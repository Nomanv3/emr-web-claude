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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { patientApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const schema = z.object({
  salutation: z.string().min(1, 'Required'),
  name: z.string().min(2, 'Name is required'),
  gender: z.enum(['M', 'F', 'Other'] as const, { message: 'Gender is required' }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phone: z.string().min(10, 'Valid phone required'),
  alternatePhone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  bloodGroup: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RegisterPatientDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function RegisterPatientDialog({ open, onClose }: RegisterPatientDialogProps) {
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
      name: '',
      gender: 'M',
      dateOfBirth: '',
      phone: '',
      alternatePhone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      bloodGroup: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      patientApi.createPatient({
        organizationId: user?.organizationId ?? '',
        branchId: user?.branchId ?? '',
        salutation: data.salutation as 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Master' | 'Baby',
        name: data.name,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        email: data.email || undefined,
        address: {
          street: data.street ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          pincode: data.pincode ?? '',
        },
        bloodGroup: (data.bloodGroup as 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-') || undefined,
        createdBy: user?.userId ?? '',
      }),
    onSuccess: () => {
      toast.success('Patient registered successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
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

  const onSubmit = (data: FormData) => mutation.mutate(data);

  const handleClose = () => {
    reset();
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
        <DialogContent dividers>
          <Grid container spacing={2.5}>
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

            <Grid size={{ xs: 12, sm: 9 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.gender}>
                    <FormLabel>Gender</FormLabel>
                    <RadioGroup row {...field}>
                      <FormControlLabel value="M" control={<Radio size="small" />} label="Male" />
                      <FormControlLabel value="F" control={<Radio size="small" />} label="Female" />
                      <FormControlLabel value="Other" control={<Radio size="small" />} label="Other" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date of Birth"
                    type="date"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="alternatePhone"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Alternate Phone" fullWidth />
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

            <Grid size={{ xs: 12, sm: 6 }}>
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

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Address
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="street"
                control={control}
                render={({ field }) => <TextField {...field} label="Street Address" fullWidth />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => <TextField {...field} label="City" fullWidth />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="state"
                control={control}
                render={({ field }) => <TextField {...field} label="State" fullWidth />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="pincode"
                control={control}
                render={({ field }) => <TextField {...field} label="Pincode" fullWidth />}
              />
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
