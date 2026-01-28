import React from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Grid,
  Modal,
  Table,
  Paper,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { Iconify } from 'src/components/iconify';

interface ReportRow {
  superAdmin: string;
  match: number;
  session: number;
  total: number;
  mCom: number;
  sCom: number;
  tCom: number;
  netAmount: number;
  shareAmount: number;
  gTotal: number;
}

interface MatchSummary {
  eventTime: string | number | Date;
  _id: string;
  eventName: string;
  createdAt: string;
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

interface LedgerEntry {
  date: string;
  credit: number;
  debit: number;
  balance: number;
  winner: string;
  icon: string;
  client: string;
  matchName: string;
  eventTime: string;
  match: number;
  session: number;
  total: number;
  mCom: number;
  sCom: number;
  tCom: number;
  netAmount: number;
  shareAmount: number;
  gTotal: number;
  createdAt: string; // New field for sorting
}

interface AdminReportModalProps {
  open: boolean;
  onClose: () => void;
  rowData: ReportRow | null;
}
const extractUserName = (str: string) => {
  const match = str.match(/\((.*?)\)/);
  return match ? match[1] : str;
};

export function AdminReportModal({ open, onClose, rowData }: AdminReportModalProps) {
  const { fetchTotalData } = useMatchApi();
  const { fetchMe } = useMeApi();
  const [selectedClient, setSelectedClient] = React.useState<string | null>(null);
  console.log(setSelectedClient, '');

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  const {
    data: tableData,
    isLoading,
  } = useQuery({
    queryKey: ['adminModalTableData', userId],
    queryFn: () => (userId ? fetchTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId && open,
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

  // 🧮 Process ledger data (with duplicate removal)
  const processLedgerDataForAdmin = (
    matches: MatchSummary[],
    adminName: string,
    clientFilter = ''
  ): LedgerEntry[] => {
    if (!matches || matches.length === 0 || !adminName) return [];

    const ledgerEntries: LedgerEntry[] = [];
    let runningBalance = 0;


    matches.forEach((match) => {
      const betsByAdmin: Record<string, any[]> = {};
      match.matchBets.forEach((bet) => {
        const adminId = bet.immediate_child_admin?._id || 'unknown';
        if (!betsByAdmin[adminId]) betsByAdmin[adminId] = [];
        betsByAdmin[adminId].push(bet);
      });

      Object.values(betsByAdmin).forEach((adminBets) => {
        const firstBet = adminBets[0];
        const immediate = firstBet?.immediate_child_admin;
        if (!immediate) return;

        const currentUsername = (immediate.user_name || '').toLowerCase();
        if (currentUsername !== adminUserName) return;


        const bookmakerBets = adminBets.filter((b) => b.bet_type === 'BOOKMAKER');
        const fancyBets = adminBets.filter((b) => b.bet_type === 'FANCY');

        const matchPL = bookmakerBets.reduce((acc: number, bet) => {
          const stake = parseFloat(bet.stake_amount as string) || 0;
          const potential = parseFloat(bet.potential_winnings as string) || 0;
          let value = 0;
          if (bet.status === 'WON') {
            if (bet.selection === 'Back') value = potential;
            if (bet.selection === 'Lay') value = stake;
          } else if (bet.status === 'LOST') {
            if (bet.selection === 'Back') value = -stake;
            if (bet.selection === 'Lay') value = -potential;
          }
          return acc + value;
        }, 0);

        const sessionPL = fancyBets.reduce((acc: number, bet) => {
          const stake = parseFloat(bet.stake_amount as string) || 0;
          const potential = parseFloat(bet.potential_winnings as string) || 0;
          let value = 0;
          if (bet.status === 'WON') {
            if (bet.selection === 'Yes') value = potential;
            if (bet.selection === 'Not') value = stake;
          } else if (bet.status === 'LOST') {
            if (bet.selection === 'Yes') value = -stake;
            if (bet.selection === 'Not') value = -potential;
          }
          return acc + value;
        }, 0);

        const invertedMatchPL = matchPL * -1;
        const invertedSessionPL = sessionPL * -1;
        const totalPL = invertedMatchPL + invertedSessionPL;

        const totalSessionStake = fancyBets.reduce(
          (acc: number, bet) => acc + (parseFloat(bet.stake_amount as string) || 0),
          0
        );


        const matchCommissionRate = immediate?.match_commission || 0;
        const sessionCommissionRate = immediate?.session_commission || 0;
        // ---------------- MATCH COMMISSION (ONLY FROM client_summary) ----------------
// ---------------- MATCH COMMISSION (ONLY OWN CLIENT LOSS) ----------------
let matchCommission = 0;

const clientSummaries = (match as any).client_summary || [];

clientSummaries.forEach((c: any) => {
  const clientMatchPL = c.client_net_match_pl || 0;

  // 🔑 Client must belong to THIS admin
  const clientBelongsToThisAdmin = match.matchBets.some(
    (b: any) =>
      b.user_id === c.client_id &&
      b.immediate_child_admin?._id === immediate._id
  );

  if (!clientBelongsToThisAdmin) return;

  // ✅ Sirf LOSS par commission
  if (clientMatchPL < 0) {
    matchCommission +=
      Math.abs(clientMatchPL) * (matchCommissionRate / 100);
  }
});


        const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
        const totalCommission = matchCommission + sessionCommission;

        const netAmount = totalPL - totalCommission;
        const sharePercentage = immediate?.share || 0;
        const shareAmount = netAmount * (sharePercentage / 100);
        const grandTotal = netAmount - shareAmount;

        const earliestDate = adminBets.reduce((earliest: string, b) => {
          if (!earliest) return b.createdAt;
          return new Date(b.createdAt) < new Date(earliest) ? b.createdAt : earliest;
        }, '');

        const credit = grandTotal < 0 ? Math.abs(grandTotal) : 0;
        const debit = grandTotal > 0 ? grandTotal : 0;

        if (credit > 0 || debit > 0) {
          runningBalance += debit - credit;

          ledgerEntries.push({
            date: earliestDate
              ? new Date(earliestDate).toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })
              : 'N/A',
            credit,
            debit,
            balance: runningBalance,
            winner: match.eventName,
            icon: '/assets/win.png',
            client: immediate.user_name || immediate.name || 'Unknown Admin',
            matchName: match.eventName,
            eventTime: match?.eventTime
              ? new Date(match.eventTime).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
              : 'N/A',
            match: invertedMatchPL,
            session: invertedSessionPL,
            total: totalPL,
            mCom: matchCommission,
            sCom: sessionCommission,
            tCom: totalCommission,
            netAmount,
            shareAmount,
            gTotal: grandTotal,
            createdAt: earliestDate || '', // Store for sorting
          });
        }
      });
    });

    // 🚫 Remove duplicates (same matchName + same client)
    const uniqueLedger = ledgerEntries.filter(
      (entry, index, self) =>
        index === self.findIndex((t) => t.matchName === entry.matchName && t.client === entry.client)
    );

    // SORT LEDGER ENTRIES BY DATE (OLDEST FIRST)
    const sortedLedgerEntries = uniqueLedger.sort((a, b) => {
      const dateA = parseDateString(a.date);
      const dateB = parseDateString(b.date);
      return dateA.getTime() - dateB.getTime(); // ascending (oldest first)
    });

    return sortedLedgerEntries;
  };

  const adminUserName = rowData ? extractUserName(rowData.superAdmin).toLowerCase() : '';
  const ledgerData = tableData?.matches
    ? processLedgerDataForAdmin(tableData.matches, adminUserName, selectedClient || '')
    : [];

  if (!rowData) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          minWidth: '90%',
          maxWidth: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Child Data for {rowData.superAdmin}</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={12}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <Typography variant="body2" color="textSecondary">
                Grand Total
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: rowData.gTotal >= 0 ? 'green' : 'red' }}
              >
                ₹{rowData.gTotal.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          sx={{
            overflowX: 'auto',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '10px',
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
              <TableRow>
                <TableCell>Match</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>M. Comm</TableCell>
                <TableCell>S. Comm</TableCell>
                <TableCell>T. Comm</TableCell>
                <TableCell>NET. AMT</TableCell>
                <TableCell>SHR. AMT</TableCell>
                <TableCell>G. Total</TableCell>
                <TableCell>Winner</TableCell>
                <TableCell>Event Time</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {ledgerData.length > 0 ? (
                ledgerData.map((entry, index) => (
                  <TableRow key={`${entry.matchName}-${entry.client}-${index}`}>
                    <TableCell sx={{ color: entry.match >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {entry.match >= 0
                        ? `+ ₹${entry.match.toFixed(2)}`
                        : `- ₹${Math.abs(entry.match).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ color: entry.session >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {entry.session >= 0
                        ? `+ ₹${entry.session.toFixed(2)}`
                        : `- ₹${Math.abs(entry.session).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ color: entry.total >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {entry.total >= 0
                        ? `+ ₹${entry.total.toFixed(2)}`
                        : `- ₹${Math.abs(entry.total).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>₹{entry.mCom.toFixed(2)}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>₹{entry.sCom.toFixed(2)}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>₹{entry.tCom.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: entry.netAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {entry.netAmount >= 0
                        ? `+ ₹${entry.netAmount.toFixed(2)}`
                        : `- ₹${Math.abs(entry.netAmount).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ color: entry.shareAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {entry.shareAmount >= 0
                        ? `+ ₹${entry.shareAmount.toFixed(2)}`
                        : `- ₹${Math.abs(entry.shareAmount).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ color: entry.gTotal >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {entry.gTotal >= 0
                        ? `+ ₹${entry.gTotal.toFixed(2)}`
                        : `- ₹${Math.abs(entry.gTotal).toFixed(2)}`}
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
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {entry.eventTime}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={15} align="center">
                    <Typography>
                      {isLoading ? 'Loading child data...' : 'No child data available for this admin'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Modal>
  );
}