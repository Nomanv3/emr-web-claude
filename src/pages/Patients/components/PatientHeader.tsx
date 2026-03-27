import {
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Skeleton,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  NoteAdd as NoteAddIcon,
  EventNote as EventNoteIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import type { Patient } from '@/types';

function getAge(dob: string): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return `${age}y`;
}

function genderLabel(g: string): string {
  if (g === 'M') return 'Male';
  if (g === 'F') return 'Female';
  return 'Other';
}

interface PatientHeaderProps {
  patient: Patient | undefined;
  isLoading: boolean;
  onEdit: () => void;
}

export default function PatientHeader({ patient, isLoading, onEdit }: PatientHeaderProps) {
  const navigate = useNavigate();

  if (isLoading || !patient) {
    return (
      <Box sx={{ mb: 3 }}>
        <Skeleton width={200} height={20} sx={{ mb: 2 }} />
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Skeleton variant="circular" width={72} height={72} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width={220} height={32} />
              <Skeleton width={160} height={20} sx={{ mt: 1 }} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                <Skeleton width={80} height={28} />
                <Skeleton width={80} height={28} />
                <Skeleton width={80} height={28} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton width={100} height={40} />
              <Skeleton width={140} height={40} />
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  const initials = patient.name
    ?.split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/patients" underline="hover" color="text.secondary">
          Patients
        </MuiLink>
        <Typography color="text.primary" fontWeight={500}>
          {patient.salutation} {patient.name}
        </Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Avatar
            sx={{
              width: 72,
              height: 72,
              fontSize: '1.5rem',
              bgcolor: 'primary.main',
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h4" fontWeight={700}>
                {patient.salutation} {patient.name}
              </Typography>
              <Tooltip title="Edit Patient">
                <IconButton size="small" onClick={onEdit}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              UHID: {patient.uhid}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                icon={<CakeIcon />}
                label={`${getAge(patient.dateOfBirth)} / ${genderLabel(patient.gender)}`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<PhoneIcon />}
                label={patient.phone}
                size="small"
                variant="outlined"
              />
              {patient.bloodGroup && (
                <Chip
                  label={patient.bloodGroup}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
              {patient.tags?.map((tag) => (
                <Chip key={tag} label={tag} size="small" color="secondary" variant="outlined" />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<EventNoteIcon />}
              size="small"
              onClick={() => navigate(`/appointments?patientId=${patient.patientId}`)}
            >
              Book Appointment
            </Button>
            <Button
              variant="contained"
              startIcon={<NoteAddIcon />}
              onClick={() => navigate(`/visit-details/${patient.patientId}`)}
            >
              New Prescription
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
