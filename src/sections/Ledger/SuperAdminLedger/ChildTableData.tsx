import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import {
  Box,
  Paper,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

export function ChildTableData() {
  const { fetchAdminChildLedger } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Authoritative server-side child ledger computation
  const {
    data: ledgerResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminChildLedger', userId, selectedClient],
    queryFn: () =>
      userId
        ? fetchAdminChildLedger(userId, selectedClient || '')
        : Promise.reject(new Error('Missing user ID')),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });

  const clientOptions: string[] = ledgerResponse?.data?.clientOptions || [];
  const ledgerData: any[] = ledgerResponse?.data?.entries || [];
  const settlementEntries: any[] = ledgerResponse?.data?.settlements || [];
  const finalBalance: number = ledgerResponse?.data?.summary?.finalBalance ?? 0;

  if (isLoading) {
    return (
      <Box p={3} textAlign="center">
        <CircularProgress size={32} sx={{ mb: 1 }} />
        <Typography>Loading child ledger data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error loading child ledger data</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          fullWidth
          options={clientOptions}
          value={selectedClient}
          onChange={(event, newValue) => setSelectedClient(newValue)}
          renderInput={(params) => <TextField {...params} label="Select Client" size="small" />}
          clearOnEscape
          clearText="Clear"
          noOptionsText="No clients found"
        />
      </Box>

      {/* Ledger Table */}
      <Paper
        sx={{
          p: 2,
          overflowX: 'auto',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '10px',
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Ledger (Match & Casino PL)
        </Typography>

        <Table>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Credit</TableCell>
              <TableCell>Debit</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Winner</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {ledgerData.length > 0 ? (
              ledgerData.map((entry, index) => (
                <TableRow key={`ledger-${entry.id || index}`}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell sx={{ color: 'red' }}>
                    {entry.credit > 0 ? `- ₹${Number(entry.credit).toFixed(2)}` : '₹0.00'}
                  </TableCell>
                  <TableCell sx={{ color: 'green' }}>
                    {entry.debit > 0 ? `+ ₹${Number(entry.debit).toFixed(2)}` : '₹0.00'}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: entry.balance >= 0 ? 'green' : 'red',
                      fontWeight: 'bold',
                    }}
                  >
                    {entry.balance >= 0
                      ? `+ ₹${Number(entry.balance).toFixed(2)}`
                      : `- ₹${Math.abs(Number(entry.balance)).toFixed(2)}`}
                  </TableCell>
                  <TableCell>{entry.winner}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No ledger data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Settlement Table */}
      <Paper
        sx={{
          p: 2,
          overflowX: 'auto',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '10px',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Settlement Summary
        </Typography>

        <Table>
          <TableHead sx={{ backgroundColor: '#fff9c4' }}>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Credit</TableCell>
              <TableCell>Debit</TableCell>
              <TableCell>Remark</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {settlementEntries.length > 0 ? (
              settlementEntries.map((entry, index) => (
                <TableRow key={`settlement-${entry.id || index}`}>
                  <TableCell>{entry.client}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell sx={{ color: 'red' }}>
                    {entry.credit > 0 ? `- ₹${Number(entry.credit).toFixed(2)}` : '₹0.00'}
                  </TableCell>
                  <TableCell sx={{ color: 'green' }}>
                    {entry.debit > 0 ? `+ ₹${Number(entry.debit).toFixed(2)}` : '₹0.00'}
                  </TableCell>
                  <TableCell>{entry.remark}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No settlement records
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Final Balance */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#ffc107',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 1.5,
          mt: 2,
        }}
      >
        <Typography
          variant="body1"
          sx={{ color: finalBalance >= 0 ? 'green' : 'red', fontWeight: 'bold' }}
        >
          Final Balance:{' '}
          {finalBalance >= 0
            ? `+ ₹${finalBalance.toFixed(2)}`
            : `- ₹${Math.abs(finalBalance).toFixed(2)}`}
        </Typography>
      </Box>
    </Box>
  );
}
