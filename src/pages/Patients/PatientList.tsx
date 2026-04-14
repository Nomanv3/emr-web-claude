import { useMemo, useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

function formatGroupDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}><Skeleton height={24} /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

const HEADER_CELL_SX = {
  fontWeight: 600,
  color: '#fff',
  borderBottom: '2px solid',
  borderColor: 'divider',
};

export default function PatientList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const globalSearch = searchParams.get('search')?.trim() ?? '';
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo);
  const [dateTo, setDateTo] = useState(todayStr);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, rowsPerPage, user?.organizationId, dateFrom, dateTo, globalSearch],
    queryFn: () =>
      patientApi.getPatients({
        organizationId: user!.organizationId,
        page: page + 1,
        limit: rowsPerPage,
        dateFrom,
        dateTo,
        ...(globalSearch ? { search: globalSearch } : {}),
      }),
    enabled: !!user?.organizationId,
    staleTime: 30_000,
  });

  const patients: Patient[] = data?.data?.patients ?? [];
  const total = data?.data?.total ?? 0;

  // Group patients by createdAt date (YYYY-MM-DD). Sorted newest first.
  const grouped = useMemo(() => {
    const byDay = new Map<string, Patient[]>();
    for (const p of patients) {
      const key = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : 'unknown';
      const arr = byDay.get(key) ?? [];
      arr.push(p);
      byDay.set(key, arr);
    }
    return Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [patients]);

  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Auto-expand the first (newest) group when data loads.
  const defaultExpanded = grouped[0]?.[0] ?? null;
  const currentExpanded = expandedDay ?? defaultExpanded;

  const renderRow = (patient: Patient) => (
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
  );

  return (
    <Box sx={{ height: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Sticky header */}
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
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Patients
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {globalSearch
              ? `Filtering by "${globalSearch}" — showing matches in selected date range`
              : 'Manage patient records and registration'}
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

      {/* Scrollable table area — only this scrolls, not the page */}
      <Paper sx={{ borderRadius: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {isLoading ? (
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#0D7C66 !important' } }}>
                    <TableCell sx={HEADER_CELL_SX}>UHID</TableCell>
                    <TableCell sx={HEADER_CELL_SX}>Name</TableCell>
                    <TableCell sx={HEADER_CELL_SX}>Age / Gender</TableCell>
                    <TableCell sx={HEADER_CELL_SX}>Phone</TableCell>
                    <TableCell sx={HEADER_CELL_SX}>Blood Group</TableCell>
                    <TableCell sx={HEADER_CELL_SX}>Tags</TableCell>
                    <TableCell sx={HEADER_CELL_SX}>Registered On</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody><SkeletonRows /></TableBody>
              </Table>
            </TableContainer>
          ) : grouped.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No patients found for the selected date range.
              </Typography>
            </Box>
          ) : (
            grouped.map(([day, dayPatients]) => (
              <Accordion
                key={day}
                expanded={currentExpanded === day}
                onChange={(_, isOpen) => setExpandedDay(isOpen ? day : null)}
                disableGutters
                elevation={0}
                square
                sx={{
                  '&:before': { display: 'none' },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: 'action.hover',
                    minHeight: 48,
                    '&.Mui-expanded': { minHeight: 48 },
                    '& .MuiAccordionSummary-content': { my: 0.75 },
                    '& .MuiAccordionSummary-content.Mui-expanded': { my: 0.75 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {formatGroupDate(day)}
                    </Typography>
                    <Badge
                      badgeContent={dayPatients.length}
                      color="primary"
                      sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: '#0D7C66 !important' } }}>
                          <TableCell sx={HEADER_CELL_SX}>UHID</TableCell>
                          <TableCell sx={HEADER_CELL_SX}>Name</TableCell>
                          <TableCell sx={HEADER_CELL_SX}>Age / Gender</TableCell>
                          <TableCell sx={HEADER_CELL_SX}>Phone</TableCell>
                          <TableCell sx={HEADER_CELL_SX}>Blood Group</TableCell>
                          <TableCell sx={HEADER_CELL_SX}>Tags</TableCell>
                          <TableCell sx={HEADER_CELL_SX}>Registered On</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dayPatients.map(renderRow)}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>

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
          rowsPerPageOptions={[15, 25, 50, 100]}
          sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>

      <RegisterPatientDialog open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </Box>
  );
}
