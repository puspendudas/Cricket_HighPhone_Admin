import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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
  eventTime: string;
  _id: string;
  eventName: string;
  user?: {
    name?: string;
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

export function ChildTableData() {
  const { fetchTotalData, fetchSettlement } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  const {
    data: tableData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ledgerTableData', userId],
    queryFn: () =>
      userId ? fetchTotalData(userId) : Promise.reject(new Error('Missing user ID')),
    enabled: !!userId,
    refetchInterval: 3000,
  });

  const { data: settlementData } = useQuery({
    queryKey: ['childSettlementData', userId],
    queryFn: () =>
      userId ? fetchSettlement(userId) : Promise.reject(new Error('Missing user ID')),
    enabled: !!userId,
  });

  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const getClientOptions = (matches: MatchSummary[]): string[] => {
    if (!matches || matches.length === 0) return [];
    const clientSet = new Set<string>();
    matches.forEach((match) => {
      match.matchBets.forEach((bet) => {
        const immediateAdmin = bet.immediate_child_admin;
        if (immediateAdmin && immediateAdmin._id) {
          const adminName = (immediateAdmin.user_name || immediateAdmin.name || '').toString();
          if (adminName) {
            clientSet.add(adminName);
          }
        }
      });
    });
    return Array.from(clientSet).sort();
  };
  const clientOptions = tableData?.matches ? getClientOptions(tableData.matches) : [];

  // --------------------------------------------------
  // HELPER FUNCTION TO PARSE DATE STRINGS
  // --------------------------------------------------
  const parseDateString = (dateStr: string): Date => {
    if (!dateStr || dateStr === 'N/A') return new Date(0);

    // Try dd-mm-yy hh:mm:ss format
    const ddmmyyRegex = /^(\d{2})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2}) (AM|PM)$/;
    const match = dateStr.match(ddmmyyRegex);
    if (match) {
      // dd-mm-yy, hh:mm:ss AM/PM
      const [day, month, year, hour, minute, second, ampm] = match;
      let h = parseInt(hour, 10);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return new Date(
        2000 + parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        h,
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }

    // Try to parse other formats
    try {
      return new Date(dateStr);
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
      return new Date(0);
    }
  };



  // --------------------------------------------------
  // UPDATED PROCESSING LOGIC
  // --------------------------------------------------
  const processLedgerData = (matches: MatchSummary[], clientFilter = ''): LedgerEntry[] => {
    if (!matches || matches.length === 0) return [];

    const normalizedFilter = clientFilter.trim().toLowerCase();
    const ledgerEntries: LedgerEntry[] = [];
    let runningBalance = 0;

    // Filter matches by client if filter is applied
    const filteredMatches = normalizedFilter
      ? matches.filter(match =>
        match.matchBets.some(bet => {
          const admin = bet.immediate_child_admin;
          if (!admin) return false;
          const adminName = (admin.user_name || admin.name || '').toString().toLowerCase();
          return adminName.includes(normalizedFilter);
        })
      )
      : matches;

    // Sort matches by date first
    const sortedMatches = filteredMatches.sort((a, b) => {
      const dateA = parseDateString(a.eventTime);
      const dateB = parseDateString(b.eventTime);
      return dateA.getTime() - dateB.getTime();
    });

    // CASE 1: Client filter is selected
    if (normalizedFilter) {
      sortedMatches.forEach((match) => {
        // Group bets by client for this match
        const betsByAdmin: Record<string, any[]> = {};

        match.matchBets.forEach((bet) => {
          const admin = bet.immediate_child_admin;
          if (!admin || !admin._id) return;

          const adminName = (admin.user_name || admin.name || '').toString();
          if (!adminName.toLowerCase().includes(normalizedFilter)) return;

          const adminId = admin._id;
          if (!betsByAdmin[adminId]) betsByAdmin[adminId] = [];
          betsByAdmin[adminId].push(bet);
        });

        // Process each client's bets for this match
        Object.values(betsByAdmin).forEach((clientBets: any[]) => {
          if (!clientBets || clientBets.length === 0) return;

          const firstBet = clientBets[0];
          const admin = firstBet.immediate_child_admin;
          if (!admin) return;

          // Calculate PL for this client in this match
          const bookmakerBets = clientBets.filter((b) => b.bet_type === 'BOOKMAKER');
          const fancyBets = clientBets.filter((b) => b.bet_type === 'FANCY');

          const calcBetValue = (bet: any) => {
            const stake = parseFloat(bet.stake_amount as any) || 0;
            const potential = parseFloat(bet.potential_winnings as any) || 0;

            if (bet.status === 'WON') {
              if (bet.selection === 'Back' || bet.selection === 'Yes') return potential;
              if (bet.selection === 'Lay' || bet.selection === 'Not') return stake;
            } else if (bet.status === 'LOST') {
              if (bet.selection === 'Back' || bet.selection === 'Yes') return -stake;
              if (bet.selection === 'Lay' || bet.selection === 'Not') return -potential;
            }
            return 0;
          };

          const matchPL = bookmakerBets.reduce((acc: number, b: any) => acc + calcBetValue(b), 0);
          const sessionPL = fancyBets.reduce((acc: number, b: any) => acc + calcBetValue(b), 0);
          const netAmount = (matchPL + sessionPL) * -1;

          const totalSessionStake = fancyBets.reduce(
            (acc: number, bet: any) => acc + (parseFloat(bet.stake_amount as any) || 0),
            0
          );

          const matchCommissionRate = admin?.match_commission || 0;
          const sessionCommissionRate = admin?.session_commission || 0;

          // Calculate match commission based on losses
          let matchCommission = 0;
          const clientSummaries = (match as any).client_summary || [];

          clientSummaries.forEach((c: any) => {
            const belongsToThisAdmin = match.matchBets.some(
              (b: any) =>
                b.user_id === c.client_id &&
                b.immediate_child_admin?._id === admin._id
            );

            if (!belongsToThisAdmin) return;

            const clientMatchPL = c.client_net_match_pl || 0;
            if (clientMatchPL < 0) {
              matchCommission += Math.abs(clientMatchPL) * (matchCommissionRate / 100);
            }
          });

          const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
          const totalCommission = matchCommission + sessionCommission;
          const afterCommission = netAmount - totalCommission;
          const share = admin?.share ?? 0;
          const shareAmount = afterCommission * (share / 100);
          const grandTotal = afterCommission - shareAmount;

          const credit = grandTotal < 0 ? Math.abs(grandTotal) : 0;
          const debit = grandTotal > 0 ? grandTotal : 0;

          if (credit > 0 || debit > 0) {
            runningBalance += debit - credit;

            ledgerEntries.push({
              date: match.eventTime
                ? `${new Date(match.eventTime).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                })}, ${new Date(match.eventTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}`
                : 'N/A',
              credit,
              debit,
              balance: runningBalance,
              winner: match.eventName,
              icon: win,
              client: (admin.user_name || admin.name || 'Unknown Client') as string,
              matchName: match.eventName,
            });
          }
        });
      });
    }
    // CASE 2: No client filter - show match totals
    else {
      sortedMatches.forEach((match) => {
        let matchTotal = 0;
        let matchHasData = false;

        // Group bets by client
        const betsByAdmin: Record<string, any[]> = {};
        match.matchBets.forEach((bet) => {
          const admin = bet.immediate_child_admin;
          if (!admin || !admin._id) return;

          const adminId = admin._id;
          if (!betsByAdmin[adminId]) betsByAdmin[adminId] = [];
          betsByAdmin[adminId].push(bet);
        });

        // Calculate total for this match
        Object.values(betsByAdmin).forEach((clientBets: any[]) => {
          if (!clientBets || clientBets.length === 0) return;

          const firstBet = clientBets[0];
          const admin = firstBet.immediate_child_admin;
          if (!admin) return;

          const bookmakerBets = clientBets.filter((b) => b.bet_type === 'BOOKMAKER');
          const fancyBets = clientBets.filter((b) => b.bet_type === 'FANCY');

          const calcBetValue = (bet: any) => {
            const stake = parseFloat(bet.stake_amount as any) || 0;
            const potential = parseFloat(bet.potential_winnings as any) || 0;

            if (bet.status === 'WON') {
              if (bet.selection === 'Back' || bet.selection === 'Yes') return potential;
              if (bet.selection === 'Lay' || bet.selection === 'Not') return stake;
            } else if (bet.status === 'LOST') {
              if (bet.selection === 'Back' || bet.selection === 'Yes') return -stake;
              if (bet.selection === 'Lay' || bet.selection === 'Not') return -potential;
            }
            return 0;
          };

          const matchPL = bookmakerBets.reduce((acc: number, b: any) => acc + calcBetValue(b), 0);
          const sessionPL = fancyBets.reduce((acc: number, b: any) => acc + calcBetValue(b), 0);
          const netAmount = (matchPL + sessionPL) * -1;

          const totalSessionStake = fancyBets.reduce(
            (acc: number, bet: any) => acc + (parseFloat(bet.stake_amount as any) || 0),
            0
          );

          const matchCommissionRate = admin?.match_commission || 0;
          const sessionCommissionRate = admin?.session_commission || 0;

          let matchCommission = 0;
          const clientSummaries = (match as any).client_summary || [];

          clientSummaries.forEach((c: any) => {
            const belongsToThisAdmin = match.matchBets.some(
              (b: any) =>
                b.user_id === c.client_id &&
                b.immediate_child_admin?._id === admin._id
            );

            if (!belongsToThisAdmin) return;

            const clientMatchPL = c.client_net_match_pl || 0;
            if (clientMatchPL < 0) {
              matchCommission += Math.abs(clientMatchPL) * (matchCommissionRate / 100);
            }
          });

          const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
          const totalCommission = matchCommission + sessionCommission;
          const afterCommission = netAmount - totalCommission;
          const share = admin?.share ?? 0;
          const shareAmount = afterCommission * (share / 100);
          const grandTotal = afterCommission - shareAmount;

          matchTotal += grandTotal;
          matchHasData = true;
        });

        if (matchHasData && Math.abs(matchTotal) > 0.01) {
          const credit = matchTotal < 0 ? Math.abs(matchTotal) : 0;
          const debit = matchTotal > 0 ? matchTotal : 0;

          runningBalance += debit - credit;

          ledgerEntries.push({
            date: match.eventTime
              ? `${new Date(match.eventTime).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              })}, ${new Date(match.eventTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}`
              : 'N/A',
            credit,
            debit,
            balance: runningBalance,
            winner: match.eventName,
            icon: win,
            client: 'Match Total',
            matchName: match.eventName,
          });
        }
      });
    }

    // Return sorted entries
    return ledgerEntries.sort((a, b) => {
      const dateA = parseDateString(a.date);
      const dateB = parseDateString(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const ledgerData = tableData?.matches ? processLedgerData(tableData.matches, selectedClient || '') : [];

  const processSettlementData = (settlements: SettlementData[], clientFilter = '') => {
    if (!settlements || settlements.length === 0) return [];
    const normalizedFilter = clientFilter.trim().toLowerCase();

    const filteredEntries = settlements
      .map((settlement: SettlementData) => {
        const clientAdmin = settlement.adminIdTo;
        const clientName = clientAdmin?.user_name || clientAdmin?.name || 'N/A';
        return {
          client: clientName,
          date: settlement.createdAt
            ? `${new Date(settlement.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })}, ${new Date(settlement.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })}`
            : 'N/A',
          credit: settlement.type === 'credit' ? settlement.ammount : 0,
          debit: settlement.type === 'debit' ? settlement.ammount : 0,
          balance: 0,
          winner: 'Settlement',
          remark: settlement.remark || 'No remark',
        };
      })
      .filter((entry) => (normalizedFilter ? entry.client.toLowerCase().includes(normalizedFilter) : true));

    // SORT SETTLEMENT ENTRIES BY DATE (OLDEST FIRST, dd-mm-yy then time)
    return filteredEntries.sort((a, b) => {
      const dateA = parseDateString(a.date);
      const dateB = parseDateString(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const settlementEntries = processSettlementData(settlementData?.data || [], selectedClient || '');

  // Compute balances
  const ledgerBalance = ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balance : 0;
  const settlementNet = settlementEntries.reduce(
    (total: any, entry: any) => total + (entry.debit - entry.credit),
    0
  );
  const finalBalance = ledgerBalance + settlementNet;

  if (isLoading)
    return (
      <Box p={3} textAlign="center">
        <Typography>Loading ledger data...</Typography>
      </Box>
    );

  if (error)
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error loading ledger data</Typography>
      </Box>
    );

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
          Ledger (Match PL)
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
                <TableRow key={`ledger-${index}`}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell sx={{ color: 'red' }}>
                    {entry.credit > 0 ? `- ₹${entry.credit.toFixed(2)}` : '₹0.00'}
                  </TableCell>
                  <TableCell sx={{ color: 'green' }}>
                    {entry.debit > 0 ? `+ ₹${entry.debit.toFixed(2)}` : '₹0.00'}
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
                <TableRow key={`settlement-${index}`}>
                  <TableCell>{entry.client}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell sx={{ color: 'red' }}>
                    {entry.credit > 0 ? `- ₹${entry.credit.toFixed(2)}` : '₹0.00'}
                  </TableCell>
                  <TableCell sx={{ color: 'green' }}>
                    {entry.debit > 0 ? `+ ₹${entry.debit.toFixed(2)}` : '₹0.00'}
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