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
    _id?: string;
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
    queryFn: () =>
      userId
        ? fetchTotalData(userId)
        : Promise.reject(new Error('Missing user ID')),
    enabled: !!userId,
    refetchInterval: 3000,

  });

  // My Ledger Data
  const {
    data: parentData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ledgerTableData', AdminuserId],
    queryFn: () =>
      AdminuserId
        ? fetchTotalData(AdminuserId)
        : Promise.reject(new Error('Missing user ID')),
    enabled: !!AdminuserId,
    refetchInterval: 3000,

  });

  // Helper: Remove duplicate bets using Set
  const dedupeBets = (bets: MatchSummary['matchBets']) => {
    const seen = new Set<string>();
    return bets.filter((bet) => {
      const key = bet._id || `${bet.user_id}-${bet.bet_type}-${bet.stake_amount}-${bet.potential_winnings}-${bet.status}-${bet.selection}-${bet.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Calculate net amount for a client in a match
  const calculateClientNetAmount = (
    clientBets: any[],
    immediateChildAdmin: any,
    match: any
  ) => {
    const bookmakerBets = clientBets.filter(b => b.bet_type === "BOOKMAKER");
    const fancyBets = clientBets.filter(b => b.bet_type === "FANCY");

    const matchCommissionRate = immediateChildAdmin?.match_commission || 0;
    const sessionCommissionRate = immediateChildAdmin?.session_commission || 0;

    // ---------------- MATCH + SESSION PL ----------------
    const matchPL = bookmakerBets.reduce((acc, bet) => {
      const stake = Number(bet.stake_amount) || 0;
      const potential = Number(bet.potential_winnings) || 0;

      if (bet.status === "WON") {
        if (bet.selection === "Back") return acc + potential;
        if (bet.selection === "Lay") return acc + stake;
      }
      if (bet.status === "LOST") {
        if (bet.selection === "Back") return acc - stake;
        if (bet.selection === "Lay") return acc - potential;
      }
      return acc;
    }, 0);

    const sessionPL = fancyBets.reduce((acc, bet) => {
      const stake = Number(bet.stake_amount) || 0;
      const potential = Number(bet.potential_winnings) || 0;

      if (bet.status === "WON") {
        if (bet.selection === "Yes") return acc + potential;
        if (bet.selection === "Not") return acc + stake;
      }
      if (bet.status === "LOST") {
        if (bet.selection === "Yes") return acc - stake;
        if (bet.selection === "Not") return acc - potential;
      }
      return acc;
    }, 0);

    const totalPL = (matchPL + sessionPL) * -1;

    // ---------------- ✅ MATCH COMMISSION (ONLY client_summary LOSS) ----------------
    let matchCommission = 0;

    const clientSummaries = match?.client_summary || [];

    clientSummaries.forEach((c: any) => {
      const belongsToClient = clientBets.some(
        (b: any) => b.user_id === c.client_id
      );

      if (!belongsToClient) return;

      const clientMatchPL = c.client_net_match_pl || 0;

      // ✅ sirf LOSS par
      if (clientMatchPL < 0) {
        matchCommission +=
          Math.abs(clientMatchPL) * (matchCommissionRate / 100);
      }
    });

    // ---------------- SESSION COMMISSION ----------------
    const totalSessionStake = fancyBets.reduce(
      (acc, bet) => acc + (Number(bet.stake_amount) || 0),
      0
    );

    const sessionCommission =
      totalSessionStake * (sessionCommissionRate / 100);

    const totalCommission = matchCommission + sessionCommission;

    const netAmount = totalPL - totalCommission;
    const shareAmount = netAmount * (immediateChildAdmin.share / 100);
    const grandTotal = netAmount - shareAmount;

    return grandTotal;
  };


  // Get MyLedger net amounts by match
  const getMyLedgerNetByMatch = (matches: MatchSummary[]): Record<string, number> => {
    if (!matches || matches.length === 0) return {};

    const matchNet: Record<string, number> = {};
    const processedMatches = new Set<string>();

    matches.forEach((match: MatchSummary) => {
      const key = match._id;
      if (processedMatches.has(key)) return;
      processedMatches.add(key);

      const cleanBets = dedupeBets(match.matchBets);
      const betsByClient: Record<string, any[]> = {};

      cleanBets.forEach((bet) => {
        const clientId = bet.immediate_child_admin?._id || 'unknown';
        if (!betsByClient[clientId]) betsByClient[clientId] = [];
        betsByClient[clientId].push(bet);
      });

      Object.entries(betsByClient).forEach(([clientId, clientBets]) => {
        const firstBet = clientBets[0];
        const immediateChildAdmin = firstBet?.immediate_child_admin;

        // MyLedger mein sirf current admin ke data ko consider karo
        if (!immediateChildAdmin || immediateChildAdmin._id !== adminId) return;

        const grandTotal = calculateClientNetAmount(clientBets, immediateChildAdmin, match);

        if (!matchNet[match.eventName]) {
          matchNet[match.eventName] = 0;
        }
        matchNet[match.eventName] += grandTotal;
      });
    });

    return matchNet;
  };

  // Get Child net amounts by match
  const getChildNetByMatch = (matches: MatchSummary[]): Record<string, number> => {
    if (!matches || matches.length === 0) return {};

    const matchNet: Record<string, number> = {};
    const processedMatches = new Set<string>();

    matches.forEach((match: MatchSummary) => {
      const key = match._id;
      if (processedMatches.has(key)) return;
      processedMatches.add(key);

      const cleanBets = dedupeBets(match.matchBets);
      const betsByClient: Record<string, any[]> = {};

      cleanBets.forEach((bet) => {
        const clientId = bet.immediate_child_admin?._id || 'unknown';
        if (!betsByClient[clientId]) betsByClient[clientId] = [];
        betsByClient[clientId].push(bet);
      });

      Object.entries(betsByClient).forEach(([clientId, clientBets]) => {
        const firstBet = clientBets[0];
        const immediateChildAdmin = firstBet?.immediate_child_admin;

        if (!immediateChildAdmin) return;

        const grandTotal = calculateClientNetAmount(clientBets, immediateChildAdmin, match);

        if (!matchNet[match.eventName]) {
          matchNet[match.eventName] = 0;
        }
        matchNet[match.eventName] += grandTotal;
      });
    });

    return matchNet;
  };

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

  // Process ledger entries for Total Profit
  const processLedgerData = (matches: MatchSummary[]): LedgerEntry[] => {
    if (!matches || matches.length === 0) return [];

    const ledgerEntries: LedgerEntry[] = [];

    const myLedgerNet = parentData?.matches
      ? getMyLedgerNetByMatch(parentData.matches)
      : {};
    const childNet = childTableData?.matches
      ? getChildNetByMatch(childTableData.matches)
      : {};

    const processedEvents = new Set<string>();

    // STEP 1: sirf entries banao (NO balance)
    matches.forEach((match) => {
      const cleanBets = dedupeBets(match.matchBets);
      const betsByClient: Record<string, any[]> = {};

      cleanBets.forEach((bet) => {
        const clientId = bet.immediate_child_admin?._id || 'unknown';
        if (!betsByClient[clientId]) betsByClient[clientId] = [];
        betsByClient[clientId].push(bet);
      });

      Object.entries(betsByClient).forEach(([clientId, clientBets]) => {
        const firstBet = clientBets[0];
        const immediateChildAdmin = firstBet?.immediate_child_admin;

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
          date: new Date(match.eventTime).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }),
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
    const sortedLedgerEntries = ledgerEntries.sort((a, b) => {
      const dateA = parseDateString(a.date);
      const dateB = parseDateString(b.date);
      return dateA.getTime() - dateB.getTime();
    });

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
      <Paper sx={{
        p: 2,
        overflowX: 'auto',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        borderBottomLeftRadius: '0',
        borderBottomRightRadius: '0'
      }}>
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
                  <TableCell sx={{
                    color: entry.credit > 0 ? 'red' : 'inherit',
                    fontWeight: 'bold'
                  }}>
                    {entry.credit > 0 ? `- ₹${entry.credit.toFixed(2)}` : `₹${entry.credit.toFixed(2)}`}
                  </TableCell>
                  {/* DEBIT COLUMN - GREEN COLOR FOR DEBIT (Jab aapko paisa milna hai) */}
                  <TableCell sx={{
                    color: entry.debit > 0 ? 'green' : 'inherit',
                    fontWeight: 'bold'
                  }}>
                    {entry.debit > 0 ? `+ ₹${entry.debit.toFixed(2)}` : `₹${entry.debit.toFixed(2)}`}
                  </TableCell>
                  <TableCell sx={{
                    color: entry.balance >= 0 ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
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

          <Typography variant="body1" sx={{
            color: finalBalance >= 0 ? 'green' : 'red'
          }}>
            Final Balance: {finalBalance >= 0 ? `+₹${finalBalance.toFixed(2)}` : `-₹${Math.abs(finalBalance).toFixed(2)}`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}