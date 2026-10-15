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
} from '@mui/material';

import { formatUTCDateTime12H } from 'src/utils/date';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';

import win from '../../../../public/assets/win.png';

interface LedgerEntry {
  date: string;
  timestamp: number;
  credit: number;
  debit: number;
  balance: number;
  winner: string;
  icon: string;
  client: string;
  matchName: string;
}

interface SettlementData {
  _id: string;
  adminIdTo: {
    _id: string;
    user_name: string;
    name: string;
  };
  adminIdFrom: {
    _id: string;
    user_name: string;
    name: string;
  };
  ammount: number;
  type: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export function MyLedgerTableData() {
  const { fetchAdminMyLedger } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const adminId = userData?.data?._id;

  const {
    data: ledgerResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminMyLedger', adminId],
    queryFn: () => (adminId ? fetchAdminMyLedger(adminId) : Promise.reject(new Error('Missing admin ID'))),
    enabled: !!adminId,
  });

  const ledgerData: LedgerEntry[] = ledgerResponse?.data?.entries || [];
  const finalBalance: number = ledgerResponse?.data?.summary?.finalBalance || 0;
  const settlementEntries: any[] = ledgerResponse?.data?.summary?.settlementEntries || [];

  if (isLoading) {
    return (
      <Box p={3} textAlign="center">
        <Typography>Loading ledger data...</Typography>
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
          borderBottomLeftRadius: settlementEntries.length > 0 ? '10px' : '0',
          borderBottomRightRadius: settlementEntries.length > 0 ? '10px' : '0',
        }}
      >
        {/* Original Ledger Table */}
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
                <TableRow key={`${entry.client}-${index}`}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell
                    sx={{
                      color: entry.credit > 0 ? 'green' : 'inherit',
                      fontWeight: entry.credit > 0 ? 'bold' : 'normal',
                    }}
                  >
                    {entry.credit > 0
                      ? `+ ₹${entry.credit.toFixed(2)}`
                      : `₹${entry.credit.toFixed(2)}`}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: entry.debit > 0 ? 'red' : 'inherit',
                      fontWeight: entry.debit > 0 ? 'bold' : 'normal',
                    }}
                  >
                    {entry.debit > 0
                      ? `- ₹${entry.debit.toFixed(2)}`
                      : `₹${entry.debit.toFixed(2)}`}
                  </TableCell>
                  <TableCell
                    sx={{ color: entry.balance >= 0 ? 'green' : 'red', fontWeight: 'bold' }}
                  >
                    {entry.balance >= 0
                      ? `+ ₹${entry.balance.toFixed(2)}`
                      : `- ₹${Math.abs(entry.balance).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item>
                        <img src={entry.icon || win} alt="icon" width={20} />
                      </Grid>
                      <Grid item>
                        <Typography variant="body2">{entry.winner}</Typography>
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

        {/* Settlement Table */}
        {settlementEntries.length > 0 && (
          <Paper sx={{ mt: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#fff9c4' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Credit</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Debit</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Winner</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Remark</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlementEntries.map((entry: any, index: number) => (
                  <TableRow key={`settlement-${index}`}>
                    <TableCell>{entry.client}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell
                      sx={{
                        color: entry.credit > 0 ? 'green' : 'inherit',
                        fontWeight: 'bold',
                      }}
                    >
                      {entry.credit > 0
                        ? `+ ₹${entry.credit.toFixed(2)}`
                        : `₹${entry.credit.toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: entry.debit > 0 ? 'red' : 'inherit',
                        fontWeight: 'bold',
                      }}
                    >
                      {entry.debit > 0
                        ? `- ₹${entry.debit.toFixed(2)}`
                        : `₹${entry.debit.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                          <Typography
                            sx={{ background: '#ffeb3b', p: 0.4, borderRadius: 0.7 }}
                            variant="body2"
                          >
                            {entry.winner}
                          </Typography>
                        </Grid>
                      </Grid>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontStyle: 'italic',
                          color: '#666',
                        }}
                      >
                        {entry.remark}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
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
          <Typography variant="body1" sx={{ color: finalBalance >= 0 ? 'green' : 'red' }}>
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
