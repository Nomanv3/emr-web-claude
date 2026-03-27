import { Box, Typography, Button } from '@mui/material';
import { EventNote as EventIcon } from '@mui/icons-material';

interface EmptyStateProps {
  onBookAppointment: () => void;
}

export default function EmptyState({ onBookAppointment }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          backgroundColor: '#E3F2FD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <EventIcon sx={{ fontSize: 48, color: 'primary.main' }} />
      </Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        No patients in queue
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 360, mb: 3 }}
      >
        The queue is empty for today. Book an appointment to get started or check back later.
      </Typography>
      <Button variant="contained" size="large" onClick={onBookAppointment}>
        Book Appointment
      </Button>
    </Box>
  );
}
