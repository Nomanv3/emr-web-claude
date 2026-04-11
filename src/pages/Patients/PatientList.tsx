import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Skeleton,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { patientApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/types';
import RegisterPatientDialog from './components/RegisterPatientDialog';

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

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}><Skeleton height={24} /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function PatientList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo);
  const [dateTo, setDateTo] = useState(todayStr);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, rowsPerPage, user?.organizationId, dateFrom, dateTo],
    queryFn: () =>
      patientApi.getPatients({
        organizationId: user!.organizationId,
        page: page + 1,
        limit: rowsPerPage,
        dateFrom,
        dateTo,
      }),
    enabled: !!user?.organizationId,
    staleTime: 30_000,
  });

  const patients: Patient[] = data?.data?.patients ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <Box>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Patients
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage patient records and registration
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="From"
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 160 }}
            />
            <TextField
              label="To"
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 160 }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setRegisterOpen(true)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Register Patient
          </Button>
        </Box>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#0D7C66' }}>
                <TableCell sx={{ fontWeight: 600, color: '#fff', borderBottom: '2px solid', borderColor: 'divider' }}>UHID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#fff', borderBottom: '2px solid', borderColor: 'divider' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#fff', borderBottom: '2px solid', borderColor: 'divider' }}>Age / Gender</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#fff', borderBottom: '2px solid', borderColor: 'divider' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#fff', borderBottom: '2px solid', borderColor: 'divider' }}>Blood Group</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#fff', borderBottom: '2px solid', borderColor: 'divider' }}>Tags</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#fff', borderBottom: '2px solid', borderColor: 'divider' }}>Registered On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No patients found for the selected date range.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow
                    key={patient.patientId}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '& td': { borderBottom: '1px solid', borderColor: 'divider' },
                    }}
                    onClick={() => navigate(`/patient/${patient.patientId}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {patient.uhid}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'secondary.main' }}>
                          {patient.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {patient.salutation} {patient.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getAge(patient.dateOfBirth)} / {genderLabel(patient.gender)}
                      </Typography>
                    </TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      {patient.bloodGroup ? (
                        <Chip label={patient.bloodGroup} size="small" color="error" variant="outlined" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {patient.tags?.map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                        {(!patient.tags || patient.tags.length === 0) && '-'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 15, 25, 50]}
          />
        </TableContainer>
      </motion.div>

      <RegisterPatientDialog open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </Box>
  );
}
