import { useState, useRef } from 'react';
import {
  Box, TextField, IconButton, Popover, Button, Typography, Divider,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse, isValid } from 'date-fns';
import { startOfWeek, endOfWeek, subDays } from 'date-fns';

type Props = {
  startDate: string;
  endDate: string;
  onApply: (startISO: string, endISO: string) => void;
  label?: string;
};

const getToday = () => {
  const d = new Date();
  return { start: d, end: d };
};

const getYesterday = () => {
  const d = subDays(new Date(), 1);
  return { start: d, end: d };
};

const getCurrentWeek = () => {
  return {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: new Date(),
  };
};

const getPreviousWeek = () => {
  const start = startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });
  const end = endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });
  return { start, end };
};
const toISO = (d: Date) => format(d, 'yyyy-MM-dd');
const toDisplay = (iso: string) => {
  if (!iso) return '';
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? format(d, 'dd-MM-yyyy') : '';
};

export default function DateRangePickerInput({ startDate, endDate, onApply, label = 'Date Range' }: Props) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | null>(startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : null);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : null);

  const displayValue = startDate && endDate
    ? `${toDisplay(startDate)}  To  ${toDisplay(endDate)}`
    : '';

  const handleOpen = () => {
    setTempStart(startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : null);
    setTempEnd(endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : null);
    setOpen(true);
  };

  const handleApply = () => {
    if (!tempStart || !tempEnd) return;
    const s = tempStart <= tempEnd ? tempStart : tempEnd;
    const e = tempStart <= tempEnd ? tempEnd : tempStart;
    onApply(toISO(s), toISO(e));
    setOpen(false);
  };

  const canApply = !!(tempStart && tempEnd);

  const applyPreset = (type: 'today' | 'yesterday' | 'currentWeek' | 'previousWeek' | 'reset') => {
    let range;

    switch (type) {
      case 'today':
        range = getToday();
        break;
      case 'yesterday':
        range = getYesterday();
        break;
      case 'currentWeek':
        range = getCurrentWeek();
        break;
      case 'previousWeek':
        range = getPreviousWeek();
        break;
      case 'reset':
        range = getToday();
        break;
    }

    setTempStart(range.start);
    setTempEnd(range.end);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box ref={anchorRef} sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <TextField
          label={label}
          value={displayValue}
          placeholder="DD-MM-YYYY  To  DD-MM-YYYY"
          slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
          onClick={handleOpen}
          size="small"
          sx={{
            width: 280,
            '& .MuiInputBase-input': { cursor: 'pointer', fontSize: 14 },
            '& .MuiOutlinedInput-root': {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            },
          }}
        />
        <IconButton
          onClick={handleOpen}
          sx={{
            height: 40,
            width: 40,
            borderRadius: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderLeft: 'none',
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            bgcolor: 'primary.main',
            color: '#fff',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <CalendarMonthIcon fontSize="small" />
        </IconButton>
      </Box>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, borderRadius: 2, boxShadow: 8, px: 1.5, pt: 1, pb: 0.5 } } }}
      >
        <Box sx={{ p: 2, minWidth: 680 }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* Start Calendar */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Start Date
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {tempStart ? format(tempStart, 'dd-MM-yyyy') : '—'}
                </Typography>
              </Box>
              <Divider orientation="horizontal" flexItem />
              <DateCalendar
                value={tempStart}
                onChange={(d) => setTempStart(d)}
                sx={{ width: '100%', maxHeight: 320 }}
              />
            </Box>

            {/* <Divider orientation="vertical" flexItem /> */}

            {/* End Calendar */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  End Date
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {tempEnd ? format(tempEnd, 'dd-MM-yyyy') : '—'}
                </Typography>
              </Box>
              <Divider orientation="horizontal" flexItem />
              <DateCalendar
                value={tempEnd}
                onChange={(d) => setTempEnd(d)}
                minDate={tempStart ?? undefined}
                sx={{ width: '100%', maxHeight: 320 }}
              />
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box
              sx={{
                width: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: 'divider',
              }}
            >
              {/* Top Presets */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {[
                  { label: 'Today', key: 'today' },
                  { label: 'Yesterday', key: 'yesterday' },
                  { label: 'Current Week', key: 'currentWeek' },
                  { label: 'Previous Week', key: 'previousWeek' },
                ].map((item) => (
                  <Button
                    key={item.key}
                    size="small"
                    variant='outlined'
                    onClick={() => applyPreset(item.key as any)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontSize: 13,
                      mb: 0.5,
                      pl: 1.0,
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Button
                  variant='outlined'
                  color="error"
                  size="small"
                  onClick={() => applyPreset('reset')}
                  sx={{
                    textTransform: 'none',
                    fontSize: 13,
                    mb: 0.5,
                    pl: 1.0,
                    textAlign: 'center',
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Box>

          </Box>


          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={handleApply} disabled={!canApply}>
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </LocalizationProvider>
  );
}
