import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
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

import { useCricketMatchSocket } from 'src/hooks/useCricketMatchSocket';

import { formatUTCDateTime12H } from 'src/utils/date';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';
import useBetHistroyApi from 'src/Api/matchApi/useBetHistroyApi';

import { calculateCommission } from 'src/utils/commissionUtils';
import { Iconify } from 'src/components/iconify';

import LiveTv from './LiveTv';
import win from '../../../../public/assets/win.png';
import { SessionRunPills, findSessionExposure } from './SessionRunPills';

interface BetData {
  id: string;
  _id?: string;
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
  selection_id?: number;
  sid?: any;
}

// Add types for summary row and match/fancy bet
type SummaryRow = {
  userFullName: string;
  client: string;
  userName?: string;
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

type FancyCategory = 'Normal' | 'Over By Over' | 'Ball By Ball';

const FANCY_CATEGORY_COLORS: Record<FancyCategory, string> = {
  Normal: '#00A76F',
  'Over By Over': '#FFAB00',
  'Ball By Ball': '#8E33FF',
};

const parseSno = (val: any): number => {
  if (val === null || val === undefined || val === '') return 999999;
  const num = Number(val);
  return Number.isNaN(num) ? 999999 : num;
};

const compareFancySessions = (a: any, b: any): number => {
  const snoA = parseSno(a.sno);
  const snoB = parseSno(b.sno);
  if (snoA !== snoB) {
    return snoA - snoB;
  }
  return Number(a.sid || 0) - Number(b.sid || 0);
};

const getFancyCategory = (item: any): FancyCategory => {
  if (!item) return 'Normal';

  const mname = String(item.mname || '').trim().toLowerCase();
  const mtype = String(item.mtype || '').trim().toLowerCase();
  const gtype = String(item.gtype || '').trim().toLowerCase();
  const market = String(item.market || '').trim().toLowerCase();
  const categoryField = String(item.category || item.cat || '').trim().toLowerCase();

  // 1. BALL BY BALL from upstream feed fields
  if (
    mname === 'ball by ball' ||
    mname === 'ballbyball' ||
    mname === 'ball' ||
    mtype === 'ball by ball' ||
    mtype === 'ballbyball' ||
    mtype === 'ball' ||
    gtype === 'ball by ball' ||
    gtype === 'ballbyball' ||
    gtype === 'ball_by_ball' ||
    gtype === 'ball' ||
    market === 'ball by ball' ||
    market === 'ballbyball' ||
    market === 'ball' ||
    categoryField === 'ball by ball' ||
    categoryField === 'ballbyball' ||
    categoryField === 'ball'
  ) {
    return 'Ball By Ball';
  }

  // 2. OVER BY OVER from upstream feed fields
  if (
    mname === 'over by over' ||
    mname === 'overbyover' ||
    mname === 'over' ||
    mtype === 'over by over' ||
    mtype === 'overbyover' ||
    mtype === 'over' ||
    gtype === 'over by over' ||
    gtype === 'overbyover' ||
    gtype === 'over_by_over' ||
    gtype === 'over' ||
    gtype === 'meter' ||
    market === 'over by over' ||
    market === 'overbyover' ||
    market === 'over' ||
    categoryField === 'over by over' ||
    categoryField === 'overbyover' ||
    categoryField === 'over'
  ) {
    return 'Over By Over';
  }

  // 3. Normal / default for all other sessions
  return 'Normal';
};

const UNDECLARED_COLUMNS = [
  { id: 'client', label: 'Client', width: '22%', minWidth: 130, align: 'left' as const },
  { id: 'team', label: 'Team/Runner', width: '20%', minWidth: 120, align: 'left' as const },
  { id: 'run', label: 'Run', width: '8%', minWidth: 50, align: 'center' as const },
  { id: 'type', label: 'Bet Type', width: '12%', minWidth: 75, align: 'center' as const },
  { id: 'modeRate', label: 'Mode/Rate', width: '14%', minWidth: 90, align: 'center' as const },
  { id: 'amount', label: 'Amount', width: '12%', minWidth: 80, align: 'right' as const },
  { id: 'created', label: 'Created', width: '12%', minWidth: 80, align: 'right' as const },
];

const SUMMARY_COLUMNS = [
  { id: 'client', label: 'Client', width: '16%', minWidth: 140, align: 'left' as const },
  { id: 'match', label: 'Match (+/-)', width: '8.4%', minWidth: 78, align: 'right' as const },
  { id: 'session', label: 'Session (+/-)', width: '8.4%', minWidth: 78, align: 'right' as const },
  { id: 'toss', label: 'Toss (+/-)', width: '8.4%', minWidth: 78, align: 'right' as const },
  { id: 'total', label: 'Total', width: '8.4%', minWidth: 78, align: 'right' as const },
  { id: 'mCom', label: 'M.Com', width: '8%', minWidth: 72, align: 'right' as const },
  { id: 'sCom', label: 'S.Com', width: '8%', minWidth: 72, align: 'right' as const },
  { id: 'tCom', label: 'T.Com', width: '8%', minWidth: 72, align: 'right' as const },
  { id: 'netAmt', label: 'NET.AMT', width: '8.4%', minWidth: 78, align: 'right' as const },
  { id: 'shrAmt', label: 'SHR.AMT', width: '8.4%', minWidth: 78, align: 'right' as const },
  { id: 'gTotal', label: 'G. Total', width: '8.6%', minWidth: 80, align: 'right' as const },
];

export default function CricketMatchLiveData() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tossPage, setTossPage] = useState(0);
  const [tossRowsPerPage, setTossRowsPerPage] = useState(10);
  const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { fetchMe } = useMeApi();

  const { fetchTableData, Exposure, FatchUpdateMatchData } = useMatchApi();
  const { fetchBetHistory } = useBetHistroyApi();
  const { gameId } = useParams<{ gameId: string }>();

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);

    // Get day, month, year
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);

    // Get time components
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };
  // Fetch user data first
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  // Extract user ID
  const userId = userData?.data?._id;
  const userType = userData?.data?.type;
  const isPowerUser = userType === 'power_user';

  // Match Data via Socket.IO
  const {
    matchData: socketMatchData,
    isLoading: matchLoading,
    error: matchError,
    betHistoryData: socketBetHistory,
    betUpdate,
  } = useCricketMatchSocket(gameId);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (betUpdate) {
      queryClient.invalidateQueries({ queryKey: ['exposureData'] });
    }
  }, [betUpdate, queryClient]);

  // REST fallback for match data
  const { data: restMatchResponse, isLoading: isRestLoading } = useQuery({
    queryKey: ['restMatchData', gameId],
    queryFn: () => (gameId ? FatchUpdateMatchData(gameId) : Promise.reject(new Error('Missing gameId'))),
    enabled: !!gameId,
    refetchInterval: 5000,
  });

  const activeMatch = socketMatchData?.match || restMatchResponse?.match || restMatchResponse?.data;
  const matchData = socketMatchData || (activeMatch ? { match: activeMatch } : null);

  // Extract current match ID
  const currentMatchId = activeMatch?._id;

  // Fallback for bet history
  const { data: restBetResponse } = useQuery({
    queryKey: ['restBetHistory', currentMatchId, userId],
    queryFn: () =>
      currentMatchId && userId
        ? fetchBetHistory(currentMatchId, userId)
        : Promise.reject(new Error('Missing match ID or user ID')),
    enabled: !!currentMatchId && !!userId,
    refetchInterval: 3000,
  });

  const betHistoryData =
    socketBetHistory && socketBetHistory.length > 0
      ? socketBetHistory
      : restBetResponse?.data || restBetResponse?.bets || [];

  // Add this query for table data
  const { data: tableData, isLoading: isTableLoading } = useQuery({
    queryKey: ['tableData', userId, currentMatchId],
    queryFn: () =>
      userId && currentMatchId
        ? fetchTableData(userId, currentMatchId)
        : Promise.reject(new Error('Missing user ID or match ID')),
    enabled: !!userId && !!currentMatchId,
    refetchInterval: 2000,
  });

  // EXPOSURE DATA API CALL
  const { data: exposureData } = useQuery({
    queryKey: ['exposureData', userId, currentMatchId],
    queryFn: () =>
      userId && currentMatchId
        ? Exposure(userId, currentMatchId)
        : Promise.reject(new Error('Missing user ID or match ID')),
    enabled: !!userId && !!currentMatchId,
    refetchInterval: 2000,
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
      const shareDiff = userShare - adminShare; // 100 - 80 = 20%, 100 - 95 = 5%

      Object.entries(admin.potential_profitloss || {}).forEach(
        ([teamName, teamPL]: [string, any]) => {
          const rawTeam = String(teamName || '').trim();
          const normTeam = rawTeam.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
          const shareAmount = (shareDiff / 100) * Number(teamPL);
          const inv = shareAmount * -1; // SIGN INVERT (- becomes +, + becomes -)

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

  const calculateTossWisePotentialPL = () => {
    if (exposureData?.tossWisePotentialPL && Object.keys(exposureData.tossWisePotentialPL).length > 0) {
      return exposureData.tossWisePotentialPL;
    }

    const matchesList = exposureData?.tossMatches || exposureData?.matches;
    if (!matchesList || !userShare) return {};

    const tossWisePL: Record<string, number> = {};

    matchesList.forEach((admin: any) => {
      const adminShare = admin.share || 0;
      const shareDiff = userShare - adminShare;

      const potPL = admin.toss_potential_profitloss || admin.potential_profitloss || {};
      Object.entries(potPL).forEach(
        ([teamName, teamPL]: [string, any]) => {
          const rawTeam = String(teamName || '').trim();
          const normTeam = rawTeam.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
          const shareAmount = (shareDiff / 100) * Number(teamPL);
          const inv = shareAmount * -1; // SIGN INVERT

          tossWisePL[rawTeam] = (tossWisePL[rawTeam] || 0) + inv;
          if (normTeam && normTeam !== rawTeam) {
            tossWisePL[normTeam] = (tossWisePL[normTeam] || 0) + inv;
          }
        }
      );
    });

    return tossWisePL;
  };

  const tossWisePotentialPL = calculateTossWisePotentialPL();

  const getTossPL = (rname: string, sid?: any) => {
    if (!tossWisePotentialPL || Object.keys(tossWisePotentialPL).length === 0) return 0;
    const raw = String(rname || '').trim();
    if (tossWisePotentialPL[raw] !== undefined) return tossWisePotentialPL[raw];

    if (sid !== undefined && sid !== null) {
      const sidStr = String(sid).trim();
      if (tossWisePotentialPL[sidStr] !== undefined) return tossWisePotentialPL[sidStr];
    }

    const norm = raw.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
    if (tossWisePotentialPL[norm] !== undefined) return tossWisePotentialPL[norm];

    const matchingKey = Object.keys(tossWisePotentialPL).find(
      (k) => k.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim() === norm
    );
    if (matchingKey) return tossWisePotentialPL[matchingKey];
    return 0;
  };

  const processSummaryData = (matches: any[]): SummaryRow[] => {
    const summaryRows: SummaryRow[] = [];

    matches.forEach((match: any) => {
      if (match?.summary && Array.isArray(match.summary) && match.summary.length > 0) {
        summaryRows.push(...match.summary);
        return;
      }

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
          <TableCell colSpan={11} align="center" sx={{ py: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
            Loading summary data...
          </TableCell>
        </TableRow>
      );
    }
    if (isPowerUser) {
      return null;
    }
    if (!summaryData || summaryData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={11} align="center" sx={{ py: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
            No summary data available
          </TableCell>
        </TableRow>
      );
    }
    return (
      <>
        {summaryData.map((row, index) => (
          <TableRow key={index} hover>
            <TableCell sx={{ py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.userFullName} ({row.userName})
            </TableCell>
            <TableCell align="right" sx={{ color: row.matchPL >= 0 ? 'green' : 'red', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              ₹{row.matchPL.toFixed(2)}
            </TableCell>
            <TableCell align="right" sx={{ color: row.sessionPL >= 0 ? 'green' : 'red', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              ₹{row.sessionPL.toFixed(2)}
            </TableCell>
            <TableCell align="right" sx={{ color: (row.tossPL || 0) >= 0 ? 'green' : 'red', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              ₹{(row.tossPL || 0).toFixed(2)}
            </TableCell>
            <TableCell align="right" sx={{ color: row.total >= 0 ? 'green' : 'red', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              ₹{row.total.toFixed(2)}
            </TableCell>
            <TableCell align="right" sx={{ py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>₹{row.matchCommission.toFixed(2)}</TableCell>
            <TableCell align="right" sx={{ py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>₹{row.sessionCommission.toFixed(2)}</TableCell>
            <TableCell align="right" sx={{ py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>₹{row.totalCommission.toFixed(2)}</TableCell>
            <TableCell align="right" sx={{ color: row.netAmount >= 0 ? 'green' : 'red', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              ₹{row.netAmount.toFixed(2)}
            </TableCell>
            <TableCell align="right" sx={{ color: row.shareAmount >= 0 ? 'green' : 'red', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              ₹{row.shareAmount.toFixed(2)}
            </TableCell>
            <TableCell align="right" sx={{ color: row.grandTotal >= 0 ? 'green' : 'red', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
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
        <TableCell sx={{ fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Total</TableCell>
        <TableCell align="right" sx={{ color: totals.matchPL >= 0 ? 'green' : 'red', fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          ₹{totals.matchPL.toFixed(2)}
        </TableCell>
        <TableCell align="right" sx={{ color: totals.sessionPL >= 0 ? 'green' : 'red', fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          ₹{totals.sessionPL.toFixed(2)}
        </TableCell>
        <TableCell align="right" sx={{ color: totals.tossPL >= 0 ? 'green' : 'red', fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          ₹{totals.tossPL.toFixed(2)}
        </TableCell>
        <TableCell align="right" sx={{ color: totals.total >= 0 ? 'green' : 'red', fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          ₹{totals.total.toFixed(2)}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>₹{totals.matchCommission.toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>₹{totals.sessionCommission.toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>₹{totals.totalCommission.toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ color: totals.netAmount >= 0 ? 'green' : 'red', fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          ₹{totals.netAmount.toFixed(2)}
        </TableCell>
        <TableCell align="right" sx={{ color: totals.shareAmount >= 0 ? 'green' : 'red', fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          ₹{totals.shareAmount.toFixed(2)}
        </TableCell>
        <TableCell align="right" sx={{ color: totals.grandTotal >= 0 ? 'green' : 'red', fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          ₹{totals.grandTotal.toFixed(2)}
        </TableCell>
      </TableRow>
    );
  };

  const renderSummaryColGroup = () => (
    <colgroup>
      {SUMMARY_COLUMNS.map((col) => (
        <col key={col.id} style={{ width: col.width, minWidth: col.minWidth }} />
      ))}
    </colgroup>
  );

  const renderSummaryTableHead = () => (
    <TableHead>
      <TableRow sx={{ bgcolor: 'background.neutral' }}>
        {SUMMARY_COLUMNS.map((col) => (
          <TableCell
            key={col.id}
            align={col.align}
            sx={{
              py: 0.55,
              px: 1,
              fontSize: '0.78rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              width: col.width,
              minWidth: col.minWidth,
            }}
          >
            {col.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const renderUndeclaredColGroup = () => (
    <colgroup>
      {UNDECLARED_COLUMNS.map((col) => (
        <col key={col.id} style={{ width: col.width, minWidth: col.minWidth }} />
      ))}
    </colgroup>
  );

  const renderUndeclaredTableHead = () => (
    <TableHead>
      <TableRow sx={{ bgcolor: 'background.neutral' }}>
        {UNDECLARED_COLUMNS.map((col) => (
          <TableCell
            key={col.id}
            align={col.align}
            sx={{
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              py: 0.55,
              px: 1,
              fontSize: '0.78rem',
              width: col.width,
              minWidth: col.minWidth,
            }}
          >
            {col.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const renderUndeclaredBetsBody = () => {
    if (isPowerUser) {
      return (
        <TableRow sx={{ backgroundColor: '#FFC107' }}>
          <TableCell sx={{ fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
            Total ({last10UndeclaredBets.length} Bets)
          </TableCell>
          <TableCell sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
            ₹{last10UndeclaredBets.reduce((sum: number, b: BetData) => sum + (Number(b.stake_amount) || 0), 0).toLocaleString()}
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
        </TableRow>
      );
    }

    if (last10UndeclaredBets.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} align="center" sx={{ py: 1.5, fontSize: '0.78rem', color: 'text.secondary' }}>
            No undeclared bets available
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {last10UndeclaredBets.map((bet: any) => {
          const isFancy = (bet.bet_type || '').toUpperCase() === 'FANCY';
          const isToss = (bet.bet_type || '').toUpperCase() === 'TOSS';
          const isPositive = bet.selection === 'Yes' || bet.selection === 'Back';

          const resolvedTeam = (
            bet.team_name ||
            bet.runner_name ||
            (isToss
              ? (bet.selection_id === 2501 || String(bet.sid) === '2501'
                  ? activeMatch?.team_a || 'Team A'
                  : activeMatch?.team_b || 'Team B')
              : '-')
          ).replace(/\.+$/, '').trim();

          const clientDisplay = bet.user?.name
            ? `${bet.user?.name} (${bet.user?.user_name})`
            : bet.user?.user_name || 'N/A';

          return (
            <TableRow key={bet.id || bet._id} hover>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {clientDisplay}
              </TableCell>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {resolvedTeam}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.5, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                {isFancy ? (bet.odds_value != null && bet.odds_value !== '' && !Number.isNaN(Number(bet.odds_value)) ? Math.round(Number(bet.odds_value)) : (bet.odds_value || '-')) : '-'}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.5, px: 1 }}>
                <Chip
                  size="small"
                  label={isToss ? 'Toss' : isFancy ? 'Fancy' : 'Bookmaker'}
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: isToss ? '#00A76F' : isFancy ? '#9c27b0' : '#ff9800',
                  }}
                />
              </TableCell>
              <TableCell align="center" sx={{ py: 0.5, px: 1 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1,
                    py: 0.15,
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    color: '#000',
                    backgroundColor: isPositive ? '#83c2fc' : '#fda4b4',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 0.5, color: '#000', fontSize: '0.72rem' }}>
                    {bet.selection || 'Back'}
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
                    {isFancy || isToss
                      ? Number(bet.odds_rate || 95).toFixed(0)
                      : Number(bet.odds_rate || 0).toFixed(2)}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1, fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                ₹{(Number(bet.stake_amount) || 0).toLocaleString()}
              </TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1, color: 'text.secondary', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                {formatDateTime(bet.createdAt)}
              </TableCell>
            </TableRow>
          );
        })}
        <TableRow sx={{ backgroundColor: '#FFC107' }}>
          <TableCell sx={{ fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
            Total ({last10UndeclaredBets.length} Bets)
          </TableCell>
          <TableCell sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.55, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
            ₹{last10UndeclaredBets.reduce((sum: number, b: BetData) => sum + (Number(b.stake_amount) || 0), 0).toLocaleString()}
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.55, px: 1 }}>--</TableCell>
        </TableRow>
      </>
    );
  };

  const toggleSection = (runnerName: string) => {
    setOpenSections((prev: Record<string, boolean>) => ({ ...prev, [runnerName]: !prev[runnerName] }));
  };

  if ((matchLoading || isRestLoading) && !activeMatch) {
    return (
      <Box p={2}>
        <Typography>Loading match data...</Typography>
      </Box>
    );
  }

  if (!activeMatch) {
    return (
      <Box p={2}>
        <Typography color="error">Match not found or data currently unavailable.</Typography>
      </Box>
    );
  }

  const {
    eventName,
    eventTime,
    bookMakerOdds = [],
    fancyOdds = [],
    wonby,
    teams = [],
  } = activeMatch;

  const activeFancyOdds = Array.isArray(fancyOdds)
    ? fancyOdds.filter(
      (item: any) =>
        !item.isDeclared &&
        item.isDeclared !== 'true' &&
        item.isFancyEnded !== true &&
        item.isActive === true &&
        String(item.status || '').toUpperCase() !== 'DECLARED' &&
        (item.resultScore == null || String(item.resultScore).trim() === '') &&
        String(item.sid) !== '2501' &&
        String(item.sid) !== '2502'
    ).sort(compareFancySessions)
    : [];

  const tossOdds = Array.isArray(fancyOdds)
    ? fancyOdds.filter((item: any) => String(item.sid) === '2501' || String(item.sid) === '2502')
    : [];

  const fancyCategories: FancyCategory[] = ['Normal', 'Over By Over', 'Ball By Ball'];
  const groupedFancyOdds: Record<FancyCategory, any[]> = {
    Normal: [],
    'Over By Over': [],
    'Ball By Ball': [],
  };
  activeFancyOdds.forEach((row: any) => {
    const cat = getFancyCategory(row);
    groupedFancyOdds[cat].push(row);
  });
  fancyCategories.forEach((cat) => {
    groupedFancyOdds[cat].sort(compareFancySessions);
  });

  const formattedDate = formatUTCDateTime12H(eventTime);

  // Match transactions formatting - Use BetData interface
  const allowedStatuses = ['PENDING', 'WON', 'LOST', 'ACTIVE'];
  const matchBetsRaw = (betHistoryData || []).filter(
    (b: BetData) =>
      (b?.bet_type || '').toUpperCase() !== 'FANCY' &&
      (b?.bet_type || '').toUpperCase() !== 'TOSS' &&
      allowedStatuses.includes((b.status || '').toUpperCase())
  );

  const formattedBetHistory = matchBetsRaw.map((bet: BetData) => {
    const displayTeam = bet.team_name || 'N/A';

    return {
      client: bet.user?.user_name || 'N/A',
      user: bet.user?.name || 'N/A',
      amount: bet.stake_amount,
      rate: Number(bet.odds_rate).toFixed(2),
      mode: bet.selection === 'Back' ? 'L' : 'K',
      team: displayTeam,
      selection: bet.selection,
      date: formatDateTime(bet.createdAt),
    };
  });

  // Fancy bets grouping
  const fancyBets = (betHistoryData || []).filter(
    (bet: any) =>
      bet.bet_type === 'FANCY' &&
      allowedStatuses.includes((bet.status || '').toUpperCase()) &&
      !(bet.isEnabled === false && bet.isFancyEnded === true)
  );

  const last10UndeclaredBets = betHistoryData
    ? betHistoryData
      .filter((bet: BetData) => (bet.status || '').toUpperCase() === 'PENDING' || (bet.status || '').toUpperCase() === 'ACTIVE')
      .sort((a: BetData, b: BetData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
    : [];

  const groupedFancyBets = fancyBets.reduce((acc: Record<string, BetData[]>, bet: BetData) => {
    const runnerName = bet.runner_name || 'Unknown';
    if (!acc[runnerName]) acc[runnerName] = [];
    acc[runnerName].push(bet);
    return acc;
  }, {} as Record<string, BetData[]>);

  // Toss bets grouping & formatting
  const tossBetsRaw = (betHistoryData || []).filter(
    (b: BetData) =>
      (b?.bet_type || '').toUpperCase() === 'TOSS' &&
      allowedStatuses.includes((b.status || '').toUpperCase())
  );

  const formattedTossBetHistory = tossBetsRaw.map((bet: BetData) => {
    const displayTeam = bet.runner_name || bet.team_name || 'N/A';

    return {
      client: bet.user?.user_name || 'N/A',
      user: bet.user?.name || 'N/A',
      amount: bet.stake_amount,
      rate: Number(bet.odds_rate || 95).toFixed(2),
      mode: 'L',
      team: displayTeam,
      selection: bet.selection || 'Back',
      date: formatDateTime(bet.createdAt),
    };
  });

  const isTossDeclared =
    (Array.isArray(tossOdds) &&
      tossOdds.some(
        (item: any) =>
          item.isDeclared === true ||
          String(item.status || '').toUpperCase() === 'DECLARED' ||
          (item.resultScore != null && String(item.resultScore).trim() !== '')
      )) ||
    (Array.isArray(tossBetsRaw) && tossBetsRaw.some((b: any) => b.status === 'WON' || b.status === 'LOST'));

  // Toss table with pagination
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
              <TableRow sx={{ backgroundColor: '#212B36' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Mode/Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Runner</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPowerUser ? (
                <TableRow sx={{ backgroundColor: '#FFC107' }}>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>Total ({formattedTossBetHistory.length} Bets)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>--</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>
                    ₹{formattedTossBetHistory.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>--</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>--</TableCell>
                </TableRow>
              ) : paginated.length > 0 ? (
                paginated.map((row: any, index: any) => (
                  <TableRow key={`${row.client}-${index}`} hover>
                    <TableCell sx={{ py: 0.75 }}>
                      {row.user} ({row.client})
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.25,
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          color: '#000',
                          backgroundColor: '#83c2fc',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 'bold', mr: 0.5, color: '#000' }}
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
                            padding: '1px 7px',
                          }}
                        >
                          {row.rate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontWeight: 600 }}>₹{row.amount.toLocaleString()}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{row.team}</TableCell>
                    <TableCell sx={{ py: 0.75, color: 'text.secondary', fontSize: '0.78rem' }}>{row.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
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

  // Match table with pagination
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
              <TableRow sx={{ backgroundColor: '#212B36' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Mode/Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Team</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1aff', py: 0.75 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPowerUser ? (
                <TableRow sx={{ backgroundColor: '#FFC107' }}>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>Total ({formattedBetHistory.length} Bets)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>--</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>
                    ₹{formattedBetHistory.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>--</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.75 }}>--</TableCell>
                </TableRow>
              ) : paginated.length > 0 ? (
                paginated.map((row: any, index: any) => (
                  <TableRow key={`${row.client}-${index}`} hover>
                    <TableCell sx={{ py: 0.75 }}>
                      {row.user} ({row.client})
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.25,
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          color: '#fff',
                          backgroundColor: row.selection === 'Back' ? '#83c2fc' : '#fda4b4',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 'bold', mr: 0.5, color: '#000' }}
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
                            padding: '1px 7px',
                          }}
                        >
                          {row.rate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontWeight: 600 }}>₹{row.amount.toLocaleString()}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{row.team}</TableCell>
                    <TableCell sx={{ py: 0.75, color: 'text.secondary', fontSize: '0.78rem' }}>{row.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
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

  const BookmakerOddsTable = (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        mb: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header with solid theme color #00A76F */}
      <Box
        sx={{
          bgcolor: '#00A76F',
          px: { xs: 1.25, sm: 1.5 },
          py: 0.65,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.84rem', sm: '0.92rem' },
              color: '#fff',
              letterSpacing: 0.4,
              lineHeight: 1.2,
            }}
          >
            BOOKMAKER
          </Typography>
          <Typography
            sx={{
              fontSize: '0.68rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 600,
              lineHeight: 1.1,
              mt: 0.1,
            }}
          >
            Min: 500 Max: 200K
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              bgcolor: '#74b9ff',
              color: '#000',
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              borderRadius: 1.25,
              width: { xs: 58, sm: 72 },
              py: 0.35,
              textAlign: 'center',
            }}
          >
            Back
          </Box>
          <Box
            sx={{
              bgcolor: '#fba2b3',
              color: '#000',
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              borderRadius: 1.25,
              width: { xs: 58, sm: 72 },
              py: 0.35,
              textAlign: 'center',
            }}
          >
            Lay
          </Box>
        </Stack>
      </Box>

      {/* Body Rows */}
      <Box>
        {Array.isArray(bookMakerOdds) &&
          bookMakerOdds.length > 0 &&
          (bookMakerOdds as any)[0]?.bm1?.oddDatas?.length > 0 ? (
          (bookMakerOdds as any)[0].bm1.oddDatas.map((row: any, index: number) => {
            const isBackSusp = Number(row.b1) >= 100 || Number(row.b1) === 0;
            const isLaySusp = Number(row.l1) >= 100 || Number(row.l1) === 0;

            const teamName = String(row.rname || '').trim();
            const teamPL = getTeamPL(row.rname);

            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: { xs: 1.25, sm: 1.5 },
                  py: 0.65,
                  borderBottom: index < (bookMakerOdds as any)[0].bm1.oddDatas.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Team Name & P/L */}
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '0.85rem', sm: '0.92rem' },
                      color: 'text.primary',
                      lineHeight: 1.2,
                    }}
                  >
                    {row.rname}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: teamPL >= 0 ? '#00A76F' : 'error.main',
                      mt: 0.15,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {teamPL >= 0 ? '+' : ''}
                    {teamPL.toFixed(2)}
                  </Typography>
                </Box>

                {/* Back & Lay Buttons */}
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {/* Back Box */}
                  {isBackSusp ? (
                    <Box
                      sx={{
                        bgcolor: '#475569',
                        width: { xs: 58, sm: 72 },
                        height: 38,
                        borderRadius: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:lock-bold" width={16} sx={{ color: '#fff' }} />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        bgcolor: '#74b9ff',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: { xs: '0.88rem', sm: '0.98rem' },
                        borderRadius: 1.25,
                        width: { xs: 58, sm: 72 },
                        height: 38,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'default',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      }}
                    >
                      {Number(row.b1).toFixed(2)}
                    </Box>
                  )}

                  {/* Lay Box */}
                  {isLaySusp ? (
                    <Box
                      sx={{
                        bgcolor: '#524346',
                        width: { xs: 58, sm: 72 },
                        height: 38,
                        borderRadius: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:lock-bold" width={16} sx={{ color: '#fff' }} />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        bgcolor: '#fba2b3',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: { xs: '0.88rem', sm: '0.98rem' },
                        borderRadius: 1.25,
                        width: { xs: 58, sm: 72 },
                        height: 38,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'default',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      }}
                    >
                      {Number(row.l1).toFixed(2)}
                    </Box>
                  )}
                </Stack>
              </Box>
            );
          })
        ) : (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600} fontSize="0.8rem">
              SUSPENDED
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  const TossOddsTable = (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        mb: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header with solid theme color #00A76F */}
      <Box
        sx={{
          bgcolor: '#00A76F',
          px: { xs: 1.25, sm: 1.5 },
          py: 0.65,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.84rem', sm: '0.92rem' },
              color: '#fff',
              letterSpacing: 0.4,
              lineHeight: 1.2,
            }}
          >
            TOSS
          </Typography>
          <Typography
            sx={{
              fontSize: '0.68rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 600,
              lineHeight: 1.1,
              mt: 0.1,
            }}
          >
            Min: 100 Max: 50K
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              bgcolor: '#74b9ff',
              color: '#000',
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              borderRadius: 1.25,
              width: { xs: 58, sm: 72 },
              py: 0.35,
              textAlign: 'center',
            }}
          >
            Back
          </Box>
        </Stack>
      </Box>

      {/* Body Rows */}
      <Box>
        {tossOdds && tossOdds.length > 0 ? (
          tossOdds.map((row: any, index: number) => {
            const isSuspended =
              row.status === 'SUSPENDED' ||
              row.isFancyEnded === true ||
              row.isDeclared === true ||
              activeMatch?.declared === true;

            const teamPL = getTossPL(row.rname, row.sid);

            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: { xs: 1.25, sm: 1.5 },
                  py: 0.65,
                  borderBottom: index < tossOdds.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Runner Name & P/L */}
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '0.85rem', sm: '0.92rem' },
                      color: 'text.primary',
                      lineHeight: 1.2,
                    }}
                  >
                    {row.rname || `Runner ${row.sid}`}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: teamPL >= 0 ? '#00A76F' : 'error.main',
                      mt: 0.15,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {teamPL >= 0 ? '+' : ''}
                    {teamPL.toFixed(2)}
                  </Typography>
                </Box>

                {/* Back Box (Fixed Odds 95) */}
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {isSuspended ? (
                    <Box
                      sx={{
                        bgcolor: '#475569',
                        width: { xs: 58, sm: 72 },
                        height: 38,
                        borderRadius: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:lock-bold" width={16} sx={{ color: '#fff' }} />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        bgcolor: '#74b9ff',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: { xs: '0.88rem', sm: '0.98rem' },
                        borderRadius: 1.25,
                        width: { xs: 58, sm: 72 },
                        height: 38,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'default',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      }}
                    >
                      95
                    </Box>
                  )}
                </Stack>
              </Box>
            );
          })
        ) : (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600} fontSize="0.8rem">
              No Toss Odds Available
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  const FancyOddsTable = (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        mb: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header with solid theme color #00A76F */}
      <Box
        sx={{
          bgcolor: '#00A76F',
          px: { xs: 1.25, sm: 1.5 },
          py: 0.65,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.84rem', sm: '0.92rem' },
              color: '#fff',
              letterSpacing: 0.4,
              lineHeight: 1.2,
            }}
          >
            SESSION / FANCY
          </Typography>
          <Typography
            sx={{
              fontSize: '0.68rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 600,
              lineHeight: 1.1,
              mt: 0.1,
            }}
          >
            Min: 100 Max: 10K
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              bgcolor: '#fba2b3',
              color: '#000',
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              borderRadius: 1.25,
              width: { xs: 58, sm: 72 },
              py: 0.35,
              textAlign: 'center',
            }}
          >
            Not
          </Box>
          <Box
            sx={{
              bgcolor: '#74b9ff',
              color: '#000',
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              borderRadius: 1.25,
              width: { xs: 58, sm: 72 },
              py: 0.35,
              textAlign: 'center',
            }}
          >
            Yes
          </Box>
        </Stack>
      </Box>

      {/* Body Rows - Grouped by Category in Continuous List View */}
      <Box>
        {activeFancyOdds.length ? (
          (() => {
            let renderedGroups = 0;
            return fancyCategories.map((cat) => {
              const rows = groupedFancyOdds[cat];
              if (!rows || rows.length === 0) return null;

              const isFirstCategory = renderedGroups === 0;
              renderedGroups += 1;

              return (
                <Box key={cat}>
                  {/* Subtle Category Subheader Divider */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: { xs: 1.25, sm: 1.5 },
                      py: 0.5,
                      bgcolor: 'background.neutral',
                      borderTop: isFirstCategory ? 'none' : '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box
                        sx={{
                          width: 3.5,
                          height: 12,
                          borderRadius: '2px',
                          bgcolor: FANCY_CATEGORY_COLORS[cat] || '#00A76F',
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'text.secondary',
                        }}
                      >
                        {cat}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.disabled' }}>
                      {rows.length} {rows.length === 1 ? 'market' : 'markets'}
                    </Typography>
                  </Box>

                  {/* Rows for this category */}
                  {rows.map((row: any, idx: number) => {
                    const isSuspended =
                      Number(row.b1) === 0 &&
                      Number(row.bs1) === 0 &&
                      Number(row.l1) === 0 &&
                      Number(row.ls1) === 0;

                    return (
                      <Box
                        key={row._id || idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: { xs: 1.25, sm: 1.5 },
                          py: 0.55,
                          borderBottom: idx < rows.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        {/* Market / Runner Name */}
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '0.8rem', sm: '0.88rem' },
                            color: 'text.primary',
                            pr: 1,
                            maxWidth: { xs: '60%', sm: '70%' },
                          }}
                        >
                          {row.rname || '--'}
                        </Typography>

                        {/* Not & Yes Boxes */}
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          {/* NOT Box */}
                          {isSuspended ? (
                            <Box
                              sx={{
                                bgcolor: '#475569',
                                width: { xs: 58, sm: 72 },
                                height: 38,
                                borderRadius: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Iconify icon="solar:lock-bold" width={16} sx={{ color: '#fff' }} />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                bgcolor: '#fba2b3',
                                color: '#000',
                                borderRadius: 1.25,
                                width: { xs: 58, sm: 72 },
                                height: 38,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'default',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              }}
                            >
                              <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.88rem', sm: '0.98rem' }, lineHeight: 1.1 }}>
                                {Number(row.l1).toFixed(0)}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85, lineHeight: 1 }}>
                                {Number(row.ls1).toFixed(0)}
                              </Typography>
                            </Box>
                          )}

                          {/* YES Box */}
                          {isSuspended ? (
                            <Box
                              sx={{
                                bgcolor: '#475569',
                                width: { xs: 58, sm: 72 },
                                height: 38,
                                borderRadius: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Iconify icon="solar:lock-bold" width={16} sx={{ color: '#fff' }} />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                bgcolor: '#74b9ff',
                                color: '#000',
                                borderRadius: 1.25,
                                width: { xs: 58, sm: 72 },
                                height: 38,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'default',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              }}
                            >
                              <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.88rem', sm: '0.98rem' }, lineHeight: 1.1 }}>
                                {Number(row.b1).toFixed(0)}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85, lineHeight: 1 }}>
                                {Number(row.bs1).toFixed(0)}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              );
            });
          })()
        ) : (
          <Box sx={{ py: 2.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" fontSize="0.82rem">
              No active session odds available
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <Box p={{ xs: 1, sm: 1.5 }}>
        {/* Header */}
        <Card sx={{ mb: 1.25, boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)', borderRadius: 1.5 }}>
          <CardContent
            sx={{
              textAlign: 'center',
              bgcolor: '#00A76F',
              py: 1.25,
              px: 1.5,
              minHeight: 60,
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
          <LiveTv matchId={gameId} matchData={matchData} />
        </Card>

        {/* Bookmaker Odds */}
        {BookmakerOddsTable}

        {/* Toss Odds */}
        {activeMatch?.isTossActive !== false && !isTossDeclared && TossOddsTable}

        {/* Match tab */}
        <Accordion defaultExpanded sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden', backgroundColor: "#8df1d0ff" }}>
          <AccordionSummary
            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
            sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Match
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0.5 }}>{renderMatchTable()}</AccordionDetails>
        </Accordion>

        {/* Toss tab */}
        {activeMatch?.isTossActive !== false && (
          <Accordion sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden', backgroundColor: "#8df1d0ff" }}>
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
              sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Toss
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0.5 }}>{renderTossTable()}</AccordionDetails>
          </Accordion>
        )}

        {/* Fancy Odds */}
        {FancyOddsTable}

        {/* Fancy Bets tab */}
        <Accordion sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden', backgroundColor: "#8df1d0ff" }}>
          <AccordionSummary
            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
            sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Fancy Bets
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {Object.entries(groupedFancyBets).length === 0 ? (
              <Typography sx={{ p: 1.5, textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                No fancy bets available
              </Typography>
            ) : (
              (Object.entries(groupedFancyBets) as [string, BetData[]][]).map(([runnerName, bets]) => {
                const sessionData = findSessionExposure(runnerName, bets, exposureData?.sessionWisePotentialPL);

                return (
                  <Box key={runnerName} mb={0.75}>
                    <Paper sx={{ bgcolor: '#00A76F', color: 'white', borderRadius: 1.25, overflow: 'hidden' }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={1.25}
                        py={0.55}
                        onClick={() => toggleSection(runnerName)}
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
                              toggleSection(runnerName);
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
                        <Paper sx={{ mt: 0, bgcolor: 'background.paper' }}>
                          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 550 }}>
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'background.neutral' }}>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.78rem' }}>
                                    Client
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.78rem' }}>
                                    Run
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.78rem' }}>
                                    YES/NOT
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.78rem' }}>
                                    Amount
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.78rem' }}>
                                    Created
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {isPowerUser ? (
                                  <TableRow sx={{ backgroundColor: '#FFC107' }}>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.55, fontSize: '0.78rem' }}>Total ({bets.length} Bets)</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.55 }}>--</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.55 }}>--</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.55, fontSize: '0.78rem' }}>
                                      ₹{bets.reduce((sum: number, b: BetData) => sum + (Number(b.stake_amount) || 0), 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 0.55 }}>--</TableCell>
                                  </TableRow>
                                ) : bets.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 1.5, fontSize: '0.78rem', color: 'text.secondary' }}>
                                      No bets placed
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  bets.map((bet) => (
                                    <TableRow key={bet.id} hover>
                                      <TableCell sx={{ py: 0.5, fontSize: '0.78rem' }}>
                                        {bet.user?.name || '-'} ({bet.user?.user_name || '-'})
                                      </TableCell>
                                      <TableCell sx={{ py: 0.5, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                        {bet.odds_value || bet.odds_rate ? (!Number.isNaN(Number(bet.odds_value || bet.odds_rate)) ? Math.round(Number(bet.odds_value || bet.odds_rate)) : (bet.odds_value || bet.odds_rate)) : '-'}
                                      </TableCell>
                                      <TableCell sx={{ py: 0.5 }}>
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
                                      <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.78rem' }}>
                                        ₹{bet.stake_amount.toLocaleString()}
                                      </TableCell>
                                      <TableCell sx={{ py: 0.5, color: 'text.secondary', fontSize: '0.72rem' }}>
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

        {/* Last 10 Undeclared Bets */}
        <Accordion defaultExpanded sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden', backgroundColor: "#8df1d0ff" }}>
          <AccordionSummary
            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
            sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Last 10 Undeclared Bets
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 650, tableLayout: 'fixed' }}>
                {renderUndeclaredColGroup()}
                {renderUndeclaredTableHead()}
                <TableBody>{renderUndeclaredBetsBody()}</TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Summary/Totals Accordion */}
        <Accordion sx={{ mb: 1.25, borderRadius: '8px !important', overflow: 'hidden', backgroundColor: "#8df1d0ff" }}>
          <AccordionSummary
            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} height={18} />}
            sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 }, '& .MuiAccordionSummary-content': { my: 0.75 } }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Summary / Totals
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <TableContainer
              component={Paper}
              sx={{
                width: '100%',
                overflowX: 'auto',
                boxShadow: 'none',
              }}
            >
              <Table size="small" sx={{ minWidth: 960, tableLayout: 'fixed' }}>
                {renderSummaryColGroup()}
                {renderSummaryTableHead()}
                <TableBody>{renderSummaryTable()}</TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Fixed Bottom Totals */}
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', mt: 1.5, borderRadius: 1.5 }}>
          <Table size="small" sx={{ minWidth: 960, tableLayout: 'fixed' }}>
            {renderSummaryColGroup()}
            {renderSummaryTableHead()}
            <TableBody>{renderTotalRow()}</TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // Desktop layout
  return (
    <Box sx={{ p: { md: 1.5 } }}>
      {/* Header */}
      <Card sx={{ mb: 1.5, boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)', borderRadius: 1.5 }}>
        <CardContent
          sx={{
            textAlign: 'center',
            bgcolor: '#00A76F',
            minHeight: 70,
            py: 1.5,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#fff',
            '&:last-child': { pb: 1.5 },
          }}
        >
          <Typography variant="h6" sx={{ mb: 0.25, fontWeight: 800 }}>
            {eventName}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, mb: wonby ? 0.75 : 0 }}>
            ({formattedDate})
          </Typography>
          {wonby && (
            <Chip
              avatar={
                <img
                  src={win}
                  alt="team-logo"
                  style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                />
              }
              label={`Winner: ${wonby}`}
              sx={{
                height: 26,
                px: 1.25,
                backgroundColor: '#fff',
                color: '#E7001F',
                cursor: 'default',
                fontWeight: 800,
                fontSize: '0.82rem',
                alignSelf: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              }}
            />
          )}
        </CardContent>
        <LiveTv matchId={gameId} matchData={matchData} />
      </Card>

      <Grid container spacing={1.5}>
        {/* Left: Bookmaker Odds then Toss then Match */}
        <Grid item xs={12} md={6}>
          {BookmakerOddsTable}
          {activeMatch?.isTossActive !== false && !isTossDeclared && TossOddsTable}

          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle1" mb={1} sx={{ fontWeight: 'bold' }}>
                Match
              </Typography>
              {renderMatchTable()}
            </CardContent>
          </Card>

          {/* Toss Card */}
          {activeMatch?.isTossActive !== false && (
            <Card sx={{ borderRadius: 1.5, mt: 1.5 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle1" mb={1} sx={{ fontWeight: 'bold' }}>
                  Toss
                </Typography>
                {renderTossTable()}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right: Fancy Odds then Fancy Bets */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          {FancyOddsTable}

          {(Object.entries(groupedFancyBets) as [string, BetData[]][]).map(([runnerName, bets]) => {
            const sessionData = findSessionExposure(runnerName, bets, exposureData?.sessionWisePotentialPL);

            return (
              <Paper
                key={runnerName}
                sx={{
                  mb: 1.5,
                  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)',
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
                  onClick={() => toggleSection(runnerName)}
                  sx={{
                    bgcolor: '#00A76F',
                    py: 0.6,
                    px: 1.5,
                    cursor: 'pointer',
                    userSelect: 'none',
                    width: '100%',
                  }}
                >
                  <Typography color="#FFFFFF" variant="subtitle2" fontWeight="bold">
                    {runnerName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.75}>
                    {(wonby === runnerName ||
                      bets.some((b) => b.status === 'WON' || b.result)) && (
                        <Box
                          display="flex"
                          alignItems="center"
                          px={1.25}
                          py={0.25}
                          borderRadius="20px"
                          bgcolor="#FFC107"
                        >
                          <img
                            src={win}
                            alt="win"
                            style={{ width: '18px', marginRight: '6px' }}
                          />
                          <Typography color="#000000" variant="caption" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
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
                        toggleSection(runnerName);
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
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.8rem' }}>
                              Client
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.8rem' }}>
                              Run
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.8rem' }}>
                              YES/NOT
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.8rem' }}>
                              Amount
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', py: 0.55, fontSize: '0.8rem' }}>
                              Created
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {isPowerUser ? (
                            <TableRow sx={{ backgroundColor: '#FFC107' }}>
                              <TableCell sx={{ fontWeight: 'bold', py: 0.55, fontSize: '0.8rem' }}>Total ({bets.length} Bets)</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', py: 0.55 }}>--</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', py: 0.55 }}>--</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', py: 0.55, fontSize: '0.8rem' }}>
                                ₹{bets.reduce((sum: number, b: BetData) => sum + (Number(b.stake_amount) || 0), 0).toLocaleString()}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', py: 0.55 }}>--</TableCell>
                            </TableRow>
                          ) : (
                            bets.map((bet) => (
                              <TableRow key={bet.id} hover>
                                <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>
                                  {bet.user?.name || '-'} ({bet.user?.user_name || '-'})
                                </TableCell>
                                <TableCell sx={{ py: 0.5, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                  {bet.odds_value || bet.odds_rate ? (!Number.isNaN(Number(bet.odds_value || bet.odds_rate)) ? Math.round(Number(bet.odds_value || bet.odds_rate)) : (bet.odds_value || bet.odds_rate)) : '-'}
                                </TableCell>
                                <TableCell sx={{ py: 0.5 }}>
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      px: 1.25,
                                      py: 0.2,
                                      borderRadius: '20px',
                                      fontWeight: 'bold',
                                      color: '#000',
                                      backgroundColor:
                                        bet.selection === 'Yes' ? '#83c2fc' : '#fda4b4',
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{ fontWeight: 'bold', mr: 0.5, color: '#000' }}
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
                                        padding: '1px 7px',
                                      }}
                                    >
                                      {Number(bet.odds_rate).toFixed(0)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.8rem' }}>
                                  ₹{bet.stake_amount.toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ py: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                                  {formatDateTime(bet.createdAt)}
                                </TableCell>
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
          })}

          {/* Last 10 Undeclared Bets (Desktop) - 7 columns */}
          <Paper
            elevation={2}
            sx={{
              mb: 1.5,
              borderRadius: 1.5,
              overflow: 'hidden',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)',
            }}
          >
            <Box sx={{ bgcolor: '#00A76F', py: 0.65, px: 1.5 }}>
              <Typography color="#FFFFFF" variant="subtitle2" fontWeight="bold">
                Last 10 Undeclared Bets
              </Typography>
            </Box>
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 650, tableLayout: 'fixed' }}>
                {renderUndeclaredColGroup()}
                {renderUndeclaredTableHead()}
                <TableBody>{renderUndeclaredBetsBody()}</TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Tables - Match Summary */}
      <Box sx={{ mt: 2, mb: 10 }}>
        <TableContainer
          component={Paper}
          sx={{
            width: '100%',
            overflowX: 'auto',
            boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.06)',
            borderRadius: 1.5,
          }}
        >
          <Table sx={{ minWidth: 960, tableLayout: 'fixed' }} size="small">
            {renderSummaryColGroup()}
            {renderSummaryTableHead()}
            <TableBody>{renderSummaryTable()}</TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Fixed Bottom Total Table */}
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
        <TableContainer component={Paper} sx={{ borderRadius: 1.5, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 960, tableLayout: 'fixed' }}>
            {renderSummaryColGroup()}
            {renderSummaryTableHead()}
            <TableBody>{renderTotalRow()}</TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
