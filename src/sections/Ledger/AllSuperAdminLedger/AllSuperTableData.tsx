import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Box,
  Grid,
  Paper,
  Table,
  Button,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  IconButton,
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';
import { Iconify } from 'src/components/iconify';

import SettlementModal from './SettlementModal';

interface ViewStackItem {
  adminId: string;
  clientName: string;
  level: number;
}

export function AllSuperTableData() {
  const [openModal, setOpenModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { fetchAdminSettlement } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  // Parse hierarchy view stack from URL query param `stack`
  // Format: adminId:encodedName;adminId:encodedName
  const stackParam = searchParams.get('stack') || '';
  const viewStack: ViewStackItem[] = useMemo(() => {
    if (!stackParam) return [];
    try {
      return stackParam
        .split(';')
        .filter(Boolean)
        .map((item, index) => {
          const colonIndex = item.indexOf(':');
          if (colonIndex === -1) {
            return { adminId: item, clientName: 'Admin', level: index };
          }
          const adminId = item.substring(0, colonIndex);
          const rawName = item.substring(colonIndex + 1);
          return {
            adminId,
            clientName: decodeURIComponent(rawName) || 'Admin',
            level: index,
          };
        });
    } catch (e) {
      console.error('Error parsing stack from query:', e);
      return [];
    }
  }, [stackParam]);

  const currentView = viewStack.length > 0 ? viewStack[viewStack.length - 1] : null;
  const targetUserId = currentView?.adminId || userData?.data?._id;

  // Authoritative server-side settlement computation
  const {
    data: settlementResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminSettlement', targetUserId],
    queryFn: () =>
      targetUserId
        ? fetchAdminSettlement(targetUserId)
        : Promise.reject(new Error('Missing user ID')),
    enabled: !!targetUserId,
  });

  const receivingData: any[] = settlementResponse?.data?.receivingData || [];
  const paidData: any[] = settlementResponse?.data?.paidData || [];

  const serializeStack = (stack: ViewStackItem[]): string =>
    stack.map((item) => `${item.adminId}:${encodeURIComponent(item.clientName)}`).join(';');

  // Navigate forward down the hierarchy
  const handleClientClick = (client: any) => {
    const isUser = client.type === 'user' || client.immediate_child_admin?.type === 'user';
    if (isUser) return;

    const childId = client.adminId || client.immediate_child_admin?._id;
    if (!childId) return;

    const clientName = client.clientName || client.client || client.clientUserName || 'Admin';
    const nextItem: ViewStackItem = {
      adminId: String(childId),
      clientName,
      level: viewStack.length,
    };

    const nextStack = [...viewStack, nextItem];
    setSearchParams({ stack: serializeStack(nextStack) });
  };

  // Navigate backward up the hierarchy (supports on-screen button & synchronizes with browser/mobile back)
  const handleBackClick = () => {
    if (viewStack.length === 0) return;

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const nextStack = viewStack.slice(0, -1);
      if (nextStack.length === 0) {
        setSearchParams({});
      } else {
        setSearchParams({ stack: serializeStack(nextStack) });
      }
    }
  };

  // Direct jump via breadcrumbs
  const handleBreadcrumbClick = (targetLevel: number) => {
    if (targetLevel < 0) {
      setSearchParams({});
    } else if (targetLevel < viewStack.length - 1) {
      const nextStack = viewStack.slice(0, targetLevel + 1);
      setSearchParams({ stack: serializeStack(nextStack) });
    }
  };

  const getTotal = (data: any[], key: 'amount' | 'settled' | 'final') =>
    data.reduce((sum, row) => {
      let val = row[key];
      if (val === undefined || val === null || !Number.isFinite(Number(val))) {
        if (key === 'amount') val = row.finalBalance;
        else if (key === 'settled') val = row.settledAmount;
        else if (key === 'final') val = row.netAmount;
      }
      return sum + (Number(val) || 0);
    }, 0);

  const formatValue = (value: any, isCurrency = false) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num === 0) return isCurrency ? '₹0.00' : '0.00';

    const absValue = Math.abs(num);
    const fixedValue = absValue.toFixed(2);

    const formatted = isCurrency
      ? `₹${Number(fixedValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : fixedValue;

    return num < 0 ? `-${formatted}` : formatted;
  };

  const handleSettlementClick = (client: any, type: 'PAYMENT_RECEIVING_FROM' | 'PAYMENT_PAID_TO') => {
    setSelectedClient({ ...client, type });
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setSelectedClient(null);
  };

  const renderTable = (title: string, data: any[], isPositive?: boolean) => (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 3,
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        width: '100%',
        overflowX: { xs: 'auto', sm: 'hidden' },
      }}
    >
      <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
        {title}
      </Typography>

      <Box sx={{ width: '100%', minWidth: { xs: '650px', sm: '100%' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '28%' }}>Client</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '18%' }}>Amount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '18%' }}>Settled</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '18%' }}>Final</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '18%' }}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((row, i) => {
              const amount = Number(row.amount ?? row.finalBalance) || 0;
              const settled = Number(row.settled ?? row.settledAmount) || 0;
              const final = Number(row.final ?? row.netAmount) || (amount - settled);
              const isUser = row.type === 'user' || row.immediate_child_admin?.type === 'user';
              const canDrillDown = !isUser;

              return (
                <TableRow
                  key={`${row.adminId || i}-${i}`}
                  sx={{
                    cursor: canDrillDown ? 'pointer' : 'default',
                    '&:hover': canDrillDown ? { backgroundColor: 'action.hover' } : {},
                  }}
                  onClick={() => {
                    if (canDrillDown) {
                      handleClientClick(row);
                    }
                  }}
                >
                  <TableCell
                    sx={{
                      color: 'primary.main',
                      fontWeight: 500,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {row.clientName || row.client || 'Client'}
                        </Typography>
                        {row.clientUserName && row.clientUserName !== row.clientName && (
                          <Typography variant="caption" color="text.secondary">
                            {row.clientUserName}
                          </Typography>
                        )}
                        {row.type && (
                          <Chip
                            label={row.type.toUpperCase().replace('_', ' ')}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                      {canDrillDown && (
                        <Tooltip title="View child hierarchy">
                          <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
                            <Iconify icon="eva:chevron-right-fill" width={18} />
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ color: amount < 0 ? 'error.main' : 'success.main', fontWeight: 600 }}
                  >
                    {formatValue(amount, true)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: settled < 0 ? 'error.main' : settled > 0 ? 'success.main' : 'text.primary',
                      fontWeight: 600,
                    }}
                  >
                    {formatValue(settled, true)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: final < 0 ? 'error.main' : 'success.main', fontWeight: 700 }}
                  >
                    {formatValue(final, true)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click event
                        handleSettlementClick(
                          { ...row, amount, settled, final },
                          title.includes('RECEIVING')
                            ? 'PAYMENT_RECEIVING_FROM'
                            : 'PAYMENT_PAID_TO'
                        );
                      }}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Settlement
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {data.length > 0 && (
              <TableRow>
                <TableCell
                  sx={{
                    backgroundColor: '#ffc107',
                    fontWeight: 'bold',
                    borderBottom: 'none',
                    borderBottomLeftRadius: '12px',
                    color: '#000',
                  }}
                >
                  TOTAL
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    backgroundColor: '#ffc107',
                    fontWeight: 'bold',
                    color: getTotal(data, 'amount') < 0 ? 'error.dark' : 'success.dark',
                    borderBottom: 'none',
                  }}
                >
                  {formatValue(getTotal(data, 'amount'), true)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    backgroundColor: '#ffc107',
                    fontWeight: 'bold',
                    color: getTotal(data, 'settled') < 0 ? 'error.dark' : 'text.primary',
                    borderBottom: 'none',
                  }}
                >
                  {formatValue(getTotal(data, 'settled'), true)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    backgroundColor: '#ffc107',
                    fontWeight: 'bold',
                    color: getTotal(data, 'final') < 0 ? 'error.dark' : 'success.dark',
                    borderBottom: 'none',
                  }}
                >
                  {formatValue(getTotal(data, 'final'), true)}
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: '#ffc107',
                    borderBottom: 'none',
                    borderBottomRightRadius: '12px',
                  }}
                />
              </TableRow>
            )}

            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );

  const renderHeader = () => (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {viewStack.length > 0 && (
            <Tooltip title="Go Back">
              <IconButton
                onClick={handleBackClick}
                color="primary"
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'primary.lighter' },
                }}
                size="small"
              >
                <Iconify icon="eva:arrow-back-fill" width={20} />
              </IconButton>
            </Tooltip>
          )}

          <Breadcrumbs
            separator={<Iconify icon="eva:chevron-right-fill" width={16} />}
            aria-label="settlement-hierarchy"
          >
            <Link
              component="button"
              underline="hover"
              color={viewStack.length === 0 ? 'text.primary' : 'inherit'}
              onClick={() => handleBreadcrumbClick(-1)}
              sx={{
                fontWeight: viewStack.length === 0 ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
              }}
            >
              <Iconify icon="solar:home-2-bold" width={18} />
              Settlement
            </Link>

            {viewStack.map((item, idx) => {
              const isLast = idx === viewStack.length - 1;
              return isLast ? (
                <Typography
                  key={item.adminId}
                  color="text.primary"
                  sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}
                >
                  {item.clientName}
                </Typography>
              ) : (
                <Link
                  key={item.adminId}
                  component="button"
                  underline="hover"
                  color="inherit"
                  onClick={() => handleBreadcrumbClick(idx)}
                  sx={{ fontWeight: 500, cursor: 'pointer' }}
                >
                  {item.clientName}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Stack>

        {currentView && (
          <Chip
            label={`Viewing: ${currentView.clientName}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Paper>
    </Box>
  );

  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress size={32} sx={{ mb: 1 }} />
        <Typography>Loading settlement data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="error">Error loading settlement data</Typography>
      </Box>
    );
  }

  return (
    <>
      {renderHeader()}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderTable('PAYMENT RECEIVING FROM ( LENA HAI )', receivingData, true)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderTable('PAYMENT PAID TO ( DENA HAI )', paidData, false)}
        </Grid>
      </Grid>

      <SettlementModal
        open={openModal}
        onClose={handleClose}
        client={selectedClient}
        adminIdFrom={currentView?.adminId}
      />
    </>
  );
}

export default AllSuperTableData;