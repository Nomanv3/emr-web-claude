import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Skeleton, TextField,
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  AccountBalanceWallet as RevenueIcon,
  MedicalServices as ServicesIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
  LineChart, Line,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { analyticsApi } from '@/services/api';

const MotionCard = motion.create(Card);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function Analytics() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: summaryData, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'summary', startDate, endDate],
    queryFn: () => analyticsApi.getSummary({ organizationId: 'org-001', startDate, endDate }),
  });

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load analytics data');
    }
  }, [isError]);

  const summary = summaryData?.data;

  // Derive chart data from the real API response
  const appointmentsByStatus = summary
    ? [
        { status: 'Booked', count: summary.appointments.scheduled },
        { status: 'Completed', count: summary.appointments.completed },
        { status: 'Cancelled', count: summary.appointments.cancelled },
        { status: 'No Show', count: summary.appointments.noShow },
      ]
    : [];

  const servicesData = summary
    ? summary.services.map(s => ({ name: s.name, value: s.count })).filter(d => d.value > 0)
    : [];

  const paymentMethodData = summary
    ? [
        { name: 'Cash', value: summary.revenue.byMethod.cash },
        { name: 'Card', value: summary.revenue.byMethod.card },
        { name: 'UPI', value: summary.revenue.byMethod.upi },
        { name: 'Online', value: summary.revenue.byMethod.online },
      ].filter(d => d.value > 0)
    : [];

  const dailyTrend = summary?.dailyTrend ?? [];

  const totalServices = summary?.services.reduce((sum, s) => sum + s.count, 0) ?? 0;

  const statCards = [
    { label: 'Total Appointments', value: summary?.appointments.total ?? 0, icon: <CalendarIcon />, color: '#0088FE' },
    { label: 'New Patients', value: summary?.patients.newThisPeriod ?? 0, icon: <PeopleIcon />, color: '#00C49F' },
    { label: 'Revenue Collected', value: formatCurrency(summary?.revenue.collected ?? 0), icon: <RevenueIcon />, color: '#FFBB28' },
    { label: 'Services Performed', value: totalServices, icon: <ServicesIcon />, color: '#FF8042' },
  ];

  const hasNoData = !isLoading && !summary;

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Analytics Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor clinic performance, revenue, and patient trends
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            type="date" label="Start Date" value={startDate}
            onChange={e => setStartDate(e.target.value)}
            size="small" slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date" label="End Date" value={endDate}
            onChange={e => setEndDate(e.target.value)}
            size="small" slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card, i) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              variant="outlined"
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isLoading ? (
                  <Skeleton variant="circular" width={48} height={48} />
                ) : (
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${card.color}15`, color: card.color, display: 'flex' }}>
                    {card.icon}
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                  {isLoading ? (
                    <Skeleton width={80} height={28} />
                  ) : (
                    <Typography variant="h6" fontWeight={700}>{card.value}</Typography>
                  )}
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Appointments by Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Appointments by Status
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : hasNoData || appointmentsByStatus.every(d => d.count === 0) ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No appointment data for this period</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={appointmentsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Services Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Services Breakdown
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : hasNoData || servicesData.length === 0 ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No services data for this period</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={servicesData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {servicesData.map((_entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={2}>
        {/* Revenue by Payment Method */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Revenue by Payment Method
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : hasNoData || paymentMethodData.length === 0 ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No revenue data for this period</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={paymentMethodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area type="monotone" dataKey="value" stroke="#00C49F" fill="#00C49F" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Registration Trend */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Patient Registration Trend
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : hasNoData || dailyTrend.length === 0 ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No patient data for this period</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="newPatients" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
