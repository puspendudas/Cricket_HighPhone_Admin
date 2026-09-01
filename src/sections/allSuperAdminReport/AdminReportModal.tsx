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

import { formatUTCDateTime12H } from 'src/utils/date';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';

import { Iconify } from 'src/components/iconify';

interface ReportRow {
  superAdmin: string;
  match: number;
  session: number;
  casino?: number;
  total: number;
  mCom: number;
  sCom: number;
  cCom?: number;
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
  client_summary?: any[];
  user?: {
    name?: string;
    user_name?: string;
    match_commission?: number;
    session_commission?: number;
    immediate_child_admin?: any;
  };
  matchBets?: any[];
}

interface LedgerEntry {
  matchId: string;
  date: string;
  timestamp: number;
  credit: number;
  debit: number;
  balance: number;
  client: string;
  matchName: string;
  eventTime: string;
  match: number;
  session: number;
  casino: number;
  total: number;
  mCom: number;
  sCom: number;
  cCom: number;
  tCom: number;
  netAmount: number;
  shareAmount: number;
  gTotal: number;
  createdAt: string;
}

interface AdminReportModalProps {
  open: boolean;
  onClose: () => void;
  rowData: ReportRow | null;
  matches?: any[];
}

const extractUserName = (str: string) => {
  const match = str.match(/\((.*?)\)/);
  return match ? match[1].trim() : str.trim();
};

