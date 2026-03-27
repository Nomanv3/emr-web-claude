import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import {
  AccountBalanceWallet as RevenueIcon,
  CheckCircle as CollectedIcon,
  HourglassTop as PendingIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { Payment } from '@/types';

interface PaymentStatsCardsProps {
  payments: Payment[];
  isLoading: boolean;
}

const MotionCard = motion.create(Card);

interface StatConfig {
  label: string;
  key: string;
  color: string;
  bgColor: string;
  icon: typeof RevenueIcon;
}

const statConfigs: StatConfig[] = [
  {
    label: 'Total Revenue',
    key: 'total',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    icon: RevenueIcon,
  },
  {
    label: 'Collected',
    key: 'collected',
    color: '#388E3C',
    bgColor: '#E8F5E9',
    icon: CollectedIcon,
  },
  {
    label: 'Pending',
    key: 'pending',
    color: '#F57C00',
    bgColor: '#FFF3E0',
    icon: PendingIcon,
  },
  {
    label: "Today's Collection",
    key: 'today',
    color: '#00897B',
    bgColor: '#E0F2F1',
    icon: TodayIcon,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function computeStat(payments: Payment[], key: string): number {
  const today = new Date().toISOString().slice(0, 10);
  switch (key) {
    case 'total':
      return payments.reduce((sum, p) => sum + p.amount, 0);
    case 'collected':
      return payments.reduce((sum, p) => sum + p.amount, 0);
    case 'pending':
      return 0;
    case 'today':
      return payments
        .filter((p) => p.collectedAt?.slice(0, 10) === today)
        .reduce((sum, p) => sum + p.amount, 0);
    default:
      return 0;
  }
}

export default function PaymentStatsCards({ payments, isLoading }: PaymentStatsCardsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      {statConfigs.map((stat, index) => {
        const Icon = stat.icon;
        const value = computeStat(payments, stat.key);

        if (isLoading) {
          return (
            <Card key={stat.key}>
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2.5,
                  '&:last-child': { pb: 2.5 },
                }}
              >
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width={80} height={16} />
                  <Skeleton width={60} height={32} sx={{ mt: 0.5 }} />
                </Box>
              </CardContent>
            </Card>
          );
        }

        return (
          <MotionCard
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2.5,
                '&:last-child': { pb: 2.5 },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: stat.bgColor,
                }}
              >
                <Icon sx={{ fontSize: 26, color: stat.color }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight={700} color={stat.color}>
                  {formatCurrency(value)}
                </Typography>
              </Box>
            </CardContent>
          </MotionCard>
        );
      })}
    </Box>
  );
}
