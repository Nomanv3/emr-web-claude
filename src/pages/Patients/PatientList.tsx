import { Fragment, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Box,
  Typography,
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
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { patientApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import type { Patient } from '@/types';
import RegisterPatientDialog from './components/RegisterPatientDialog';
import DateRangePickerInput from '@/components/DateRangePickerInput';
import LocationOnIcon from '@mui/icons-material/LocationOn';

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

function formatGroupDate(localDay: string): string {
  if (!localDay || localDay === 'unknown') return 'Unknown';

  const [y, m, d] = localDay.split('-').map(Number);
  const dt = new Date(y, m - 1, d);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(dt, today)) return 'Today';
  if (isSameDay(dt, yesterday)) return 'Yesterday';

  return format(dt, 'dd MMM yyyy');
}

const HEADER_CELL_SX = {
  fontWeight: 600,
  color: '#fff',
  bgcolor: '#0D7C66',
  borderBottom: '2px solid',
  borderColor: 'divider',
};

const COL_WIDTHS = {
  uhid: '10%',
  name: '20%',      // slightly reduced but still dominant
  phone: '12%',
  tags: '10%',
  regOn: '10%',
  lastVisit: '8%',
  status: '8%',     // increased for chip
  actions: '16%',   // 🔥 enough for 2–3 buttons
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
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
  const [searchParams] = useSearchParams();
  const globalSearch = searchParams.get('search')?.trim() ?? '';
  const todayStr = useCurrentDate();
  const sevenDaysAgoStr = useMemo(
    () => format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    [todayStr],
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(sevenDaysAgoStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const toggleGroup = (day: string) => {
    setOpenGroups((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  // Auto-advance the filter range when the local day rolls over (midnight).
  // If the user was viewing the default window ending at yesterday's "today",
  // slide it forward to include the new today.
  useEffect(() => {
    setDateTo((prev) => {
      // Only auto-advance if the user hadn't pinned it to a past date manually.
      if (prev < todayStr) return todayStr;
      return prev;
    });
    setDateFrom((prev) => {
      if (prev < sevenDaysAgoStr) return prev; // user picked an older start manually; keep it
      return sevenDaysAgoStr;
    });
  }, [todayStr, sevenDaysAgoStr]);

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

  const sortedPatients = useMemo(() => {
    const arr = [...patients];

    arr.sort((a, b) => {
      if (sortBy === 'name') {
        const res = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? res : -res;
      }

      if (sortBy === 'createdAt') {
        const res =
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? res : -res;
      }

      return 0;
    });

    return arr;
  }, [patients, sortBy, sortOrder]);
  // Group patients by createdAt date (YYYY-MM-DD). Sorted newest first.
  const grouped = useMemo(() => {
    const byDay = new Map<string, Patient[]>();
    for (const p of sortedPatients) {
      const key = p.createdAt ? format(new Date(p.createdAt), 'yyyy-MM-dd') : 'unknown';
      const arr = byDay.get(key) ?? [];
      arr.push(p);
      byDay.set(key, arr);
    }
    return Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [sortedPatients]);

  const handleSort = (field: 'name' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    if (grouped.length === 0) return;

    const firstDay = grouped[0][0]; // first group key

    setOpenGroups((prev) => {
      // already initialized → don’t override user toggles
      if (Object.keys(prev).length > 0) return prev;

      return { [firstDay]: true };
    });
  }, [grouped]);

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          {/* Name + Age/Gender in one line */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              sx={{ lineHeight: 1.2 }}
            >
              {patient.salutation} {patient.name}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              • {getAge(patient.dateOfBirth)} {genderLabel(patient.gender)}
            </Typography>
          </Box>

          {/* Address */}
          {(patient.address?.street || patient.address?.city) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />

              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {patient.address.street || ''}
                {patient.address.street && patient.address.city ? ', ' : ''}
                {patient.address.city || ''}
              </Typography>
            </Box>
          )}
        </Box>
      </TableCell>
      <TableCell>{patient.phone}</TableCell>
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
          {format(new Date(patient.createdAt), 'dd MMM yyyy')}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: patient.isActive ? 'success.main' : 'grey.500',
                }}
              />
              {patient.isActive ? 'Active' : 'Inactive'}
            </Box>
          }
          size="small"
          sx={{
            bgcolor: patient.isActive ? 'success.light' : 'grey.100',
            color: patient.isActive ? 'success.dark' : 'text.secondary',
            fontWeight: 500,
            borderRadius: 1,
            px: 0.5,
          }}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {format(new Date(patient.createdAt), 'dd MMM yyyy')}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {format(new Date(patient.createdAt), 'dd MMM yyyy')}
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Page header — not sticky, just above table */}
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
          <DateRangePickerInput
            startDate={dateFrom}
            endDate={dateTo}
            onApply={(s, e) => { setDateFrom(s); setDateTo(e); setPage(0); }}
          />
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

      {/* Scrollable table area — only this scrolls, column header stays fixed */}
      <Paper sx={{ borderRadius: 1, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TableContainer sx={{ flex: 1, minHeight: 0 }}>
          <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: COL_WIDTHS.uhid }} />
              <col style={{ width: COL_WIDTHS.name }} />
              <col style={{ width: COL_WIDTHS.phone }} />
              <col style={{ width: COL_WIDTHS.tags }} />
              <col style={{ width: COL_WIDTHS.regOn }} />
              <col style={{ width: COL_WIDTHS.regOn }} />
              <col style={{ width: COL_WIDTHS.regOn }} />
              <col style={{ width: COL_WIDTHS.regOn }} />
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell sx={HEADER_CELL_SX}>UHID</TableCell>
                <TableCell
                  sx={{ ...HEADER_CELL_SX, cursor: 'pointer' }}
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </TableCell>
                <TableCell sx={HEADER_CELL_SX}>Phone</TableCell>
                <TableCell sx={HEADER_CELL_SX}>Tags</TableCell>
                <TableCell sx={HEADER_CELL_SX}>Last Visit</TableCell>
                <TableCell sx={HEADER_CELL_SX}>Status</TableCell>
                <TableCell
                  sx={{ ...HEADER_CELL_SX, cursor: 'pointer' }}
                  onClick={() => handleSort('createdAt')}
                >
                  Joined on {sortBy === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </TableCell>
                <TableCell sx={HEADER_CELL_SX}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : grouped.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center', borderBottom: 'none' }}>
                    <Typography color="text.secondary">
                      No patients found for the selected date range.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                grouped.map(([day, dayPatients]) => {
                  const isOpen = !!openGroups[day];
                  return (
                    <Fragment key={day}>
                      <TableRow
                        hover
                        onClick={() => toggleGroup(day)}
                        sx={{
                          bgcolor: 'action.hover',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <TableCell
                          colSpan={8}
                          sx={{
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <KeyboardArrowDownIcon
                              fontSize="small"
                              sx={{
                                color: 'text.secondary',
                                transition: 'transform 0.2s ease',
                                transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                              }}
                            />
                            <Typography variant="subtitle2" fontWeight={700}>
                              Joining Date: {formatGroupDate(day)}
                            </Typography>
                            <Chip
                              label={dayPatients.length}
                              size="small"
                              color="primary"
                              sx={{
                                height: 22, width: 22, fontSize: 13, fontWeight: 700,
                                borderRadius: '50%',
                                '& .MuiChip-label': { padding: 0 } // Center the text
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                      {isOpen && dayPatients.map(renderRow)}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