export function AdminReportModal({ open, onClose, rowData, matches: parentMatches }: AdminReportModalProps) {
  const { fetchTotalData } = useMatchApi();
  const { fetchCasinoTotalData } = useCasinoApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  const { data: tableData, isLoading: isCricketLoading } = useQuery({
    queryKey: ['adminModalTableData', userId],
    queryFn: () => (userId ? fetchTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId && open && !parentMatches,
  });

  const { data: casinoTableData, isLoading: isCasinoLoading } = useQuery({
    queryKey: ['adminModalCasinoTableData', userId],
    queryFn: () => (userId ? fetchCasinoTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId && open && !parentMatches,
  });

  const isLoading = !parentMatches && (isCricketLoading || isCasinoLoading);

  const allMatches = parentMatches || [
    ...(tableData?.matches || []),
    ...(casinoTableData?.matches || []),
  ];

  // 🧮 Process ledger data per match/game for the selected admin
  const processLedgerDataForAdmin = (
    matches: MatchSummary[],
    adminName: string
  ): LedgerEntry[] => {
    if (!matches || matches.length === 0 || !adminName) return [];

    const ledgerEntries: LedgerEntry[] = [];
    let runningBalance = 0;
    const targetAdmin = adminName.toLowerCase().trim();

    matches.forEach((match) => {
      const clientSummaries = (match as any).client_summary || [];

      let matchPL = 0;
      let sessionPL = 0;
      let totalSessionStake = 0;
      let matchCommission = 0;
      let sessionCommission = 0;
      let casinoCommission = 0;
      let casinoPL = 0;
      
      let foundAdmin = false;
      let adminObj: any = null;

      clientSummaries.forEach((c: any) => {
        const immediate = c.immediate_child_admin;
        if (!immediate) return;

        const currentUsername = (immediate.user_name || '').toLowerCase().trim();
        const currentName = (immediate.name || '').toLowerCase().trim();
        if (currentUsername !== targetAdmin && currentName !== targetAdmin) return;

        foundAdmin = true;
        adminObj = immediate;

        const invertedMatch = (c.client_net_match_pl || 0) * -1;
        const invertedSession = (c.client_net_session_pl || 0) * -1;
        const invertedCasino = (c.client_net_casino_pl || 0) * -1;
        
        matchPL += invertedMatch;
        sessionPL += invertedSession;
        casinoPL += invertedCasino;
        totalSessionStake += (c.client_total_session_stake || 0);

        const matchCommRate = immediate.match_commission || 0;
        if (c.client_net_match_pl < 0) {
          matchCommission += Math.abs(c.client_net_match_pl) * (matchCommRate / 100);
        }

        const casinoCommRate = immediate.casino_commission || 0;
        const userCasinoComm = c.client_total_casino_commission !== undefined
          ? c.client_total_casino_commission
          : (c.client_net_casino_pl < 0 ? Math.abs(c.client_net_casino_pl) * (casinoCommRate / 100) : 0);

        casinoCommission += userCasinoComm;
      });

      if (!foundAdmin) return;

      const sessionCommRate = adminObj?.session_commission || 0;
      sessionCommission = totalSessionStake * (sessionCommRate / 100);

      const totalPL = matchPL + sessionPL + casinoPL;
      const totalCommission = matchCommission + sessionCommission + casinoCommission;

      const netAmount = totalPL - totalCommission;
      const sharePercentage = adminObj?.share || 0;
      const shareAmount = netAmount * (sharePercentage / 100);
      const grandTotal = netAmount - shareAmount;

      const credit = grandTotal < 0 ? Math.abs(grandTotal) : 0;
      const debit = grandTotal > 0 ? grandTotal : 0;

      if (credit > 0 || debit > 0 || matchPL !== 0 || sessionPL !== 0 || casinoPL !== 0 || totalCommission !== 0 || grandTotal !== 0) {
        runningBalance += debit - credit;

        const eventDateStr = match.createdAt || (match.eventTime as string);

        ledgerEntries.push({
          matchId: match._id,
          date: formatUTCDateTime12H(eventDateStr),
          timestamp: new Date(eventDateStr).getTime(),
          credit,
          debit,
          balance: runningBalance,
          client: adminObj.user_name || adminObj.name || 'Unknown Admin',
          matchName: match.eventName,
          eventTime: formatUTCDateTime12H((match.eventTime as string) || eventDateStr),
          match: matchPL,
          session: sessionPL,
          casino: casinoPL,
          total: totalPL,
          mCom: matchCommission,
          sCom: sessionCommission,
          cCom: casinoCommission,
          tCom: totalCommission,
          netAmount,
          shareAmount,
          gTotal: grandTotal,
          createdAt: eventDateStr,
        });
      }
    });

    // Deduplicate strictly by matchId and client so multiple days of same casino game are preserved
    const uniqueLedger = ledgerEntries.filter(
      (entry, index, self) =>
        index ===
        self.findIndex((t) => t.matchId === entry.matchId && t.client === entry.client)
    );

    // Sort newest first
    const sortedLedgerEntries = uniqueLedger.sort((a, b) => b.timestamp - a.timestamp);

    return sortedLedgerEntries;
  };

  const adminUserName = rowData ? extractUserName(rowData.superAdmin) : '';
  const ledgerData = allMatches.length
    ? processLedgerDataForAdmin(allMatches as any, adminUserName)
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
          minWidth: '92%',
          maxWidth: '96%',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Child Match & Game Report for {rowData.superAdmin}</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Box>

        {/* Top Summary Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Match PL
              </Typography>
              <Typography variant="body2" sx={{ color: rowData.match >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.match >= 0 ? '+' : '-'}₹{Math.abs(rowData.match).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Session PL
              </Typography>
              <Typography variant="body2" sx={{ color: rowData.session >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.session >= 0 ? '+' : '-'}₹{Math.abs(rowData.session).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Casino PL
              </Typography>
              <Typography variant="body2" sx={{ color: (rowData.casino || 0) >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {(rowData.casino || 0) >= 0 ? '+' : '-'}₹{Math.abs(rowData.casino || 0).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Total Comm
              </Typography>
              <Typography variant="body2" sx={{ color: 'red', fontWeight: 'bold' }}>
                -₹{rowData.tCom.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Net Amount
              </Typography>
              <Typography variant="body2" sx={{ color: rowData.netAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.netAmount >= 0 ? '+' : '-'}₹{Math.abs(rowData.netAmount).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Share Amount
              </Typography>
              <Typography variant="body2" sx={{ color: rowData.shareAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.shareAmount >= 0 ? '+' : '-'}₹{Math.abs(rowData.shareAmount).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Grand Total
              </Typography>
              <Typography variant="body1" sx={{ color: rowData.gTotal >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.gTotal >= 0 ? '+' : '-'}₹{Math.abs(rowData.gTotal).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          sx={{
            overflowX: 'auto',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            borderRadius: '10px',
          }}
        >
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Event / Match Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Match</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Session</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Casino</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>M. Comm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>S. Comm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>C. Comm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>T. Comm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>NET. AMT</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SHR. AMT</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>G. Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Event Time</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {ledgerData.length > 0 ? (
                ledgerData.map((entry, index) => (
                  <TableRow key={`${entry.matchId}-${entry.client}-${index}`} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {entry.matchName}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: entry.match >= 0 ? 'green' : 'red',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.match >= 0
                        ? `+₹${entry.match.toFixed(2)}`
                        : `-₹${Math.abs(entry.match).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.session >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.session >= 0
                        ? `+₹${entry.session.toFixed(2)}`
                        : `-₹${Math.abs(entry.session).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: entry.casino >= 0 ? 'green' : 'red',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.casino >= 0
                        ? `+₹${entry.casino.toFixed(2)}`
                        : `-₹${Math.abs(entry.casino).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.total >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.total >= 0
                        ? `+₹${entry.total.toFixed(2)}`
                        : `-₹${Math.abs(entry.total).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'red' }}>
                      -₹{entry.mCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'red' }}>
                      -₹{entry.sCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'red' }}>
                      -₹{entry.cCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'red' }}>
                      -₹{entry.tCom.toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.netAmount >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.netAmount >= 0
                        ? `+₹${entry.netAmount.toFixed(2)}`
                        : `-₹${Math.abs(entry.netAmount).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.shareAmount >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.shareAmount >= 0
                        ? `+₹${entry.shareAmount.toFixed(2)}`
                        : `-₹${Math.abs(entry.shareAmount).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.gTotal >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.gTotal >= 0
                        ? `+₹${entry.gTotal.toFixed(2)}`
                        : `-₹${Math.abs(entry.gTotal).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" color="textSecondary">
                        {entry.eventTime}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={13} align="center">
                    <Typography py={2}>
                      {isLoading
                        ? 'Loading child data...'
                        : 'No child data available for this admin'}
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
