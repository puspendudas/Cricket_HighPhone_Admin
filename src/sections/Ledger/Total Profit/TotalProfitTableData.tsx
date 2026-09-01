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

export function TotalProfitTableData() {
  const { fetchTotalData } = useMatchApi();
  const { fetchCasinoTotalData } = useCasinoApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id; // Child ke liye
  const AdminuserId = userData?.data?.parent_id; // My Ledger ke liye
  const adminId = userData?.data?._id; // Current admin ID

  // Child Cricket Data
  const {
    data: childTableData,
    isLoading: isChildCricketLoading,
    error: childCricketError,
  } = useQuery({
    queryKey: ['childLedgerTableData', userId],
    queryFn: () => (userId ? fetchTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId,
  });

  // Parent Cricket Data (My Ledger)
  const {
    data: parentData,
    isLoading: isParentCricketLoading,
    error: parentCricketError,
  } = useQuery({
    queryKey: ['ledgerTableData', AdminuserId],
    queryFn: () =>
      AdminuserId ? fetchTotalData(AdminuserId) : Promise.reject(new Error('Missing user ID')),
    enabled: !!AdminuserId,
  });

  // Child Casino Data
  const {
    data: childCasinoData,
    isLoading: isChildCasinoLoading,
    error: childCasinoError,
  } = useQuery({
    queryKey: ['childCasinoLedgerTableData', userId],
    queryFn: () => (userId ? fetchCasinoTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId,
  });

  // Parent Casino Data (My Ledger)
  const {
    data: parentCasinoData,
    isLoading: isParentCasinoLoading,
    error: parentCasinoError,
  } = useQuery({
    queryKey: ['parentCasinoLedgerTableData', AdminuserId],
    queryFn: () =>
      AdminuserId ? fetchCasinoTotalData(AdminuserId) : Promise.reject(new Error('Missing user ID')),
    enabled: !!AdminuserId,
  });

  // ------------------ CRICKET CALCULATIONS ------------------
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
    const shareAmount = netAmount * ((immediateChildAdmin.share || 0) / 100);
    const grandTotal = netAmount - shareAmount;

    return grandTotal;
  };

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

        if (!immediateChildAdmin || immediateChildAdmin._id !== adminId) return;

        const grandTotal = calculateClientNetAmount(adminSummaries, immediateChildAdmin, match);

        if (!matchNet[match._id]) {
          matchNet[match._id] = 0;
        }
        matchNet[match._id] += grandTotal;
      });
    });

    return matchNet;
  };

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

        if (!matchNet[match._id]) {
          matchNet[match._id] = 0;
        }
        matchNet[match._id] += grandTotal;
      });
    });

    return matchNet;
  };

  // ------------------ CASINO CALCULATIONS ------------------
  const calculateCasinoClientNetAmount = (clientSummaries: any[], immediateChildAdmin: any, match: any) => {
    const casinoCommissionRate = immediateChildAdmin?.casino_commission || 0;

    let casinoPL = 0;
    let totalCommission = 0;

    clientSummaries.forEach((c: any) => {
      const netCasinoPL = c.client_net_casino_pl || 0;
      const userComm = c.client_total_casino_commission !== undefined
        ? c.client_total_casino_commission
        : (netCasinoPL < 0 ? Math.abs(netCasinoPL) * (casinoCommissionRate / 100) : 0);

      casinoPL += netCasinoPL;
      totalCommission += userComm;
    });

    const invertedCasinoPL = casinoPL * -1;
    const netAmount = invertedCasinoPL - totalCommission;
    const shareAmount = netAmount * ((immediateChildAdmin.share || 0) / 100);
    const grandTotal = netAmount - shareAmount;

    return grandTotal;
  };

  const getMyLedgerCasinoNetByMatch = (matches: any[]): Record<string, number> => {
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

        if (!immediateChildAdmin || immediateChildAdmin._id !== adminId) return;

        const grandTotal = calculateCasinoClientNetAmount(adminSummaries, immediateChildAdmin, match);

        if (!matchNet[match._id]) {
          matchNet[match._id] = 0;
        }
        matchNet[match._id] += grandTotal;
      });
    });

    return matchNet;
  };

  const getChildCasinoNetByMatch = (matches: any[]): Record<string, number> => {
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

        const grandTotal = calculateCasinoClientNetAmount(adminSummaries, immediateChildAdmin, match);

        if (!matchNet[match._id]) {
          matchNet[match._id] = 0;
        }
        matchNet[match._id] += grandTotal;
      });
    });

    return matchNet;
  };

  // ------------------ BUILD COMBINED TOTAL PROFIT ENTRIES ------------------
  const myLedgerNet = parentData?.matches ? getMyLedgerNetByMatch(parentData.matches) : {};
  const childNet = childTableData?.matches ? getChildNetByMatch(childTableData.matches) : {};

  const myLedgerCasinoNet = parentCasinoData?.matches ? getMyLedgerCasinoNetByMatch(parentCasinoData.matches) : {};
  const childCasinoNet = childCasinoData?.matches ? getChildCasinoNetByMatch(childCasinoData.matches) : {};

  const allCricketMatchesMap = new Map<string, any>();
  (parentData?.matches || []).forEach((m: any) => allCricketMatchesMap.set(m._id, m));
  (childTableData?.matches || []).forEach((m: any) => {
    if (!allCricketMatchesMap.has(m._id)) {
      allCricketMatchesMap.set(m._id, m);
    }
  });

  const allCasinoMatchesMap = new Map<string, any>();
  (parentCasinoData?.matches || []).forEach((m: any) => allCasinoMatchesMap.set(m._id, m));
  (childCasinoData?.matches || []).forEach((m: any) => {
    if (!allCasinoMatchesMap.has(m._id)) {
      allCasinoMatchesMap.set(m._id, m);
    }
  });

  const cricketEntries: LedgerEntry[] = [];
  allCricketMatchesMap.forEach((match, matchId) => {
    const myLedgerAmount = myLedgerNet[matchId] || 0;
    const childAmount = childNet[matchId] || 0;
    const totalProfit = childAmount - myLedgerAmount;

    const credit = totalProfit < 0 ? Math.abs(totalProfit) : 0;
    const debit = totalProfit > 0 ? totalProfit : 0;

    if (Math.abs(totalProfit) > 0.01) {
      cricketEntries.push({
        date: formatUTCDateTime12H(match.eventTime),
        timestamp: match.eventTime ? new Date(match.eventTime).getTime() : 0,
        credit,
        debit,
        balance: 0,
        winner: match.eventName,
        icon: win,
        client: userData?.data?.user_name || 'Client',
        matchName: match.eventName,
      });
    }
  });

  const casinoEntries: LedgerEntry[] = [];
  allCasinoMatchesMap.forEach((match, matchId) => {
    const myLedgerAmount = myLedgerCasinoNet[matchId] || 0;
    const childAmount = childCasinoNet[matchId] || 0;
    const totalProfit = childAmount - myLedgerAmount;

    const credit = totalProfit < 0 ? Math.abs(totalProfit) : 0;
    const debit = totalProfit > 0 ? totalProfit : 0;

    if (Math.abs(totalProfit) > 0.01) {
      casinoEntries.push({
        date: formatUTCDateTime12H(match.eventTime),
        timestamp: match.eventTime ? new Date(match.eventTime).getTime() : 0,
        credit,
        debit,
        balance: 0,
        winner: match.eventName,
        icon: win,
        client: userData?.data?.user_name || 'Client',
        matchName: match.eventName,
      });
    }
  });

  const allLedgerEntries = [...cricketEntries, ...casinoEntries].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  let runningBalance = 0;
  const ledgerData = allLedgerEntries.map((entry) => {
    runningBalance += entry.debit - entry.credit;
    return {
      ...entry,
      balance: Number(runningBalance.toFixed(2)),
    };
  });

  const finalBalance = ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balance : 0;

  const isLoading =
    isChildCricketLoading || isParentCricketLoading || isChildCasinoLoading || isParentCasinoLoading;
  const hasError =
    childCricketError || parentCricketError || childCasinoError || parentCasinoError;

  if (isLoading) {
    return (
      <Box p={3} textAlign="center">
        <Typography>Loading ledger data...</Typography>
      </Box>
    );
  }

  if (hasError) {
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
