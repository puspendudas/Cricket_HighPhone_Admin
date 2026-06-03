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



export function TotalProfitTableData() {
  const { fetchTotalData } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id; // Child ke liye
  const AdminuserId = userData?.data?.parent_id; // My Ledger ke liye
  const adminId = userData?.data?._id; // Current admin ID

  // Child Ledger Data
  const { data: childTableData } = useQuery({
    queryKey: ['childLedgerTableData', userId],
    queryFn: () => (userId ? fetchTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId,
  });

  // My Ledger Data
  const {
    data: parentData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ledgerTableData', AdminuserId],
    queryFn: () =>
      AdminuserId ? fetchTotalData(AdminuserId) : Promise.reject(new Error('Missing user ID')),
    enabled: !!AdminuserId,
  });



  // Calculate net amount for a client in a match
  const calculateClientNetAmount = (clientSummaries: any[], immediateChildAdmin: any, match: any) => {
    const matchCommissionRate = immediateChildAdmin?.match_commission || 0;
    const sessionCommissionRate = immediateChildAdmin?.session_commission || 0;

    let matchPL = 0;
    let sessionPL = 0;
    let totalSessionStake = 0;
    let matchCommission = 0;

    clientSummaries.forEach((c: any) => {
      matchPL += c.client_net_match_pl || 0;
      sessionPL += c.client_net_session_pl || 0;
      totalSessionStake += c.client_total_session_stake || 0;

      const clientMatchPL = c.client_net_match_pl || 0;
      if (clientMatchPL < 0) {
        matchCommission += Math.abs(clientMatchPL) * (matchCommissionRate / 100);
      }
    });

    const totalPL = (matchPL + sessionPL) * -1;
    const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
    const totalCommission = matchCommission + sessionCommission;

    const netAmount = totalPL - totalCommission;
    const shareAmount = netAmount * (immediateChildAdmin.share / 100);
    const grandTotal = netAmount - shareAmount;

    return grandTotal;
  };

  // Get MyLedger net amounts by match
  const getMyLedgerNetByMatch = (matches: any[]): Record<string, number> => {
    if (!matches || matches.length === 0) return {};

    const matchNet: Record<string, number> = {};
    const processedMatches = new Set<string>();

    matches.forEach((match: any) => {
      const key = match._id;
      if (processedMatches.has(key)) return;
      processedMatches.add(key);

      const summariesByClient: Record<string, any[]> = {};
      const clientSummaries = match.client_summary || [];

      clientSummaries.forEach((c: any) => {
        const clientId = c.immediate_child_admin?._id || 'unknown';
        if (!summariesByClient[clientId]) summariesByClient[clientId] = [];
        summariesByClient[clientId].push(c);
      });

      Object.entries(summariesByClient).forEach(([clientId, adminSummaries]) => {
        const immediateChildAdmin = adminSummaries[0]?.immediate_child_admin;

        // MyLedger mein sirf current admin ke data ko consider karo
        if (!immediateChildAdmin || immediateChildAdmin._id !== adminId) return;

        const grandTotal = calculateClientNetAmount(adminSummaries, immediateChildAdmin, match);

        if (!matchNet[match.eventName]) {
          matchNet[match.eventName] = 0;
        }
        matchNet[match.eventName] += grandTotal;
      });
    });

    return matchNet;
  };

  // Get Child net amounts by match
  const getChildNetByMatch = (matches: any[]): Record<string, number> => {
    if (!matches || matches.length === 0) return {};

    const matchNet: Record<string, number> = {};
    const processedMatches = new Set<string>();

    matches.forEach((match: any) => {
      const key = match._id;
      if (processedMatches.has(key)) return;
      processedMatches.add(key);

      const summariesByClient: Record<string, any[]> = {};
      const clientSummaries = match.client_summary || [];

      clientSummaries.forEach((c: any) => {
        const clientId = c.immediate_child_admin?._id || 'unknown';
        if (!summariesByClient[clientId]) summariesByClient[clientId] = [];
        summariesByClient[clientId].push(c);
      });

      Object.entries(summariesByClient).forEach(([clientId, adminSummaries]) => {
        const immediateChildAdmin = adminSummaries[0]?.immediate_child_admin;

        if (!immediateChildAdmin) return;

        const grandTotal = calculateClientNetAmount(adminSummaries, immediateChildAdmin, match);

        if (!matchNet[match.eventName]) {
          matchNet[match.eventName] = 0;
        }
        matchNet[match.eventName] += grandTotal;
      });
    });

    return matchNet;
  };

  // Helper function to parse date strings
  // const parseDateString = (dateStr: string): Date => {
  //   if (!dateStr || dateStr === 'N/A') return new Date(0); // Return epoch for invalid dates

  //   try {
  //     // Try to parse the date string
  //     return new Date(dateStr);
  //   } catch (e) {
  //     console.error('Error parsing date:', dateStr, e);
  //     return new Date(0);
  //   }
  // };

  // Process ledger entries for Total Profit
  const processLedgerData = (matches: any[]): LedgerEntry[] => {
    if (!matches || matches.length === 0) return [];

    const ledgerEntries: LedgerEntry[] = [];

    const myLedgerNet = parentData?.matches ? getMyLedgerNetByMatch(parentData.matches) : {};
    const childNet = childTableData?.matches ? getChildNetByMatch(childTableData.matches) : {};

    const processedEvents = new Set<string>();

    // STEP 1: sirf entries banao (NO balance)
    matches.forEach((match) => {
      const summariesByClient: Record<string, any[]> = {};
      const clientSummaries = match.client_summary || [];

      clientSummaries.forEach((c: any) => {
        const clientId = c.immediate_child_admin?._id || 'unknown';
        if (!summariesByClient[clientId]) summariesByClient[clientId] = [];
        summariesByClient[clientId].push(c);
      });

      Object.entries(summariesByClient).forEach(([clientId, adminSummaries]) => {
        const immediateChildAdmin = adminSummaries[0]?.immediate_child_admin;

        if (!immediateChildAdmin || immediateChildAdmin._id !== adminId) return;

        const key = `${match.eventName}-${clientId}`;
        if (processedEvents.has(key)) return;
        processedEvents.add(key);

        const myLedgerAmount = myLedgerNet[match.eventName] || 0;
        const childAmount = childNet[match.eventName] || 0;

        const totalProfit = childAmount - myLedgerAmount;

        const credit = totalProfit < 0 ? Math.abs(totalProfit) : 0;
        const debit = totalProfit > 0 ? totalProfit : 0;

        if (credit === 0 && debit === 0) return;

        ledgerEntries.push({
          date: formatUTCDateTime12H(match.eventTime),
          timestamp: new Date(match.eventTime).getTime(),
          credit,
          debit,
          balance: 0, // temporary
          winner: match.eventName,
          icon: win,
          client: immediateChildAdmin.user_name || 'Unknown Client',
          matchName: match.eventName,
        });
      });
    });

    // STEP 2: sort
    const sortedLedgerEntries = ledgerEntries.sort((a, b) => a.timestamp - b.timestamp);

    // STEP 3: cumulative balance (ACCOUNTING STYLE)
    let runningBalance = 0;

    sortedLedgerEntries.forEach((entry) => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    return sortedLedgerEntries;
  };

  const ledgerData = parentData?.matches ? processLedgerData(parentData.matches) : [];

  // Calculate totals
  const finalBalance = ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balance : 0;

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
                <TableRow key={`${entry.client}-${index}`}>
                  <TableCell>{entry.date}</TableCell>
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
                        <img src={entry.icon} alt="icon" width={20} />
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
