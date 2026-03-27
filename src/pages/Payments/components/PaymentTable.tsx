import { Box, Chip, Skeleton, Paper, IconButton, Tooltip } from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Description as InvoiceIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { Payment, PaymentMethod } from '@/types';

interface PaymentTableProps {
  payments: Payment[];
  isLoading: boolean;
  onRowClick: (payment: Payment) => void;
  onViewReceipt?: (payment: Payment) => void;
  onViewInvoice?: (payment: Payment) => void;
  onViewHistory?: (payment: Payment) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const methodColorMap: Record<PaymentMethod, 'success' | 'info' | 'secondary' | 'warning'> = {
  Cash: 'success',
  Card: 'info',
  Online: 'secondary',
  UPI: 'warning',
};

export default function PaymentTable({
  payments,
  isLoading,
  onRowClick,
  onViewReceipt,
  onViewInvoice,
  onViewHistory,
}: PaymentTableProps) {
  const columns: GridColDef[] = [
    {
      field: 'receiptId',
      headerName: 'Receipt #',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {(params.value as string)?.slice(0, 12) ?? '-'}
        </Box>
      ),
    },
    {
      field: 'collectedAt',
      headerName: 'Date',
      width: 130,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: 'invoiceId',
      headerName: 'Invoice #',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {(params.value as string)?.slice(0, 12) ?? '-'}
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ fontWeight: 600 }}>
          {formatCurrency(params.value as number)}
        </Box>
      ),
    },
    {
      field: 'method',
      headerName: 'Method',
      width: 120,
      renderCell: (params) => {
        const method = params.value as PaymentMethod;
        return (
          <Chip
            label={method}
            color={methodColorMap[method] ?? 'default'}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'collectedBy',
      headerName: 'Collected By',
      width: 150,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const payment = params.row as Payment;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Receipt">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReceipt?.(payment);
                }}
              >
                <ReceiptIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Invoice">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewInvoice?.(payment);
                }}
              >
                <InvoiceIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Payment History">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory?.(payment);
                }}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />
        ))}
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%' }}>
      <DataGrid
        rows={payments}
        columns={columns}
        getRowId={(row) => (row as Payment).paymentId}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          sorting: { sortModel: [{ field: 'collectedAt', sort: 'desc' }] },
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        onRowClick={(params) => onRowClick(params.row as Payment)}
        sx={{
          border: 'none',
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'action.hover' },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#F5F7FA',
          },
        }}
        autoHeight
      />
    </Paper>
  );
}
