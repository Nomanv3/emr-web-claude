import { Box, IconButton, Typography, Button } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { format, addDays, subDays, isToday } from 'date-fns';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const date = new Date(selectedDate + 'T00:00:00');

  const handlePrev = () => {
    onDateChange(format(subDays(date, 1), 'yyyy-MM-dd'));
  };

  const handleNext = () => {
    onDateChange(format(addDays(date, 1), 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    onDateChange(format(new Date(), 'yyyy-MM-dd'));
  };

  const displayDate = isToday(date)
    ? 'Today'
    : format(date, 'EEE, MMM d, yyyy');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: 'background.paper',
        borderRadius: 50,
        border: '1px solid',
        borderColor: 'divider',
        px: 1,
        py: 0.5,
      }}
    >
      <IconButton size="small" onClick={handlePrev}>
        <ChevronLeftIcon />
      </IconButton>
      <Button
        onClick={handleToday}
        sx={{
          borderRadius: 50,
          px: 2.5,
          py: 0.5,
          minWidth: 180,
          textTransform: 'none',
          color: isToday(date) ? 'primary.main' : 'text.primary',
          fontWeight: 600,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          {displayDate}
        </Typography>
      </Button>
      <IconButton size="small" onClick={handleNext}>
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}
