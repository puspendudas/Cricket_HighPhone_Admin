import React from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Grid,
  Paper,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CircularProgress,
} from '@mui/material';

import { formatUTCDateTime12H } from 'src/utils/date';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

import win from '../../../../public/assets/win.png';

export function TotalProfitTableData() {
  const { fetchAdminTotalProfit } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  // Authoritative server-side total profit calculation
  const {
    data: totalProfitResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminTotalProfit', userId],
    queryFn: () => (userId ? fetchAdminTotalProfit(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId,
  });

  const ledgerData: any[] = totalProfitResponse?.data?.entries || [];
  const finalBalance: number = totalProfitResponse?.data?.summary?.finalBalance ?? 0;

  if (isLoading) {
    return (
      <Box p={3} textAlign="center">
        <CircularProgress size={32} sx={{ mb: 1 }} />
        <Typography>Loading total profit ledger...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error loading ledger data</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          overflowX: 'auto',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '10px',
          borderBottomLeftRadius: '0',
          borderBottomRightRadius: '0',
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Credit</TableCell>
              <TableCell>Debit</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Winner/Remark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ledgerData.length > 0 ? (
              ledgerData.map((entry, index) => (
                <TableRow key={`${entry.id || entry.matchId || index}-${index}`}>
                  <TableCell>{formatUTCDateTime12H(entry.date)}</TableCell>
                  {/* CREDIT COLUMN - RED COLOR FOR CREDIT (Jab aapko paisa dena hai) */}
                  <TableCell
                    sx={{
                      color: entry.credit > 0 ? 'red' : 'inherit',
                      fontWeight: 'bold',
                    }}
                  >
                    {entry.credit > 0
                      ? `- ₹${entry.credit.toFixed(2)}`
                      : `₹${entry.credit.toFixed(2)}`}
                  </TableCell>
                  {/* DEBIT COLUMN - GREEN COLOR FOR DEBIT (Jab aapko paisa milna hai) */}
                  <TableCell
                    sx={{
                      color: entry.debit > 0 ? 'green' : 'inherit',
                      fontWeight: 'bold',
                    }}
                  >
                    {entry.debit > 0
                      ? `+ ₹${entry.debit.toFixed(2)}`
                      : `₹${entry.debit.toFixed(2)}`}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: entry.balance >= 0 ? 'green' : 'red',
                      fontWeight: 'bold',
                    }}
                  >
                    {entry.balance >= 0
                      ? `+ ₹${entry.balance.toFixed(2)}`
                      : `- ₹${Math.abs(entry.balance).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item>
                        <img src={win} alt="icon" width={20} />
                      </Grid>
                      <Grid item>
                        <Typography variant="body2">{entry.winner || entry.matchName}</Typography>
                      </Grid>
                    </Grid>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography>No ledger data available</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Fixed Total Section */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#ffc107',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: finalBalance >= 0 ? 'green' : 'red',
              fontWeight: 'bold',
            }}
          >
            Final Balance:{' '}
            {finalBalance >= 0
              ? `+₹${finalBalance.toFixed(2)}`
              : `-₹${Math.abs(finalBalance).toFixed(2)}`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
