import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Breadcrumbs,
  Link,
  Badge,
  Autocomplete,
  TextField,
  CircularProgress,
  Divider,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { patientApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import type { Patient } from '@/types';

const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/patient': 'Patient Detail',
  '/visit-details': 'Prescription',
  '/prescription-final': 'Prescription Summary',
  '/analytics': 'Analytics',
  '/payments': 'Payments',
};

function getBreadcrumbs(pathname: string): Array<{ label: string; path: string }> {
  const crumbs: Array<{ label: string; path: string }> = [{ label: 'Dashboard', path: '/' }];

  if (pathname === '/') return crumbs;

  const basePath = '/' + pathname.split('/')[1];
  const label = breadcrumbMap[basePath] ?? basePath.replace('/', '').replace(/-/g, ' ');
  crumbs.push({ label: label.charAt(0).toUpperCase() + label.slice(1), path: pathname });

  return crumbs;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const breadcrumbs = getBreadcrumbs(location.pathname);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((val: string) => setDebouncedSearch(val), 300),
    [],
  );

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['header-patient-search', debouncedSearch],
    queryFn: () =>
      patientApi.getPatients({
        organizationId: user?.organizationId ?? '',
        search: debouncedSearch,
        limit: 8,
      }),
    enabled: debouncedSearch.length >= 2,
  });

  const searchResults: Patient[] = searchData?.data?.patients ?? [];

  const handleLogout = useCallback(() => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: '64px !important', px: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* Hamburger toggle */}
        <IconButton
          edge="start"
          onClick={toggleSidebar}
          sx={{
            mr: 0.5,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
          sx={{ flex: 1, minWidth: 0 }}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return isLast ? (
              <Typography
                key={crumb.path}
                variant="body2"
                fontWeight={600}
                color="text.primary"
                noWrap
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={crumb.path}
                component="button"
                variant="body2"
                underline="hover"
                color="text.secondary"
                onClick={() => navigate(crumb.path)}
                sx={{ '&:hover': { color: 'primary.main' } }}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>

        {/* Global patient search */}
        {!isMobile && (
          <Autocomplete<Patient>
            size="small"
            options={searchResults}
            getOptionLabel={(opt) => `${opt.name} - ${opt.uhid}`}
            inputValue={searchInput}
            onInputChange={(_, val) => {
              setSearchInput(val);
              debouncedSetSearch(val);
            }}
            onChange={(_, patient) => {
              if (patient) {
                navigate(`/patient/${patient.patientId}`);
                setSearchInput('');
                setDebouncedSearch('');
              }
            }}
            loading={searchLoading}
            noOptionsText={debouncedSearch.length < 2 ? 'Type to search...' : 'No patients found'}
            filterOptions={(x) => x}
            sx={{ width: 280 }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search patients..."
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: 20 }} />,
                    endAdornment: (
                      <>
                        {searchLoading && <CircularProgress color="inherit" size={18} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={key} {...rest} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important' }}>
                  <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.uhid} | {option.phone}</Typography>
                </Box>
              );
            }}
          />
        )}

        {/* Notifications */}
        <IconButton sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
          <Badge
            badgeContent={0}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                minWidth: 16,
                height: 16,
              },
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* User menu */}
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            borderRadius: 2,
            py: 0.5,
            px: 1,
            transition: 'background-color 200ms ease',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: 'primary.main',
              fontSize: '0.85rem',
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </Avatar>
          {!isMobile && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap lineHeight={1.3}>
                {user?.name ?? 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap lineHeight={1.2} sx={{ fontSize: '0.7rem' }}>
                {user?.role ?? 'Doctor'}
              </Typography>
            </Box>
          )}
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 200,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid',
                borderColor: 'divider',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {user?.name ?? 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email ?? ''}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => setAnchorEl(null)}
            sx={{ py: 1.5, fontSize: '0.875rem' }}
          >
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{ py: 1.5, fontSize: '0.875rem', color: 'error.main' }}
          >
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
