import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Button,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Description as RxIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { prescriptionApi } from '@/services/api';
import type { Prescription } from '@/types';

interface PrescriptionHistoryTabProps {
  patientId: string;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 5 }).map((__, j) => (
            <TableCell key={j}><Skeleton height={24} /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function PrescriptionHistoryTab({ patientId }: PrescriptionHistoryTabProps) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['patientPrescriptions', patientId],
    queryFn: () => prescriptionApi.getPatientPrescriptions(patientId),
  });

  const prescriptions: Prescription[] = data?.data ?? [];

  if (isLoading) {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Diagnoses</TableCell>
              <TableCell>Medications</TableCell>
              <TableCell>Follow Up</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <SkeletonRows />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <RxIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography color="text.secondary">
          No prescriptions found for this patient.
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate(`/visit-details/${patientId}`)}
        >
          Create Prescription
        </Button>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Diagnoses</TableCell>
            <TableCell>Medications</TableCell>
            <TableCell>Follow Up</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {prescriptions.map((rx) => (
            <TableRow key={rx.prescriptionId} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {new Date(rx.visitDate || rx.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {rx.diagnoses?.slice(0, 3).map((d, i) => (
                    <Chip
                      key={i}
                      label={d.description}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                  {(rx.diagnoses?.length ?? 0) > 3 && (
                    <Chip
                      label={`+${rx.diagnoses.length - 3}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {(!rx.diagnoses || rx.diagnoses.length === 0) && (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {rx.medications?.length ?? 0} medication(s)
                </Typography>
              </TableCell>
              <TableCell>
                {rx.followUp?.followUpDate ? (
                  <Chip
                    label={new Date(rx.followUp.followUpDate).toLocaleDateString()}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">-</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => navigate(`/prescription/${rx.prescriptionId}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
