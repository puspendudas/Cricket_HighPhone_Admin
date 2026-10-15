// DisplayMatch.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Paper,
  Divider,
  TableRow,
  Collapse,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  Accordion,
  Typography,
  IconButton,
  CardContent,
  useMediaQuery,
  TableContainer,
  TablePagination,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import { formatUTCDateTime12H } from 'src/utils/date';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';
import useBetHistroyApi from 'src/Api/matchApi/useBetHistroyApi';

import { calculateCommission } from 'src/utils/commissionUtils';
import { Iconify } from 'src/components/iconify';

import win from '../../../../../public/assets/win.png';
import { SessionRunPills, findSessionExposure } from '../SessionRunPills';

interface ApiMatchData {
  status: string;
  message: string;
  match: {
    _id: string;
    eventName: string;
    eventTime: string;
    inPlay: boolean;
    seriesName: string;
    matchOdds: any[];
    bookMakerOdds: any[];
    fancyOdds: any[];
    teams: string[];
    wonby: string | null;
  };
}

interface BetData {
  id: string;
  user: {
    name: any;
    user_name: string;
  };
  stake_amount: number;
  odds_rate: string;
  odds_value?: string;
  selection: string;
  team_name: string;
  createdAt: string;
  bet_type: string;
  runner_name?: string;
  result?: string;
  status?: string;
  potential_winnings?: string | number;
}

// Add types for summary row and match/fancy bet
type SummaryRow = {
  userFullName: string;
  userName: string;
  client: string;
  matchPL: number;
  sessionPL: number;
  tossPL: number;
  total: number;
  matchCommission: number;
  sessionCommission: number;
  totalCommission: number;
  netAmount: number;
  shareAmount: number;
  grandTotal: number;
};

type MatchBet = {
  bet_type: string;
  stake_amount: string | number;
  potential_winnings: string | number;
  status: string;
  selection: string;
};

type FancyBet = MatchBet & {
  odds_value?: string;
  odds_rate: string;
  runner_name: string;
  createdAt: string;
  result: string;
  user: { user_name: string };
};


const normalizeTeam = (name = '') => name.replace(/\./g, '').trim().toLowerCase();

