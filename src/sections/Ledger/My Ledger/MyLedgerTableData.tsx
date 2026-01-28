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
  Typography
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

import win from '../../../../public/assets/win.png';

interface LedgerEntry {
  date: string;
  credit: number;
  debit: number;
  balance: number;
  winner: string;
  icon: string;
  client: string;
  matchName: string;
}

interface MatchSummary {
  eventTime: string | number | Date;
  _id: string;
  eventName: string;
  user?: {
    user_name?: string;
    match_commission?: number;
    session_commission?: number;
    immediate_child_admin?: any;
  };
  matchBets: Array<{
    _id: string;
    user_id: string;
    bet_type: string;
    stake_amount: string | number;
    potential_winnings: string | number;
    status: string;
    selection: string;
    immediate_child_admin?: {
      _id: string;
      user_name: string;
      name: string;
      match_commission: number;
      session_commission: number;
      share: number;
    };
    createdAt: string;
  }>;
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
  const { fetchTotalData, fetchMySettlement } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?.parent_id;
  const adminId = userData?.data?._id;

  const {
    data: tableData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ledgerTableData', userId],
    queryFn: () =>
      userId
        ? fetchTotalData(userId)
        : Promise.reject(new Error('Missing user ID')),
    enabled: !!userId,
  });

  // Fetch settlement data
  const { data: settlementData } = useQuery({
    queryKey: ['mySettlementData', adminId],
    queryFn: () =>
      adminId
        ? fetchMySettlement(adminId)
        : Promise.reject(new Error('Missing admin ID')),
    enabled: !!adminId,
  });

  // Helper function to parse date strings
  const parseDateString = (dateStr: string): Date => {
    if (!dateStr || dateStr === 'N/A') return new Date(0); // Return epoch for invalid dates

    try {
      // Try to parse the date string
      return new Date(dateStr);
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
      return new Date(0);
    }
  };
  const loginUser = userData?.data;
  const loginMatchCommissionRate = loginUser?.match_commission || 0;
  const loginSessionCommissionRate = loginUser?.session_commission || 0;
  const loginShareRate = (loginUser?.share || 0) / 100;

  const processLedgerData = (matches: MatchSummary[]): LedgerEntry[] => {
    if (!matches || matches.length === 0) return [];

    const ledgerEntries: LedgerEntry[] = [];
    const processedKeys = new Set<string>();

    // ---------------- STEP 1: BUILD ENTRIES (NO BALANCE YET) ----------------
    matches.forEach((match) => {
      const betsByClient: Record<string, any[]> = {};

      match.matchBets.forEach((bet) => {
        const clientId = bet.immediate_child_admin?._id;
        if (!clientId) return;

        if (!betsByClient[clientId]) betsByClient[clientId] = [];
        betsByClient[clientId].push(bet);
      });

      Object.entries(betsByClient).forEach(([clientId, clientBets]) => {
        const firstBet = clientBets[0];
        const clientAdmin = firstBet?.immediate_child_admin;

        // 🔑 My Ledger → sirf login admin ke related clients
        if (!clientAdmin || clientAdmin._id !== adminId) return;

        const key = `${match._id}-${clientId}`;
        if (processedKeys.has(key)) return;
        processedKeys.add(key);

        const bookmakerBets = clientBets.filter(b => b.bet_type === 'BOOKMAKER');
        const fancyBets = clientBets.filter(b => b.bet_type === 'FANCY');

        const calcPL = (bets: any[]) =>
          bets.reduce((acc, bet) => {
            const stake = Number(bet.stake_amount) || 0;
            const potential = Number(bet.potential_winnings) || 0;

            if (bet.status === 'WON') {
              return acc + (
                bet.selection === 'Back' || bet.selection === 'Yes'
                  ? potential
                  : stake
              );
            }

            if (bet.status === 'LOST') {
              return acc - (
                bet.selection === 'Back' || bet.selection === 'Yes'
                  ? stake
                  : potential
              );
            }

            return acc;
          }, 0);

        const matchPL = calcPL(bookmakerBets);
        const sessionPL = calcPL(fancyBets);

        const totalPL = (matchPL + sessionPL) * -1;

        // ---------------- COMMISSION ----------------
        let matchCommission = 0;

        const clientSummaries = (match as any).client_summary || [];

        clientSummaries.forEach((c: any) => {
          const belongsToMe = match.matchBets.some(
            (b: any) =>
              b.user_id === c.client_id &&
              b.immediate_child_admin?._id === adminId
          );

          if (!belongsToMe) return;

          if (c.client_net_match_pl < 0) {
            matchCommission +=
              Math.abs(c.client_net_match_pl) *
              (loginMatchCommissionRate / 100);
          }
        });

        const totalSessionStake = fancyBets.reduce(
          (a, b) => a + (Number(b.stake_amount) || 0),
          0
        );

        const sessionCommission =
          totalSessionStake * (loginSessionCommissionRate / 100);

        const totalCommission = matchCommission + sessionCommission;

        const netAmount = totalPL - totalCommission;
        const shareAmount = netAmount * loginShareRate;
        const grandTotal = netAmount - shareAmount;

        if (Math.abs(grandTotal) < 0.01) return;

        ledgerEntries.push({
          date: new Date(match.eventTime).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }),
          credit: grandTotal < 0 ? Math.abs(grandTotal) : 0,
          debit: grandTotal > 0 ? grandTotal : 0,
          balance: 0, // 🔴 TEMPORARY
          winner: match.eventName,
          icon: win,
          client: clientAdmin.user_name || 'Client',
          matchName: match.eventName,
        });
      });
    });

    // ---------------- STEP 2: SORT BY DATE ----------------
    const sortedLedgerEntries = ledgerEntries.sort(
      (a, b) =>
        parseDateString(a.date).getTime() -
        parseDateString(b.date).getTime()
    );

    // ---------------- STEP 3: APPLY RUNNING BALANCE ----------------
    let runningBalance = 0;

    sortedLedgerEntries.forEach((entry) => {
      runningBalance += entry.credit - entry.debit;
      entry.balance = runningBalance;
    });


    return sortedLedgerEntries;
  };



  // Process settlement data for display
  const processSettlementData = (settlements: SettlementData[]) => {
    if (!settlements || settlements.length === 0) return [];

    const settlementEntries = settlements.map((settlement: SettlementData) => {
      // Determine which admin to show based on type
      const clientAdmin = settlement.type === 'credit' ? settlement.adminIdTo : settlement.adminIdFrom;
      const clientName = clientAdmin?.user_name || clientAdmin?.name || 'N/A';

      return {
        client: clientName,
        date: new Date(settlement.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
        credit: settlement.type === 'credit' ? settlement.ammount : 0,
        debit: settlement.type === 'debit' ? settlement.ammount : 0,
        balance: 0,
        winner: 'Settlement',
        remark: settlement.remark || 'No remark'
      };
    });

    // SORT SETTLEMENT ENTRIES BY DATE (OLDEST FIRST)
    return settlementEntries.sort((a, b) => {
      const dateA = parseDateString(a.date);
      const dateB = parseDateString(b.date);
      return dateA.getTime() - dateB.getTime(); // ascending (oldest first)
    });
  };

  const ledgerData = tableData?.matches ? processLedgerData(tableData.matches) : [];
  const settlementEntries = processSettlementData(settlementData?.data || []);

  // Calculate final balance including settlement
  let finalBalance =
    ledgerData.length > 0
      ? ledgerData[ledgerData.length - 1].balance
      : 0;

  // ✅ FIXED SETTLEMENT LOGIC
  settlementEntries.forEach((entry: { debit: number; credit: number }) => {
    finalBalance += entry.credit - entry.debit;
  });



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
      <Paper sx={{
        p: 2,
        overflowX: 'auto',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        borderBottomLeftRadius: settlementEntries.length > 0 ? '10px' : '0',
        borderBottomRightRadius: settlementEntries.length > 0 ? '10px' : '0'
      }}>
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
                  <TableCell sx={{ color: entry.credit > 0 ? 'green' : 'inherit', fontWeight: entry.credit > 0 ? 'bold' : 'normal' }}>
                    {entry.credit > 0 ? `+ ₹${entry.credit.toFixed(2)}` : `₹${entry.credit.toFixed(2)}`}
                  </TableCell>
                  <TableCell sx={{ color: entry.debit > 0 ? 'red' : 'inherit', fontWeight: entry.debit > 0 ? 'bold' : 'normal' }}>
                    {entry.debit > 0 ? `- ₹${entry.debit.toFixed(2)}` : `₹${entry.debit.toFixed(2)}`}
                  </TableCell>
                  <TableCell sx={{ color: entry.balance >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    {entry.balance >= 0 ? `+ ₹${entry.balance.toFixed(2)}` : `- ₹${Math.abs(entry.balance).toFixed(2)}`}
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
                    <TableCell sx={{
                      color: entry.credit > 0 ? 'green' : 'inherit',
                      fontWeight: 'bold'
                    }}>
                      {entry.credit > 0 ? `+ ₹${entry.credit.toFixed(2)}` : `₹${entry.credit.toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{
                      color: entry.debit > 0 ? 'red' : 'inherit',
                      fontWeight: 'bold'
                    }}>
                      {entry.debit > 0 ? `- ₹${entry.debit.toFixed(2)}` : `₹${entry.debit.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                          <Typography sx={{ background: '#ffeb3b', p: 0.4, borderRadius: 0.7 }} variant="body2">
                            {entry.winner}
                          </Typography>
                        </Grid>
                      </Grid>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{
                        fontStyle: 'italic',
                        color: '#666'
                      }}>
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
            Final Balance: {finalBalance >= 0 ? `+₹${finalBalance.toFixed(2)}` : `-₹${Math.abs(finalBalance).toFixed(2)}`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}