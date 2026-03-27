import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import {
  Groups as GroupsIcon,
  HourglassTop as WaitingIcon,
  PlayCircle as OngoingIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { QueueEntry } from '@/types';

interface StatsCardsProps {
  queue: QueueEntry[];
  isLoading: boolean;
}

const MotionCard = motion.create(Card);

const stats = [
  {
    label: 'Total Patients',
    key: 'total' as const,
    color: '#1565C0',
    bgColor: '#E3F2FD',
    icon: GroupsIcon,
  },
  {
    label: 'Waiting',
    key: 'waiting' as const,
    color: '#F57C00',
    bgColor: '#FFF3E0',
    icon: WaitingIcon,
  },
  {
    label: 'In Progress',
    key: 'ongoing' as const,
    color: '#00897B',
    bgColor: '#E0F2F1',
    icon: OngoingIcon,
  },
  {
    label: 'Completed',
    key: 'completed' as const,
    color: '#388E3C',
    bgColor: '#E8F5E9',
    icon: CompletedIcon,
  },
];

function getCount(queue: QueueEntry[], key: string): number {
  if (key === 'total') return queue.length;
  if (key === 'waiting') return queue.filter((q) => q.status === 'Waiting').length;
  if (key === 'ongoing') return queue.filter((q) => q.status === 'Ongoing').length;
  if (key === 'completed') return queue.filter((q) => q.status === 'Completed').length;
  return 0;
}

export default function StatsCards({ queue, isLoading }: StatsCardsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const count = getCount(queue, stat.key);

        if (isLoading) {
          return (
            <Card key={stat.key}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width={80} height={16} />
                  <Skeleton width={40} height={32} sx={{ mt: 0.5 }} />
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
                <Typography variant="h4" fontWeight={700} color={stat.color}>
                  {count}
                </Typography>
              </Box>
            </CardContent>
          </MotionCard>
        );
      })}
    </Box>
  );
}