const DisplayMatch: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tossPage, setTossPage] = useState(0);
  const [tossRowsPerPage, setTossRowsPerPage] = useState(10);
  const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);

  const { FatchMatchData, fetchTableData, Exposure } = useMatchApi();
  const { fetchMe } = useMeApi();
  const { fetchBetHistory } = useBetHistroyApi();
  const { gameId } = useParams<{ gameId: string }>();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  // Extract user ID
  const userId = userData?.data?._id;
  const userType = userData?.data?.type;
  const isPowerUser = userType === 'power_user';

  // Fetch match data
  const {
    data: matchData,
    isLoading: matchLoading,
    error: matchError,
  } = useQuery<ApiMatchData, Error>({
    queryKey: ['match', gameId],
    queryFn: () => FatchMatchData(gameId!),
    enabled: !!gameId,
  });

  // Extract current match ID AFTER matchData is defined
  const currentMatchId = matchData?.match?._id;

  // EXPOSURE DATA API CALL
  const { data: exposureData } = useQuery({
    queryKey: ['exposureData', userId, currentMatchId],
    queryFn: () =>
      userId && currentMatchId
        ? Exposure(userId, currentMatchId)
        : Promise.reject(new Error('Missing user ID or match ID')),
    enabled: !!userId && !!currentMatchId,
    refetchInterval: 3000,
  });

  // Fetch bet history once match id and user id are available
  const {
    data: betHistoryData,
    isLoading: betHistoryLoading,
    error: betHistoryError,
  } = useQuery<{ data: BetData[] }, Error>({
    queryKey: ['betHistory', matchData?.match._id, userId],
    queryFn: () => fetchBetHistory(matchData!.match._id, userId!),
    enabled: !!matchData?.match._id && !!userId,
    // refetchInterval: 2000,

    select: (data) => ({
      ...data,
      data: data.data.filter(
        (bet: BetData) => bet.status !== 'DELETED' && bet.status !== 'CANCELLED'
      ),
    }),
  });

  // Add this query for table data
  const { data: tableData, isLoading: isTableLoading } = useQuery({
    queryKey: ['tableData', userId, currentMatchId],
    queryFn: () =>
      userId && currentMatchId
        ? fetchTableData(userId, currentMatchId)
        : Promise.reject(new Error('Missing user ID or match ID')),
    enabled: !!userId && !!currentMatchId,
    // refetchInterval: 2000,
  });

  useEffect(() => {
    if (tableData && tableData.matches) {
      const match = tableData.matches[0];
      if (match?.summary && Array.isArray(match.summary) && match.summary.length > 0) {
        setSummaryData(match.summary);
      } else {
        const processedSummary = processSummaryData(tableData.matches);
        setSummaryData(processedSummary);
      }
    }
  }, [tableData]);

  // VARIABLES DECLARE
  const userShare = userData?.data?.share || 100; // SUPERADMIN ka share (100)

  // Calculate team-wise potential profit/loss for all admins with SIGN INVERT
  const calculateTeamWisePotentialPL = () => {
    if (exposureData?.teamWisePotentialPL && Object.keys(exposureData.teamWisePotentialPL).length > 0) {
      return exposureData.teamWisePotentialPL;
    }

    if (!exposureData?.matches || !userShare) return {};

    const teamWisePL: Record<string, number> = {};

    exposureData.matches.forEach((admin: any) => {
      const adminShare = admin.share || 0;
      const shareDiff = userShare - adminShare;

      Object.entries(admin.potential_profitloss || {}).forEach(
        ([teamName, teamPL]: [string, any]) => {
          const rawTeam = String(teamName || '').trim();
          const normTeam = rawTeam.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
          const shareAmount = (shareDiff / 100) * Number(teamPL);
          const inv = shareAmount * -1;

          teamWisePL[rawTeam] = (teamWisePL[rawTeam] || 0) + inv;
          if (normTeam && normTeam !== rawTeam) {
            teamWisePL[normTeam] = (teamWisePL[normTeam] || 0) + inv;
          }
        }
      );
    });

    return teamWisePL;
  };

  const teamWisePotentialPL = calculateTeamWisePotentialPL();

  const getTeamPL = (rname: string) => {
    if (!teamWisePotentialPL || Object.keys(teamWisePotentialPL).length === 0) return 0;
    const raw = String(rname || '').trim();
    if (teamWisePotentialPL[raw] !== undefined) return teamWisePotentialPL[raw];

    const norm = raw.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
    if (teamWisePotentialPL[norm] !== undefined) return teamWisePotentialPL[norm];

    const matchingKey = Object.keys(teamWisePotentialPL).find(
      (k) => k.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim() === norm
    );
    if (matchingKey) return teamWisePotentialPL[matchingKey];
    return 0;
  };

  const processSummaryData = (matches: any[]): SummaryRow[] => {
    const summaryRows: SummaryRow[] = [];

    matches.forEach((match: any) => {
      if (!match.client_summary || !Array.isArray(match.client_summary)) return;

      const adminGroups: Record<string, any[]> = {};

      match.client_summary.forEach((c: any) => {
        const adminId = c.immediate_child_admin?._id;
        if (adminId) {
          if (!adminGroups[adminId]) adminGroups[adminId] = [];
          adminGroups[adminId].push(c);
        }
      });

      Object.entries(adminGroups).forEach(([adminId, adminSummaries]) => {
        const immediateChildAdmin = adminSummaries[0]?.immediate_child_admin;
        if (!immediateChildAdmin) return;

        const result = calculateCommission(adminSummaries);

        summaryRows.push({
          client: immediateChildAdmin.user_name || 'N/A',
          userName: immediateChildAdmin.user_name || 'N/A',
          userFullName: immediateChildAdmin.name || 'N/A',
          matchPL: result.matchPL,
          sessionPL: result.sessionPL,
          tossPL: result.tossPL,
          total: result.total,
          matchCommission: result.matchCommission,
          sessionCommission: result.sessionCommission,
          totalCommission: result.totalCommission,
          netAmount: result.netAmount,
          shareAmount: result.shareAmount,
          grandTotal: result.grandTotal,
        });
      });
    });

    return summaryRows;
  };

  const renderSummaryTable = () => {
    if (isTableLoading) {
      return (
        <TableRow>
          <TableCell colSpan={11} align="center" sx={{ py: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>
            Loading summary data...
          </TableCell>
        </TableRow>
      );
    }
    if (isPowerUser) {
      return null;
    }
    return (
      <>
        {summaryData.map((row, index) => (
          <TableRow key={index} hover>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem' }}>
              {row.userFullName} ({row.userName})
            </TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: row.matchPL >= 0 ? '#00A76F' : '#FF5630', fontWeight: 600 }}>
              ₹{row.matchPL.toFixed(2)}
            </TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: row.sessionPL >= 0 ? '#00A76F' : '#FF5630', fontWeight: 600 }}>
              ₹{row.sessionPL.toFixed(2)}
            </TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: (row.tossPL || 0) >= 0 ? '#00A76F' : '#FF5630', fontWeight: 600 }}>
              ₹{(row.tossPL || 0).toFixed(2)}
            </TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: row.total >= 0 ? '#00A76F' : '#FF5630', fontWeight: 600 }}>
              ₹{row.total.toFixed(2)}
            </TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem' }}>₹{row.matchCommission.toFixed(2)}</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem' }}>₹{row.sessionCommission.toFixed(2)}</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem' }}>₹{row.totalCommission.toFixed(2)}</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: row.netAmount >= 0 ? '#00A76F' : '#FF5630', fontWeight: 600 }}>
              ₹{row.netAmount.toFixed(2)}
            </TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: row.shareAmount >= 0 ? '#00A76F' : '#FF5630', fontWeight: 600 }}>
              ₹{row.shareAmount.toFixed(2)}
            </TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: row.grandTotal >= 0 ? '#00A76F' : '#FF5630', fontWeight: 700 }}>
              ₹{row.grandTotal.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  };

  const calculateTotals = () => {
    const totals = summaryData.reduce(
      (acc, row) => ({
        matchPL: acc.matchPL + row.matchPL,
        sessionPL: acc.sessionPL + row.sessionPL,
        tossPL: acc.tossPL + (row.tossPL || 0),
        total: acc.total + row.total,
        matchCommission: acc.matchCommission + row.matchCommission,
        sessionCommission: acc.sessionCommission + row.sessionCommission,
        totalCommission: acc.totalCommission + row.totalCommission,
        netAmount: acc.netAmount + row.netAmount,
        shareAmount: acc.shareAmount + row.shareAmount,
        grandTotal: acc.grandTotal + row.grandTotal,
      }),
      {
        matchPL: 0,
        sessionPL: 0,
        tossPL: 0,
        total: 0,
        matchCommission: 0,
        sessionCommission: 0,
        totalCommission: 0,
        netAmount: 0,
        shareAmount: 0,
        grandTotal: 0,
      }
    );
    return totals;
  };

  const renderTotalRow = () => {
    const totals = calculateTotals();

    return (
      <TableRow sx={{ backgroundColor: '#FFC107' }}>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Total</TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: totals.matchPL >= 0 ? '#00A76F' : '#FF5630', fontWeight: 'bold' }}>
          ₹{totals.matchPL.toFixed(2)}
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: totals.sessionPL >= 0 ? '#00A76F' : '#FF5630', fontWeight: 'bold' }}>
          ₹{totals.sessionPL.toFixed(2)}
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: totals.tossPL >= 0 ? '#00A76F' : '#FF5630', fontWeight: 'bold' }}>
          ₹{totals.tossPL.toFixed(2)}
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: totals.total >= 0 ? '#00A76F' : '#FF5630', fontWeight: 'bold' }}>
          ₹{totals.total.toFixed(2)}
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>₹{totals.matchCommission.toFixed(2)}</TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>₹{totals.sessionCommission.toFixed(2)}</TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>₹{totals.totalCommission.toFixed(2)}</TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: totals.netAmount >= 0 ? '#00A76F' : '#FF5630', fontWeight: 'bold' }}>
          ₹{totals.netAmount.toFixed(2)}
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: totals.shareAmount >= 0 ? '#00A76F' : '#FF5630', fontWeight: 'bold' }}>
          ₹{totals.shareAmount.toFixed(2)}
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', color: totals.grandTotal >= 0 ? '#00A76F' : '#FF5630', fontWeight: 'bold' }}>
          ₹{totals.grandTotal.toFixed(2)}
        </TableCell>
      </TableRow>
    );
  };

  const toggleRunnerSection = (runnerName: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [runnerName]: !prev[runnerName],
    }));
  };

  if (matchLoading) {
    return (
      <Box p={2}>
        <Typography>Loading match data...</Typography>
      </Box>
    );
  }

  if (matchError) {
    return (
      <Box p={2}>
        <Typography color="error">Error loading match data: {matchError.message}</Typography>
      </Box>
    );
  }

  if (!matchData) {
    return (
      <Box p={2}>
        <Typography>No match data available</Typography>
      </Box>
    );
  }

  const { eventName, eventTime, teams, wonby } = matchData.match;

  const formattedDate = formatUTCDateTime12H(eventTime);

  // Process bet history data

  const betHistory = betHistoryData?.data || [];
  const bookmakerBets = betHistory.filter(
    (bet: BetData) =>
      (bet.bet_type || '').toUpperCase() !== 'FANCY' &&
      (bet.bet_type || '').toUpperCase() !== 'TOSS'
  );

  const formattedBetHistory = bookmakerBets.map((bet: BetData) => {
    const displayTeam = bet.team_name || 'N/A';

    return {
      client: bet.user.user_name,
      user: bet.user.name,
      amount: bet.stake_amount,
      rate: bet.odds_rate,
      mode: bet.selection === 'Back' ? 'L' : 'K',
      team: displayTeam,
      selection: bet.selection,
      date: formatDateTime(bet.createdAt),
    };
  });

  // Filter only FANCY bets and group them by runner_name
  const fancyBets = betHistory.filter((bet: BetData) => (bet.bet_type || '').toUpperCase() === 'FANCY') as BetData[];
  const groupedFancyBets = fancyBets.reduce((acc: Record<string, BetData[]>, bet: BetData) => {
    const runnerName = bet.runner_name || 'Unknown';
    if (!acc[runnerName]) acc[runnerName] = [];
    acc[runnerName].push(bet);
    return acc;
  }, {});

  // Filter only TOSS bets
  const tossBets = betHistory.filter((bet: BetData) => (bet.bet_type || '').toUpperCase() === 'TOSS') as BetData[];
  const formattedTossBetHistory = tossBets.map((bet) => {
    const displayTeam = bet.runner_name || bet.team_name || 'N/A';

    return {
      client: bet.user.user_name,
      user: bet.user.name,
      amount: bet.stake_amount,
      rate: bet.odds_rate || '95',
      mode: 'L',
      team: displayTeam,
      selection: bet.selection || 'Back',
      date: formatDateTime(bet.createdAt),
    };
  });

  // Render helpers
  const renderMatchTable = () => {
    const paginated = formattedBetHistory.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return (
      <>
        <TableContainer sx={{ maxHeight: 380, overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.neutral' }}>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Mode/Team</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPowerUser ? (
                <TableRow sx={{ backgroundColor: '#FFC107' }}>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1, fontSize: '0.78rem' }}>Total ({formattedBetHistory.length} Bets)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1, fontSize: '0.78rem' }}>
                    ₹{formattedBetHistory.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                </TableRow>
              ) : paginated.length > 0 ? (
                paginated.map((row, index) => (
                  <TableRow key={`${row.client}-${index}`} hover>
                    <TableCell sx={{ py: 0.45, px: 1, fontSize: '0.78rem' }}>
                      {row.user} ({row.client})
                    </TableCell>
                    <TableCell sx={{ py: 0.45, px: 1 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.25,
                          py: 0.15,
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          color: '#000',
                          backgroundColor: row.selection === 'Back' ? '#83c2fc' : '#fda4b4',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 'bold', mr: 0.5, color: '#000', fontSize: '0.72rem' }}
                        >
                          {row.selection}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 'bold',
                            background: '#fff',
                            borderRadius: '20px',
                            color: '#000',
                            padding: '1px 6px',
                            fontSize: '0.72rem',
                          }}
                        >
                          {row.rate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.45, px: 1, fontWeight: 600, fontSize: '0.78rem' }}>₹{row.amount.toLocaleString()}</TableCell>
                    <TableCell sx={{ py: 0.45, px: 1, fontSize: '0.78rem' }}>{row.team}</TableCell>
                    <TableCell sx={{ py: 0.45, px: 1, color: 'text.secondary', fontSize: '0.72rem' }}>{row.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 1.5, fontSize: '0.78rem', color: 'text.secondary' }}>
                    No transaction data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={formattedBetHistory.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          sx={{ borderTop: 'none', py: 0 }}
        />
      </>
    );
  };

  const renderTossTable = () => {
    const paginated = formattedTossBetHistory.slice(
      tossPage * tossRowsPerPage,
      tossPage * tossRowsPerPage + tossRowsPerPage
    );

    return (
      <>
        <TableContainer sx={{ maxHeight: 380, overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.neutral' }}>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Runner</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPowerUser ? (
                <TableRow sx={{ backgroundColor: '#FFC107' }}>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1, fontSize: '0.78rem' }}>Total ({formattedTossBetHistory.length} Bets)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1, fontSize: '0.78rem' }}>
                    ₹{formattedTossBetHistory.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                </TableRow>
              ) : paginated.length > 0 ? (
                paginated.map((row, index) => (
                  <TableRow key={`${row.client}-${index}`} hover>
                    <TableCell sx={{ py: 0.45, px: 1, fontSize: '0.78rem' }}>
                      {row.user} ({row.client})
                    </TableCell>
                    <TableCell sx={{ py: 0.45, px: 1 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.25,
                          py: 0.15,
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          color: '#000',
                          backgroundColor: '#83c2fc',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 'bold', mr: 0.5, color: '#000', fontSize: '0.72rem' }}
                        >
                          {row.selection}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 'bold',
                            background: '#fff',
                            borderRadius: '20px',
                            color: '#000',
                            padding: '1px 6px',
                            fontSize: '0.72rem',
                          }}
                        >
                          {row.rate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.45, px: 1, fontWeight: 600, fontSize: '0.78rem' }}>₹{row.amount.toLocaleString()}</TableCell>
                    <TableCell sx={{ py: 0.45, px: 1, fontSize: '0.78rem' }}>{row.team}</TableCell>
                    <TableCell sx={{ py: 0.45, px: 1, color: 'text.secondary', fontSize: '0.72rem' }}>{row.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 1.5, fontSize: '0.78rem', color: 'text.secondary' }}>
                    No toss bet data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={formattedTossBetHistory.length}
          page={tossPage}
          onPageChange={(_: unknown, newPage: number) => setTossPage(newPage)}
          rowsPerPage={tossRowsPerPage}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTossRowsPerPage(parseInt(e.target.value, 10));
            setTossPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          sx={{ borderTop: 'none', py: 0 }}
        />
      </>
    );
  };

  const renderFancySection = (runnerName: string, bets: BetData[]) => {
    const sessionData = findSessionExposure(runnerName, bets, exposureData?.sessionWisePotentialPL);

    return (
      <Paper
        key={runnerName}
        sx={{
          mb: 1.25,
          boxShadow: '0px 2px 10px rgba(0,0,0,0.06)',
          borderRadius: 1.5,
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
        }}
      >
        {/* Full-width solid green header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          onClick={() => toggleRunnerSection(runnerName)}
          sx={{
            backgroundColor: '#00A76F',
            py: 0.55,
            px: 1.25,
            cursor: 'pointer',
            userSelect: 'none',
            width: '100%',
          }}
        >
          <Typography color="#FFFFFF" variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.82rem' }}>
            {runnerName}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.75}>
            {(wonby === runnerName || bets.some((b) => b.status === 'WON' || b.result)) && (
              <Box
                display="flex"
                alignItems="center"
                px={1}
                py={0.2}
                borderRadius="20px"
                bgcolor="#FFC107"
              >
                <img src={win} alt="win" style={{ width: 14, marginRight: 4 }} />
                <Typography color="#000" fontWeight="bold" sx={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                  {(() => {
                    const res = bets.find((b) => b.result)?.result ?? wonby;
                    return res != null && res !== '' && !Number.isNaN(Number(res)) ? Math.round(Number(res)) : (res ?? '-');
                  })()}
                </Typography>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                toggleRunnerSection(runnerName);
              }}
              sx={{ color: '#FFFFFF', p: 0.25 }}
            >
              <Iconify
                icon={
                  openSections[runnerName]
                    ? 'eva:arrow-ios-upward-fill'
                    : 'eva:arrow-ios-downward-fill'
                }
                width={18}
                height={18}
              />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={!!openSections[runnerName]} timeout="auto" unmountOnExit>
          <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.neutral' }}>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Run</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>YES/NOT</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isPowerUser ? (
                    <TableRow sx={{ backgroundColor: '#FFC107' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1, fontSize: '0.78rem' }}>Total ({bets.length} Bets)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1, fontSize: '0.78rem' }}>
                        ₹{bets.reduce((sum: number, b: BetData) => sum + (Number(b.stake_amount) || 0), 0).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                    </TableRow>
                  ) : (
                    bets.map((bet) => (
                      <TableRow key={bet.id} hover>
                        <TableCell sx={{ py: 0.45, px: 1, fontSize: '0.78rem' }}>
                          {bet.user.name} ({bet.user.user_name})
                        </TableCell>
                        <TableCell sx={{ py: 0.45, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {bet.odds_value || bet.odds_rate ? (!Number.isNaN(Number(bet.odds_value || bet.odds_rate)) ? Math.round(Number(bet.odds_value || bet.odds_rate)) : (bet.odds_value || bet.odds_rate)) : '-'}
                        </TableCell>
                        <TableCell sx={{ py: 0.45, px: 1 }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1,
                              py: 0.15,
                              borderRadius: '20px',
                              fontWeight: 'bold',
                              color: '#000',
                              backgroundColor: bet.selection === 'Yes' ? '#83c2fc' : '#fda4b4',
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 0.5, color: '#000', fontSize: '0.72rem' }}>
                              {bet.selection}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 'bold',
                                background: '#fff',
                                borderRadius: '20px',
                                color: '#000',
                                padding: '1px 6px',
                                fontSize: '0.72rem',
                              }}
                            >
                              {Number(bet.odds_rate).toFixed(0)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 0.45, px: 1, fontWeight: 600, fontSize: '0.78rem' }}>₹{bet.stake_amount.toLocaleString()}</TableCell>
                        <TableCell sx={{ py: 0.45, px: 1, color: 'text.secondary', fontSize: '0.72rem' }}>{formatDateTime(bet.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <SessionRunPills sessionData={sessionData} />
          </Box>
        </Collapse>
      </Paper>
    );
  };

  // Main render
  return (
    <Box sx={{ p: { xs: 1, md: 1.5 }, pb: { xs: 10, md: 9 } }}>
      {/* Header */}
      <Card sx={{ mb: 1.25, boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)', borderRadius: 1.5 }}>
        <CardContent
          sx={{
            textAlign: 'center',
            bgcolor: '#00A76F',
            minHeight: 65,
            py: 1.25,
            px: 1.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#fff',
            '&:last-child': { pb: 1.25 },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.25, letterSpacing: -0.2 }}>
            {eventName}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, mb: wonby ? 0.5 : 0 }}>
            ({formattedDate})
          </Typography>
          {wonby && (
            <Chip
              avatar={
                <img
                  src={win}
                  alt="winner"
                  style={{ width: '18px', height: '18px', borderRadius: '50%' }}
                />
              }
              label={`Winner: ${wonby}`}
              sx={{
                mt: 0.5,
                px: 1,
                height: 24,
                backgroundColor: '#fff',
                color: '#E7001F',
                fontWeight: 800,
                fontSize: '0.75rem',
                alignSelf: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Team + Amount + Potential P/L Exposure Card */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 1.5,
          overflow: 'hidden',
          mb: 1.25,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Box
          sx={{
            bgcolor: '#00A76F',
            px: { xs: 1.25, sm: 1.5 },
            py: 0.55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.84rem', sm: '0.9rem' },
              color: '#fff',
              letterSpacing: 0.3,
            }}
          >
            TEAM EXPOSURE / POTENTIAL P&L
          </Typography>
          <Typography
            sx={{
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 700,
            }}
          >
            AMOUNT
          </Typography>
        </Box>
        <Box sx={{ px: { xs: 1.25, sm: 1.5 }, py: 0.5 }}>
          {teams.map((team, index) => {
            const teamPL = getTeamPL(team);
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.4,
                  px: 0.75,
                  borderRadius: 1,
                  bgcolor: index % 2 === 0 ? 'background.neutral' : 'transparent',
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.82rem', sm: '0.88rem' } }}>
                  {team}
                </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '0.82rem', sm: '0.88rem' },
                      color: teamPL >= 0 ? '#00A76F' : '#FF5630',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {teamPL >= 0 ? `+₹${teamPL.toFixed(2)}` : `-₹${Math.abs(teamPL).toFixed(2)}`}
                  </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Responsive: Mobile = Accordion tabs, Desktop = side-by-side */}
      {isMobile ? (
        <Box mt={1}>
          {/* Mobile: Accordion for Match */}
          <Accordion defaultExpanded sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden' }}>
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
              sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Match
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0.5 }}>
              {betHistoryLoading ? (
                <Typography sx={{ p: 1, fontSize: '0.8rem', color: 'text.secondary' }}>Loading bet history...</Typography>
              ) : betHistoryError ? (
                <Typography color="error" sx={{ p: 1, fontSize: '0.8rem' }}>Error loading bet history</Typography>
              ) : (
                renderMatchTable()
              )}
            </AccordionDetails>
          </Accordion>

          {/* Mobile: Accordion for Toss */}
          <Accordion sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden' }}>
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
              sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Toss
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0.5 }}>
              {betHistoryLoading ? (
                <Typography sx={{ p: 1, fontSize: '0.8rem', color: 'text.secondary' }}>Loading bet history...</Typography>
              ) : betHistoryError ? (
                <Typography color="error" sx={{ p: 1, fontSize: '0.8rem' }}>Error loading bet history</Typography>
              ) : (
                renderTossTable()
              )}
            </AccordionDetails>
          </Accordion>

          {/* Mobile: Accordion for Fancy Bets */}
          <Accordion defaultExpanded sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden' }}>
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
              sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Fancy Bets
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0.5 }}>
              {Object.entries(groupedFancyBets).length === 0 ? (
                <Typography sx={{ p: 1, textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                  No fancy bets available
                </Typography>
              ) : (
                Object.entries(groupedFancyBets).map(([runnerName, bets]) => {
                  const sessionData = findSessionExposure(runnerName, bets, exposureData?.sessionWisePotentialPL);

                  return (
                    <Box key={runnerName} mb={0.75} sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
                      <Paper sx={{ bgcolor: '#00A76F', color: 'white', borderRadius: 1.25, overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={1.25}
                        py={0.55}
                        onClick={() => toggleRunnerSection(runnerName)}
                        sx={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <Typography fontWeight="bold" color="white" fontSize="0.82rem">
                          {runnerName}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={0.75}>
                          {(wonby === runnerName ||
                            bets.some((b) => b.status === 'WON' || b.result)) && (
                            <Box
                              display="flex"
                              alignItems="center"
                              px={1}
                              py={0.2}
                              borderRadius="20px"
                              bgcolor="#FFC107"
                            >
                              <img src={win} alt="win" style={{ width: 14, marginRight: 4 }} />
                              <Typography color="#000" fontWeight="bold" fontSize="0.72rem" sx={{ whiteSpace: 'nowrap' }}>
                                {(() => {
                                  const res = bets.find((b) => b.result)?.result ?? wonby;
                                  return res != null && res !== '' && !Number.isNaN(Number(res)) ? Math.round(Number(res)) : (res ?? '-');
                                })()}
                              </Typography>
                            </Box>
                          )}

                          <IconButton
                            size="small"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              toggleRunnerSection(runnerName);
                            }}
                            sx={{ color: 'white', p: 0.25 }}
                          >
                            <Iconify
                              icon={
                                openSections[runnerName]
                                  ? 'eva:arrow-ios-upward-fill'
                                  : 'eva:arrow-ios-downward-fill'
                              }
                              width={18}
                              height={18}
                            />
                          </IconButton>
                        </Box>
                      </Box>

                      <Collapse in={!!openSections[runnerName]} timeout="auto" unmountOnExit>
                        <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                        <Paper sx={{ mt: 0, width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
                          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 600 }}>
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'background.neutral' }}>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Client</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Run</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>YES/NOT</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.5, px: 1, fontSize: '0.78rem' }}>Created</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {isPowerUser ? (
                                  <TableRow sx={{ backgroundColor: '#FFC107' }}>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1, fontSize: '0.78rem' }}>Total ({bets.length} Bets)</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1, fontSize: '0.78rem' }}>
                                      ₹{bets.reduce((sum: number, b: BetData) => sum + (Number(b.stake_amount) || 0), 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.5, px: 1 }}>--</TableCell>
                                  </TableRow>
                                ) : (
                                  bets.map((bet) => (
                                    <TableRow key={bet.id} hover>
                                      <TableCell sx={{ py: 0.45, px: 1, fontSize: '0.78rem' }}>
                                        {bet.user.name} ({bet.user.user_name})
                                      </TableCell>
                                      <TableCell sx={{ py: 0.45, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                        {bet.odds_value || bet.odds_rate ? (!Number.isNaN(Number(bet.odds_value || bet.odds_rate)) ? Math.round(Number(bet.odds_value || bet.odds_rate)) : (bet.odds_value || bet.odds_rate)) : '-'}
                                      </TableCell>
                                      <TableCell sx={{ py: 0.45, px: 1 }}>
                                        <Box
                                          sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            px: 1,
                                            py: 0.15,
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            color: '#000',
                                            backgroundColor:
                                              bet.selection === 'Yes' ? '#83c2fc' : '#fda4b4',
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            sx={{ fontWeight: 'bold', mr: 0.5, color: '#000', fontSize: '0.72rem' }}
                                          >
                                            {bet.selection}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontWeight: 'bold',
                                              background: '#fff',
                                              borderRadius: '20px',
                                              color: '#000',
                                              padding: '1px 6px',
                                              fontSize: '0.72rem',
                                            }}
                                          >
                                            {Number(bet.odds_rate).toFixed(0)}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ py: 0.45, px: 1, fontWeight: 600, fontSize: '0.78rem' }}>
                                        ₹{bet.stake_amount.toLocaleString()}
                                      </TableCell>
                                      <TableCell sx={{ py: 0.45, px: 1, color: 'text.secondary', fontSize: '0.72rem' }}>
                                        {formatDateTime(bet.createdAt)}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <SessionRunPills sessionData={sessionData} />
                        </Paper>
                      </Collapse>
                    </Paper>
                  </Box>
                  );
                })
              )}
            </AccordionDetails>
          </Accordion>

          {/* Mobile: Accordion for Summary / Totals */}
          <Accordion sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden' }}>
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
              sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Summary / Totals
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0.5 }}>
              <TableContainer
                component={Paper}
                sx={{
                  width: '100%',
                  overflowX: 'auto',
                  borderRadius: 1.5,
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.06)',
                }}
              >
                <Table size="small" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.neutral' }}>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Client</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Match (+/-)</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Session (+/-)</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Toss (+/-)</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>M.Com</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>S.Com</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>T.Com</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>NET.AMT</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>SHR.AMT</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>G. Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{renderSummaryTable()}</TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Box>
      ) : (
        // Desktop layout (compact side-by-side)
        <Grid container spacing={1.5} mt={0.5}>
          {/* Left: Match table */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 1.5, boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)' }}>
              <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Typography variant="subtitle2" mb={1} sx={{ fontWeight: 800, fontSize: '0.88rem' }}>
                  Match
                </Typography>
                {betHistoryLoading ? (
                  <Typography sx={{ p: 1, fontSize: '0.8rem', color: 'text.secondary' }}>Loading bet history...</Typography>
                ) : betHistoryError ? (
                  <Typography color="error" sx={{ p: 1, fontSize: '0.8rem' }}>Error loading bet history</Typography>
                ) : (
                  renderMatchTable()
                )}
              </CardContent>
            </Card>

            {/* Toss table */}
            <Card sx={{ borderRadius: 1.5, boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)', mt: 1.5 }}>
              <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Typography variant="subtitle2" mb={1} sx={{ fontWeight: 800, fontSize: '0.88rem' }}>
                  Toss
                </Typography>
                {betHistoryLoading ? (
                  <Typography sx={{ p: 1, fontSize: '0.8rem', color: 'text.secondary' }}>Loading bet history...</Typography>
                ) : betHistoryError ? (
                  <Typography color="error" sx={{ p: 1, fontSize: '0.8rem' }}>Error loading bet history</Typography>
                ) : (
                  renderTossTable()
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Fancy bets grouped */}
          <Grid item xs={12} md={5} sx={{ minWidth: 0 }}>
            {Object.entries(groupedFancyBets).length === 0 ? (
              <Typography sx={{ p: 1.5, textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                No fancy bets available
              </Typography>
            ) : (
              Object.entries(groupedFancyBets).map(([runnerName, bets]) =>
                renderFancySection(runnerName, bets)
              )
            )}
          </Grid>

          {/* The summary / totals table */}
          <Grid item xs={12} mt={1.5} md={12}>
            <TableContainer
              component={Paper}
              sx={{
                width: '100%',
                overflowX: 'auto',
                boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)',
                borderRadius: 1.5,
              }}
            >
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.neutral' }}>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Client</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Match (+/-)</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Session (+/-)</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Toss (+/-)</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>M.Com</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>S.Com</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>T.Com</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>NET.AMT</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>SHR.AMT</TableCell>
                    <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', fontWeight: 'bold' }}>G. Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{renderSummaryTable()}</TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* Fixed bottom totals */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          width: '100%',
          px: 1.5,
          pb: 1,
          pt: 0.5,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.neutral' }}>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>Client</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>Match (+/-)</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>Session (+/-)</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>Toss (+/-)</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>M.Com</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>S.Com</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>T.Com</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>NET.AMT</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>SHR.AMT</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 'bold' }}>G. Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderTotalRow()}</TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default DisplayMatch;
