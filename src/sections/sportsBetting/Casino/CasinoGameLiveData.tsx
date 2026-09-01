import { useSearchParams } from 'react-router-dom';
import React, { useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';

import {
  Accordion,
  AccordionDetails,
  Box,
  AccordionSummary,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';

import { useCasinoSocket } from 'src/hooks/useCasinoSocket';
import { Iconify } from 'src/components/iconify';
import { formatUTCDateTime12H } from 'src/utils/date';
import {
  adjustCasinoOdds,
  adjustDt20Odds,
  adjustLucky7Odds,
  adjustTeenOdds,
  adjustTeen20Odds,
} from 'src/utils/casinoOddsHelper';

import CasinoLiveTv from './CasinoLiveTv';
import CasinoRulesModal from './CasinoRulesModal';
import CasinoResultDetailModal from './CasinoResultDetailModal';

interface SummaryRow {
  client: string;
  userFullName: string;
  userName: string;
  casinoPL: number;
  commission: number;
  netAmount: number;
  shareAmount: number;
  grandTotal: number;
}

interface BetRow {
  _id: string;
  amount: number;
  client: string;
  createdAt: string;
  mode: string;
  rate: number;
  selection: string;
  status?: string;
  result?: string;
  pnl?: number;
}

interface CasinoGameLiveDataProps {
  gtype: string;
  title: string;
}

export default function CasinoGameLiveData({ gtype, title }: CasinoGameLiveDataProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') || dayjs().format('YYYY-MM-DD');

  const {
    oddsData,
    resultsData,
    casinoRateDiff: socketRateDiff,
    effectiveBackDiff,
    effectiveLayDiff,
    effectiveGameRateDiff,
  } = useCasinoSocket(gtype);
  const { fetchMe } = useMeApi();
  const { getAdminGameBets } = useCasinoApi();

  const [oddsOpen, setOddsOpen] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [betTab, setBetTab] = useState(0);
  const [selectedMid, setSelectedMid] = useState<string | null>(null);
  const [resultDetailOpen, setResultDetailOpen] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);

  const roundId = oddsData?.mid || 'Waiting...';
  const timeLeft = oddsData?.lt !== undefined ? oddsData.lt : '-';

  const isRoundSuspended =
    !oddsData ||
    String(oddsData?.gstatus || '').toUpperCase().trim() === 'SUSPENDED' ||
    String(oddsData?.gstatus || '').toUpperCase().trim() === '0' ||
    String(oddsData?.gstatus || '').toUpperCase().trim() === 'CLOSED' ||
    timeLeft === 0 ||
    timeLeft === '0' ||
    timeLeft === '-' ||
    timeLeft === 'Waiting';

  const isItemSuspended = (item: any) => {
    if (isRoundSuspended) return true;
    if (!item) return false;
    const gstatus = String(item.gstatus || '').toUpperCase().trim();
    if (gstatus === 'SUSPENDED' || gstatus === '0' || gstatus === 'CLOSED') return true;
    const bVal = item.b ?? item.b1 ?? item.rate ?? item.price;
    if (bVal === '0' || bVal === 0 || bVal === '-') return true;
    return false;
  };

  const findLucky7CardOdds = (cNum: string) => {
    if (!oddsData?.sub) return null;
    const num = String(cNum).trim();
    let letter = '';
    if (num === '1') letter = 'a';
    else if (num === '11') letter = 'j';
    else if (num === '12') letter = 'q';
    else if (num === '13') letter = 'k';

    return oddsData.sub.find((s: any) => {
      const sNat = String(s.nat || s.name || '').toLowerCase().trim();
      if (!sNat) return false;
      return (
        sNat === `card ${num}` ||
        (letter && sNat === `card ${letter}`) ||
        sNat === `card:${num}` ||
        (letter && sNat === `card:${letter}`) ||
        sNat === `c${num}` ||
        (letter && sNat === `c${letter}`) ||
        sNat === num ||
        (letter && sNat === letter) ||
        (sNat.includes('card') && (sNat.includes(num) || (letter && (sNat.endsWith(` ${letter}`) || sNat.endsWith(`:${letter}`)))))
      );
    });
  };

  const findDt20CardOdds = (prefix: 'Dragon' | 'Tiger', cNum: string) => {
    if (!oddsData?.sub) return null;
    const pLower = prefix.toLowerCase();
    const pLetter = pLower === 'dragon' ? 'd' : 't';
    const num = String(cNum).trim();
    let letter = '';
    if (num === '1') letter = 'a';
    else if (num === '11') letter = 'j';
    else if (num === '12') letter = 'q';
    else if (num === '13') letter = 'k';

    return oddsData.sub.find((s: any) => {
      const sNat = String(s.nat || s.name || '').toLowerCase().trim();
      if (!sNat) return false;

      const isPrefix =
        sNat.includes(pLower) ||
        sNat.startsWith(`${pLetter}:`) ||
        sNat.startsWith(`${pLetter} `) ||
        sNat.startsWith(`${pLetter}${num}`) ||
        (letter && sNat.startsWith(`${pLetter}${letter}`));
      if (!isPrefix) return false;

      return (
        sNat === `${pLower} card ${num}` ||
        (letter && sNat === `${pLower} card ${letter}`) ||
        sNat === `${pLower} ${num}` ||
        (letter && sNat === `${pLower} ${letter}`) ||
        sNat === `${pLower}:${num}` ||
        (letter && sNat === `${pLower}:${letter}`) ||
        sNat === `${pLetter}:${num}` ||
        (letter && sNat === `${pLetter}:${letter}`) ||
        sNat === `${pLetter} ${num}` ||
        (letter && sNat === `${pLetter} ${letter}`) ||
        sNat === `${pLetter}${num}` ||
        (letter && sNat === `${pLetter}${letter}`) ||
        ((sNat.includes(pLower) || sNat.includes(`${pLetter}:`)) &&
          (sNat.includes(`card ${num}`) ||
            sNat.includes(`:${num}`) ||
            sNat.endsWith(` ${num}`) ||
            (letter
              ? sNat.includes(`card ${letter}`) ||
                sNat.includes(`:${letter}`) ||
                sNat.endsWith(` ${letter}`)
              : false)))
      );
    });
  };

  const playerRows =
    oddsData?.sub?.filter(
      (item: any) =>
        item.subtype === 'Player' ||
        (item.subtype === gtype && !item.nat?.toLowerCase().includes('tie')) ||
        (item.subtype === 'dt20' && !item.nat?.toLowerCase().includes('tie'))
    ) || [];

  const cardsArr = oddsData?.card ? oddsData.card.split(',') : ['1', '1', '1', '1', '1', '1'];

  // Fetch logged in admin data
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;
  const userType = userData?.data?.type;
  const isPowerUser = userType === 'power_user';

  const rawCasinoSettings = userData?.data?.casino_settings || (userData as any)?.lockStatus?.effectiveCasinoSettings || {};
  const userGameConfig = (gtype && rawCasinoSettings[gtype]) || {};

  const effectiveRateDiff = socketRateDiff !== undefined 
    ? socketRateDiff 
    : (userData?.data?.casino_rate_diff ?? (userData as any)?.lockStatus?.effectiveCasinoRateDiff ?? 0);

  const currentBackDiff = effectiveBackDiff !== undefined 
    ? effectiveBackDiff 
    : (userGameConfig.back_diff !== undefined ? Number(userGameConfig.back_diff) : effectiveRateDiff);

  const currentLayDiff = effectiveLayDiff !== undefined 
    ? effectiveLayDiff 
    : (userGameConfig.lay_diff !== undefined ? Number(userGameConfig.lay_diff) : 0);

  const currentGameRateDiff = effectiveGameRateDiff !== undefined 
    ? effectiveGameRateDiff 
    : (userGameConfig.rate_diff !== undefined ? Number(userGameConfig.rate_diff) : effectiveRateDiff);

  // Fetch admin game bets, hierarchy summary & exposure for the selected date
  const { data: gameBetsData, isLoading: isBetsLoading } = useQuery({
    queryKey: ['adminGameBets', userId, gtype, selectedDate],
    queryFn: () => getAdminGameBets(gtype, selectedDate),
    enabled: !!userId,
    refetchInterval: 3000,
  });

  const betsList: BetRow[] = useMemo(() => gameBetsData?.bets || [], [gameBetsData]);
  const adminShare = useMemo(() => gameBetsData?.adminShare || 0, [gameBetsData]);

  const nonDeletedBets = useMemo(
    () =>
      betsList.filter((b: BetRow) => {
        const s = (b.status || '').toUpperCase();
        const r = (b.result || '').toUpperCase();
        return s !== 'DELETED' && s !== 'CANCELLED' && r !== 'DELETED' && r !== 'CANCELLED';
      }),
    [betsList]
  );

  const unsettledBets = useMemo(
    () => nonDeletedBets.filter((b: BetRow) => b.status === 'PENDING' || b.status === 'ACTIVE'),
    [nonDeletedBets]
  );

  const declaredBets = useMemo(
    () =>
      nonDeletedBets.filter((b: BetRow) => {
        const s = (b.status || '').toUpperCase();
        const r = (b.result || '').toUpperCase();
        return s === 'SETTLED' || s === 'WON' || s === 'LOST' || r === 'WON' || r === 'LOST';
      }),
    [nonDeletedBets]
  );

  const activeBetsList = betTab === 0 ? unsettledBets : declaredBets;

  const exposureMap: Record<string, number> = useMemo(
    () => gameBetsData?.exposure || { 'Player A': 0, 'Player B': 0 },
    [gameBetsData]
  );
  const rawSummaryRows: SummaryRow[] = useMemo(() => gameBetsData?.summary || [], [gameBetsData]);
  const summaryRows: SummaryRow[] = useMemo(
    () =>
      rawSummaryRows.filter(
        (r) => r.casinoPL !== 0 || r.commission !== 0 || r.grandTotal !== 0
      ),
    [rawSummaryRows]
  );

  // Calculate casino summary totals
  const totals = useMemo(
    () =>
      summaryRows.reduce(
        (acc, row) => ({
          casinoPL: acc.casinoPL + row.casinoPL,
          commission: acc.commission + row.commission,
          netAmount: acc.netAmount + row.netAmount,
          shareAmount: acc.shareAmount + row.shareAmount,
          grandTotal: acc.grandTotal + row.grandTotal,
        }),
        {
          casinoPL: 0,
          commission: 0,
          netAmount: 0,
          shareAmount: 0,
          grandTotal: 0,
        }
      ),
    [summaryRows]
  );

  const getExposureForPlayer = (name: string, idx: number): number => {
    if (exposureMap[name] !== undefined) return exposureMap[name];

    const lower = name.toLowerCase();
    if (
      lower.includes('player a') ||
      lower === 'a' ||
      (idx === 0 && (gtype === 'teen20' || gtype === 'teen'))
    ) {
      return exposureMap['Player A'] ?? exposureMap.A ?? 0;
    }
    if (
      lower.includes('player b') ||
      lower === 'b' ||
      (idx === 1 && (gtype === 'teen20' || gtype === 'teen'))
    ) {
      return exposureMap['Player B'] ?? exposureMap.B ?? 0;
    }
    if (lower.includes('dragon') || (idx === 0 && gtype === 'dt20')) {
      return exposureMap.Dragon ?? exposureMap.D ?? 0;
    }
    if (lower.includes('tiger') || (idx === 1 && gtype === 'dt20')) {
      return exposureMap.Tiger ?? exposureMap.T ?? 0;
    }
    return exposureMap[name] || 0;
  };

  const getWinnerName = (res: any) => {
    const r = String(res.result || res.win || '').toUpperCase();
    if (r === '1' || r === 'D' || r === 'DRAGON' || r === 'A') return 'A';
    if (r === '2' || r === 'T' || r === 'TIGER' || r === 'B') return 'B';
    if (r === '3' || r === 'TIE') return '-';
    return r || '?';
  };

  const getWinnerColor = (winner: string) => {
    if (winner === 'A' || winner === 'D') return '#FF4B4B';
    if (winner === 'B' || winner === 'T') return '#FF9F43';
    if (winner === '-') return '#16C75A';
    return '#757575';
  };

  const getTimerColor = (time: string | number) => {
    if (time === '-' || time === 'Waiting') return '#16C75A';
    const val = typeof time === 'string' ? parseInt(time, 10) : time;
    if (Number.isNaN(val)) return '#16C75A';
    if (val > 10) return '#16C75A';
    if (val >= 6) return '#FF9F43';
    return '#FF4B4B';
  };

  const renderTimerPill = () => (
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: getTimerColor(timeLeft),
        borderRadius: '50%',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        color: '#FFF',
        display: 'flex',
        height: { xs: 28, md: 55 },
        justifyContent: 'center',
        width: { xs: 28, md: 55 },
      }}
    >
      <Typography
        sx={{ color: '#fff', fontSize: { xs: '14px', md: '24px' }, fontWeight: 'bold', lineHeight: 1 }}
      >
        {timeLeft}
      </Typography>
    </Box>
  );

  const renderPlayerCards = (player: any, idx: number, size: string) => {
    let myCards: string[] = [];

    if (gtype === 'teen20' || gtype === 'teen') {
      myCards =
        idx === 0
          ? [cardsArr[0], cardsArr[2], cardsArr[4]]
          : [cardsArr[1], cardsArr[3], cardsArr[5]];
    } else {
      myCards = [cardsArr[idx]];
    }

    let width = 16;
    let height = 24;
    if (size === 'desktop') {
      width = 48;
      height = 68;
    } else if (size === 'tablet') {
      width = 42;
      height = 60;
    }

    return (
      <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
        <Typography
          sx={{
            color: '#FFF',
            fontSize: size === 'mobile' ? '10px' : '14px',
            fontWeight: 'bold',
            mb: 0.5,
          }}
        >
          {player.nat || player.name || `PLAYER ${idx === 0 ? 'A' : 'B'}`}
        </Typography>
        <Box display="flex">
          {myCards.map((cardVal, cIdx) => (
            <Box
              key={cIdx}
              component="img"
              src={`https://g1ver.sprintstaticdata.com/v105/static/front/img/cards/${cardVal || 1}.jpg`}
              sx={{
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                height,
                ml: cIdx > 0 ? '2px' : 0,
                position: 'relative',
                width,
                zIndex: cIdx,
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  const paginatedBets = useMemo(
    () => activeBetsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [activeBetsList, page, rowsPerPage]
  );

  const displayTitle = `${title} (${dayjs(selectedDate).format('MMM DD, YYYY')})`;

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Grid container spacing={{ xs: 1.5, md: 3 }}>
        {/* LEFT 70% */}
        <Grid item xs={12} md={8}>
          {/* Header */}
          <Paper
            sx={{
              alignItems: 'center',
              bgcolor: '#00A76F',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              justify: 'space-between',
              mb: { xs: 1.5, md: 3 },
              px: { xs: 1.5, md: 3 },
              borderRadius: '6px',
            }}
          >
            <Box>
              <Typography
                sx={{ color: '#ebebebff', fontSize: { xs: '14px', md: '18px' }, fontWeight: 'bold' }}
              >
                {displayTitle}
              </Typography>
              <Typography sx={{ color: '#ebebebff', fontSize: { xs: '10px', md: '14px' }, mt: 0.5 }}>
                Round ID: {roundId}
              </Typography>
            </Box>
            <Button
              variant="text"
              onClick={() => setRulesOpen(true)}
              sx={{ color: '#ebebebff', fontSize: '14px', fontWeight: 'bold', textTransform: 'none' }}
            >
              Rules
            </Button>
          </Paper>

          {/* Video Stream */}
          <Box
            sx={{
              bgcolor: '#000',
              borderRadius: { xs: '8px', md: '12px' },
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              mb: { xs: 1.5, md: 3 },
              overflow: 'hidden',
              paddingTop: '56.25%',
              position: 'relative',
            }}
          >
            <CasinoLiveTv gtype={gtype} />

            <Box
              sx={{
                bottom: { xs: 8, md: 16 },
                position: 'absolute',
                right: { xs: 8, md: 16 },
                zIndex: 10,
              }}
            >
              {renderTimerPill()}
            </Box>

            {gtype === 'lucky7eu' ? (
              <Box
                sx={{
                  bgcolor: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  left: { xs: 8, md: 16 },
                  p: { xs: 0.5, md: 1 },
                  position: 'absolute',
                  top: { xs: 8, md: 16 },
                  zIndex: 10,
                }}
              >
                <Box
                  component="img"
                  src={`https://g1ver.sprintstaticdata.com/v105/static/front/img/cards/${cardsArr[0] || 1}.jpg`}
                  sx={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    height: isMobile ? 36 : 68,
                    width: isMobile ? 24 : 48,
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1, md: 2 },
                  left: { xs: 8, md: 16 },
                  position: 'absolute',
                  top: { xs: 8, md: 16 },
                  zIndex: 10,
                }}
              >
                {playerRows.slice(0, 2).map((p: any, idx: number) => (
                  <Box
                    key={idx}
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      p: { xs: 0.5, md: 1 },
                    }}
                  >
                    {renderPlayerCards(p, idx, isMobile ? 'mobile' : 'desktop')}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Live Odds Table with Selection Exposure under Player/Runner Name */}
          <Card sx={{ borderRadius: '12px', mb: 3, overflow: 'hidden' }}>
            <Box
              onClick={() => setOddsOpen(!oddsOpen)}
              sx={{ bgcolor: '#00A76F', cursor: 'pointer', display: 'flex', p: 1.5, userSelect: 'none' }}
            >
              <Box sx={{ alignItems: 'center', display: 'flex', flex: 1 }}>
                <Typography sx={{ color: '#d4e6ffff', fontSize: '14px', ml: 1 }}>
                  {oddsOpen ? '▼' : '▲'} {gtype === 'lucky7eu' ? 'Lucky 7 Markets' : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, pr: 1 }}>
                <Box
                  sx={{
                    color: '#d4e6ffff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: 60,
                  }}
                >
                  Back
                </Box>
                {gtype !== 'lucky7eu' && gtype !== 'dt20' && (
                  <Box
                    sx={{
                      color: '#d4e6ffff',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      width: 60,
                    }}
                  >
                    Lay
                  </Box>
                )}
              </Box>
            </Box>
            <Collapse in={oddsOpen}>
              {gtype === 'lucky7eu' ? (
                /* Lucky 7 EU Multi-segment admin view */
                <Box sx={{ p: 1.5 }}>
                  {/* Segments 1, 2, 3 */}
                  <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                    {[
                      { name: 'Low Card', nat: 'Low', key: 'Low Card' },
                      { name: '7 (Tie)', nat: '7', key: '7' },
                      { name: 'High Card', nat: 'High', key: 'High Card' },
                      { name: 'Even', nat: 'Even', key: 'Even' },
                      { name: 'Odd', nat: 'Odd', key: 'Odd' },
                      { name: 'Red', nat: 'Red', key: 'Red' },
                      { name: 'Black', nat: 'Black', key: 'Black' },
                    ].map((item, idx) => {
                      const oddsItem = oddsData?.sub?.find(
                        (s: any) =>
                          (s.nat && s.nat.toLowerCase() === item.nat.toLowerCase()) ||
                          (s.name && s.name.toLowerCase() === item.nat.toLowerCase()) ||
                          (s.nat && s.nat.toLowerCase() === item.name.toLowerCase())
                      );
                      const isSuspended = isItemSuspended(oddsItem);
                      const rawRate = isSuspended || item.key === '7' ? '-' : (oddsItem?.b || oddsItem?.b1 || oddsItem?.rate || oddsItem?.price || '-');
                      const adjustedRate = (isSuspended || item.key === '7' || rawRate === '-') ? '-' : adjustLucky7Odds(rawRate, item.name, currentGameRateDiff);
                      const exp = exposureMap[item.key] ?? exposureMap[item.name] ?? 0;

                      return (
                        <Grid item xs={6} sm={item.key === '7' ? 4 : 4} key={idx}>
                          <Paper
                            sx={{
                              p: 1.5,
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1F2937' }}>
                                {item.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: exp >= 0 ? 'green' : 'red',
                                  fontWeight: 'bold',
                                  display: 'block',
                                }}
                              >
                                ({exp >= 0 ? '+' : ''}{exp.toFixed(2)})
                              </Typography>
                            </Box>
                            {item.key !== '7' ? (
                              <Button
                                variant="contained"
                                sx={{
                                  bgcolor: '#72BBEF',
                                  color: '#000',
                                  fontWeight: 'bold',
                                  minWidth: 50,
                                  height: 36,
                                }}
                              >
                                {adjustedRate}
                              </Button>
                            ) : (
                              <Box
                                sx={{
                                  bgcolor: '#f1f5f9',
                                  color: '#475569',
                                  fontWeight: 'bold',
                                  px: 1.5,
                                  py: 0.8,
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                }}
                              >
                                50% Rule
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Segment 4: Cards */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#64748b' }}>
                    Card Selections (Cards 1–13)
                  </Typography>
                  <Grid container spacing={1}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'].map((cNum) => {
                      const selKey = `Card ${cNum}`;
                      const oddsItem = findLucky7CardOdds(cNum);
                      const isSuspended = isRoundSuspended || isItemSuspended(oddsItem);
                      const rawRate = isSuspended
                        ? '-'
                        : oddsItem?.b || oddsItem?.b1 || oddsItem?.rate || oddsItem?.price || '12.00';
                      const adjustedRate =
                        isSuspended || rawRate === '-'
                          ? '-'
                          : adjustLucky7Odds(rawRate, selKey, currentGameRateDiff);
                      const exp =
                        exposureMap[selKey] ||
                        (cNum === '11'
                          ? exposureMap['Card J']
                          : cNum === '12'
                          ? exposureMap['Card Q']
                          : cNum === '13'
                          ? exposureMap['Card K']
                          : 0) ||
                        0;

                      return (
                        <Grid item xs={4} sm={2.4} key={cNum}>
                          <Paper
                            sx={{
                              p: 1,
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <Typography sx={{ fontWeight: 'bold', fontSize: '12px' }}>
                              {selKey}
                            </Typography>
                            <Typography sx={{ color: '#1a5f97', fontWeight: 'bold', fontSize: '11px' }}>
                              {adjustedRate}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: exp >= 0 ? 'green' : 'red',
                                fontWeight: 'bold',
                                display: 'block',
                                fontSize: '10px',
                              }}
                            >
                              {exp >= 0 ? `+${exp.toFixed(2)}` : exp.toFixed(2)}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ) : gtype === 'dt20' ? (
                /* DT20 8-Segment Admin Live Exposure View */
                <Box sx={{ p: 1.5 }}>
                  {/* Segment 1 & 2: Main Bets */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#64748b' }}>
                    Main Bets
                  </Typography>
                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {[
                      { name: 'Dragon', nat: 'Dragon', fallbackIdx: 0, defaultOdds: '1.98' },
                      { name: 'Tie', nat: 'Tie', fallbackIdx: 2, defaultOdds: '10.00' },
                      { name: 'Tiger', nat: 'Tiger', fallbackIdx: 1, defaultOdds: '1.98' },
                      { name: 'Pair', nat: 'Pair', fallbackIdx: 3, defaultOdds: '12.00' },
                    ].map((item, idx) => {
                      const oddsItem =
                        oddsData?.sub?.find(
                          (s: any) =>
                            (s.nat && s.nat.toLowerCase() === item.nat.toLowerCase()) ||
                            (s.name && s.name.toLowerCase() === item.nat.toLowerCase())
                        ) || (oddsData?.sub && oddsData.sub[item.fallbackIdx]);

                      const isSuspended = isItemSuspended(oddsItem);
                      const rawRate = isSuspended ? '-' : (oddsItem?.b || oddsItem?.b1 || oddsItem?.rate || oddsItem?.price || '-');
                      const adjustedRate = (isSuspended || rawRate === '-') ? '-' : adjustDt20Odds(rawRate, item.name, currentGameRateDiff);
                      const exp = exposureMap[item.name] ?? 0;

                      return (
                        <Grid item xs={6} sm={3} key={idx}>
                          <Paper
                            sx={{
                              p: 1.5,
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1F2937' }}>
                                {item.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: exp >= 0 ? 'green' : 'red',
                                  fontWeight: 'bold',
                                  display: 'block',
                                }}
                              >
                                ({exp >= 0 ? '+' : ''}{exp.toFixed(2)})
                              </Typography>
                            </Box>
                            <Button
                              variant="contained"
                              sx={{
                                bgcolor: '#72BBEF',
                                color: '#000',
                                fontWeight: 'bold',
                                minWidth: 50,
                                height: 36,
                              }}
                            >
                              {adjustedRate}
                            </Button>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Side Bets */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {/* Dragon Side Bets */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#64748b' }}>
                        Dragon Side Bets
                      </Typography>
                      <Grid container spacing={1}>
                        {[
                          { name: 'Dragon Even', label: 'Even', nat: 'Dragon Even' },
                          { name: 'Dragon Odd', label: 'Odd', nat: 'Dragon Odd' },
                          { name: 'Dragon Red', label: 'Red (♥ ♦)', nat: 'Dragon Red' },
                          { name: 'Dragon Black', label: 'Black (♠ ♣)', nat: 'Dragon Black' },
                        ].map((item, idx) => {
                          const oddsItem = oddsData?.sub?.find(
                            (s: any) =>
                              (s.nat && s.nat.toLowerCase() === item.nat.toLowerCase()) ||
                              (s.name && s.name.toLowerCase() === item.nat.toLowerCase())
                          );
                          const isSuspended = isItemSuspended(oddsItem);
                          const rawRate = isSuspended ? '-' : (oddsItem?.b || oddsItem?.b1 || oddsItem?.rate || oddsItem?.price || '-');
                          const adjustedRate = (isSuspended || rawRate === '-') ? '-' : adjustDt20Odds(rawRate, item.name, currentGameRateDiff);
                          const exp = exposureMap[item.name] ?? 0;

                          return (
                            <Grid item xs={6} key={idx}>
                              <Paper
                                sx={{
                                  p: 1.2,
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Box>
                                  <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#1F2937' }}>
                                    {item.label}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: exp >= 0 ? 'green' : 'red',
                                      fontWeight: 'bold',
                                      display: 'block',
                                    }}
                                  >
                                    ({exp >= 0 ? '+' : ''}{exp.toFixed(2)})
                                  </Typography>
                                </Box>
                                <Button
                                  variant="contained"
                                  sx={{
                                    bgcolor: '#72BBEF',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    minWidth: 45,
                                    height: 32,
                                  }}
                                >
                                  {adjustedRate}
                                </Button>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Grid>

                    {/* Tiger Side Bets */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#64748b' }}>
                        Tiger Side Bets
                      </Typography>
                      <Grid container spacing={1}>
                        {[
                          { name: 'Tiger Even', label: 'Even', nat: 'Tiger Even' },
                          { name: 'Tiger Odd', label: 'Odd', nat: 'Tiger Odd' },
                          { name: 'Tiger Red', label: 'Red (♥ ♦)', nat: 'Tiger Red' },
                          { name: 'Tiger Black', label: 'Black (♠ ♣)', nat: 'Tiger Black' },
                        ].map((item, idx) => {
                          const oddsItem = oddsData?.sub?.find(
                            (s: any) =>
                              (s.nat && s.nat.toLowerCase() === item.nat.toLowerCase()) ||
                              (s.name && s.name.toLowerCase() === item.nat.toLowerCase())
                          );
                          const isSuspended = isItemSuspended(oddsItem);
                          const rawRate = isSuspended ? '-' : (oddsItem?.b || oddsItem?.b1 || oddsItem?.rate || oddsItem?.price || '-');
                          const adjustedRate = (isSuspended || rawRate === '-') ? '-' : adjustDt20Odds(rawRate, item.name, currentGameRateDiff);
                          const exp = exposureMap[item.name] ?? 0;

                          return (
                            <Grid item xs={6} key={idx}>
                              <Paper
                                sx={{
                                  p: 1.2,
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Box>
                                  <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#1F2937' }}>
                                    {item.label}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: exp >= 0 ? 'green' : 'red',
                                      fontWeight: 'bold',
                                      display: 'block',
                                    }}
                                  >
                                    ({exp >= 0 ? '+' : ''}{exp.toFixed(2)})
                                  </Typography>
                                </Box>
                                <Button
                                  variant="contained"
                                  sx={{
                                    bgcolor: '#72BBEF',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    minWidth: 45,
                                    height: 32,
                                  }}
                                >
                                  {adjustedRate}
                                </Button>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Segment 7: Dragon 13 Cards */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#64748b' }}>
                    Dragon Cards (Cards 1–13 / A–K)
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'].map((cNum) => {
                      const selKey = `Dragon Card ${cNum}`;
                      const oddsItem = findDt20CardOdds('Dragon', cNum);
                      const isSuspended = isRoundSuspended || isItemSuspended(oddsItem);
                      const rawRate = isSuspended
                        ? '-'
                        : oddsItem?.b || oddsItem?.b1 || oddsItem?.rate || oddsItem?.price || '12.00';
                      const adjustedRate =
                        isSuspended || rawRate === '-'
                          ? '-'
                          : adjustDt20Odds(rawRate, selKey, currentGameRateDiff);
                      const exp =
                        exposureMap[selKey] ||
                        (cNum === '11'
                          ? exposureMap['Dragon Card J']
                          : cNum === '12'
                          ? exposureMap['Dragon Card Q']
                          : cNum === '13'
                          ? exposureMap['Dragon Card K']
                          : 0) ||
                        0;

                      return (
                        <Grid item xs={4} sm={1.84} key={cNum}>
                          <Paper
                            sx={{
                              p: 1,
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <Typography sx={{ fontWeight: 'bold', fontSize: '11px' }}>
                              D {cNum}
                            </Typography>
                            <Typography sx={{ color: '#1a5f97', fontWeight: 'bold', fontSize: '11px' }}>
                              {adjustedRate}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: exp >= 0 ? 'green' : 'red',
                                fontWeight: 'bold',
                                display: 'block',
                                fontSize: '10px',
                              }}
                            >
                              {exp >= 0 ? `+${exp.toFixed(2)}` : exp.toFixed(2)}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Segment 8: Tiger 13 Cards */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#64748b' }}>
                    Tiger Cards (Cards 1–13 / A–K)
                  </Typography>
                  <Grid container spacing={1}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'].map((cNum) => {
                      const selKey = `Tiger Card ${cNum}`;
                      const oddsItem = findDt20CardOdds('Tiger', cNum);
                      const isSuspended = isRoundSuspended || isItemSuspended(oddsItem);
                      const rawRate = isSuspended
                        ? '-'
                        : oddsItem?.b || oddsItem?.b1 || oddsItem?.rate || oddsItem?.price || '12.00';
                      const adjustedRate =
                        isSuspended || rawRate === '-'
                          ? '-'
                          : adjustDt20Odds(rawRate, selKey, currentGameRateDiff);
                      const exp =
                        exposureMap[selKey] ||
                        (cNum === '11'
                          ? exposureMap['Tiger Card J']
                          : cNum === '12'
                          ? exposureMap['Tiger Card Q']
                          : cNum === '13'
                          ? exposureMap['Tiger Card K']
                          : 0) ||
                        0;

                      return (
                        <Grid item xs={4} sm={1.84} key={cNum}>
                          <Paper
                            sx={{
                              p: 1,
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <Typography sx={{ fontWeight: 'bold', fontSize: '11px' }}>
                              T {cNum}
                            </Typography>
                            <Typography sx={{ color: '#1a5f97', fontWeight: 'bold', fontSize: '11px' }}>
                              {adjustedRate}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: exp >= 0 ? 'green' : 'red',
                                fontWeight: 'bold',
                                display: 'block',
                                fontSize: '10px',
                              }}
                            >
                              {exp >= 0 ? `+${exp.toFixed(2)}` : exp.toFixed(2)}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ) : (
                playerRows.map((player: any, idx: number) => {
                  const isPlayerSuspended = isRoundSuspended || isItemSuspended(player);
                  const bVal = player.b ?? player.b1 ?? player.rate ?? player.price;
                  const lVal = player.l ?? player.l1 ?? player.layRate ?? player.price;

                  const isBackSuspended = isPlayerSuspended || bVal === '0' || bVal === 0 || bVal === '-' || bVal === null || bVal === undefined;
                  const isLaySuspended = isPlayerSuspended || lVal === '0' || lVal === 0 || lVal === '-' || lVal === null || lVal === undefined;

                  const rawBackRate = isBackSuspended ? '-' : bVal;
                  const rawLayRate = isLaySuspended ? '-' : lVal;

                  const adjustedBackRate = (isBackSuspended || rawBackRate === '-') ? '-' : (gtype === 'teen20' ? adjustTeen20Odds(rawBackRate, currentBackDiff) : adjustTeenOdds(rawBackRate, 'BACK', currentBackDiff, currentLayDiff));
                  const adjustedLayRate = (isLaySuspended || rawLayRate === '-') ? '-' : adjustTeenOdds(rawLayRate, 'LAY', currentBackDiff, currentLayDiff);
                  const playerName = player.nat || player.name || `PLAYER ${idx === 0 ? 'A' : 'B'}`;
                  const playerExposure = getExposureForPlayer(playerName, idx);

                  return (
                    <Box
                      key={idx}
                      sx={{
                        alignItems: 'center',
                        borderBottom: '1px solid #E5E7EB',
                        display: 'flex',
                        p: 1.5,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#1F2937', fontWeight: 'bold' }}>
                          {playerName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: playerExposure >= 0 ? 'green' : 'red',
                            display: 'block',
                            fontWeight: 'bold',
                            mt: 0.25,
                          }}
                        >
                          ({playerExposure >= 0 ? '+' : ''}{playerExposure.toFixed(2)})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          sx={{
                            '&:hover': { bgcolor: '#5aa9e6' },
                            bgcolor: '#72BBEF',
                            color: '#000',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            height: 40,
                            width: 60,
                          }}
                        >
                          {adjustedBackRate}
                        </Button>
                        <Button
                          variant="contained"
                          sx={{
                            '&:hover': { bgcolor: '#f893a6' },
                            bgcolor: '#FAA9BA',
                            color: '#000',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            height: 40,
                            width: 60,
                          }}
                        >
                          {adjustedLayRate}
                        </Button>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Collapse>
          </Card>

          {/* Last Results */}
          <Box sx={{ mb: 3, overflowX: 'auto' }}>
            <Typography variant="h6" fontWeight="bold">
              Last Results
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ minWidth: 'max-content', py: 0.5 }}>
              {(resultsData || []).slice(0, 10).map((res: any, idx: number) => {
                const winner = getWinnerName(res);
                const roundMid = res.mid || res.rid || res.roundId;
                return (
                  <Box
                    key={idx}
                    onClick={() => {
                      if (roundMid) {
                        setSelectedMid(String(roundMid));
                        setResultDetailOpen(true);
                      }
                    }}
                    sx={{
                      alignItems: 'center',
                      bgcolor: getWinnerColor(winner),
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      height: { xs: 28, md: 55 },
                      justifyContent: 'center',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      width: { xs: 28, md: 55 },
                      '&:hover': {
                        boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {winner}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Grid>

        {/* RIGHT 30% - CASINO BETS */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#1F2937', fontSize: '18px', fontWeight: 'bold' }}>
                Casino Bets
              </Typography>
              <Tabs value={betTab} onChange={(_e: React.SyntheticEvent, v: number) => { setBetTab(v); setPage(0); }} sx={{ minHeight: 36 }}>
                <Tab label="Unsettled" sx={{ minHeight: 36, py: 0, px: 1, minWidth: 'auto', fontSize: '0.8rem' }} />
                <Tab label="Declared" sx={{ minHeight: 36, py: 0, px: 1, minWidth: 'auto', fontSize: '0.8rem' }} />
              </Tabs>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {activeBetsList.length > 0 ? (
              <TableContainer sx={{ maxHeight: 350, overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Client</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Team</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Rate</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Time</TableCell>
                      {betTab === 1 && (
                        <>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>P/L</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Winner</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isPowerUser ? (
                      <TableRow sx={{ backgroundColor: '#FFC107' }}>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Total ({activeBetsList.length} Bets)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          ₹{activeBetsList.reduce((sum: number, b: BetRow) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                        {betTab === 1 && (
                          <>
                            <TableCell
                              sx={{
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                color: activeBetsList.reduce((sum: number, b: BetRow) => sum + (Number(b.pnl) || 0), 0) >= 0 ? 'green' : 'red',
                              }}
                            >
                              ₹{activeBetsList.reduce((sum: number, b: BetRow) => sum + (Number(b.pnl) || 0), 0).toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                          </>
                        )}
                      </TableRow>
                    ) : (
                      activeBetsList.slice(0, 50).map((bet: BetRow) => {
                        const pnl = betTab === 1 ? (bet.pnl || 0) : 0;
                        return (
                          <TableRow key={bet._id}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{bet.client}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{bet.selection}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Chip
                                label={bet.mode}
                                size="small"
                                sx={{
                                  bgcolor: bet.mode === 'L' ? '#72bbef' : '#faa9ba',
                                  color: '#000',
                                  fontWeight: 'bold',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{bet.rate || 0}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>₹{bet.amount}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatUTCDateTime12H(bet.createdAt)}</TableCell>
                            {betTab === 1 && (
                              <>
                                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', color: pnl >= 0 ? 'green' : 'red' }}>
                                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{bet.result}</TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  py: 4,
                }}
              >
                <Typography sx={{ color: '#1f2937', fontSize: '14px' }}>
                  No Active Bets
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* SUMMARY / TOTALS SEGMENT (Casino Specific for Selected Date) */}
      <Accordion defaultExpanded sx={{ boxShadow: 3, mb: 3, mt: 2 }}>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Typography variant="h6" fontWeight="bold">
            Summary / Totals ({dayjs(selectedDate).format('MMM DD, YYYY')})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Client (User Name)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Casino P/L</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Commission</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Net Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Share Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Grand Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!isPowerUser && (
                  summaryRows.length > 0 ? (
                    summaryRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {row.userFullName} ({row.userName})
                        </TableCell>
                        <TableCell sx={{ color: row.casinoPL >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                          ₹{row.casinoPL.toFixed(2)}
                        </TableCell>
                        <TableCell>₹{row.commission.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: row.netAmount >= 0 ? 'green' : 'red' }}>
                          ₹{row.netAmount.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: row.shareAmount >= 0 ? 'green' : 'red' }}>
                          ₹{row.shareAmount.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: row.grandTotal >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                          ₹{row.grandTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No Summary Data Found for {dayjs(selectedDate).format('MMM DD, YYYY')}
                      </TableCell>
                    </TableRow>
                  )
                )}

                {/* Total Row */}
                <TableRow sx={{ backgroundColor: '#FFC107' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell sx={{ color: totals.casinoPL >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.casinoPL.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    ₹{totals.commission.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: totals.netAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.netAmount.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: totals.shareAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.shareAmount.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: totals.grandTotal >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.grandTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* BETS PLACED BY USERS AS PER HIERARCHY */}
      {/* <Paper sx={{ boxShadow: 3, p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Bets Placed (Hierarchy)
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Selection</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mode/Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isBetsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Loading bets history...
                  </TableCell>
                </TableRow>
              ) : paginatedBets.length > 0 ? (
                paginatedBets.map((bet: BetRow) => (
                  <TableRow key={bet._id}>
                    <TableCell>{bet.client}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{bet.selection}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${bet.mode} ${bet.rate || 0}`}
                        color={bet.mode === 'L' ? 'primary' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>₹{bet.amount}</TableCell>
                    <TableCell>{formatUTCDateTime12H(bet.createdAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No bets placed for {dayjs(selectedDate).format('MMM DD, YYYY')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={betsList.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_event: unknown, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper> */}
      {/* Result Details Modal (10s Auto-Close) */}
      <CasinoResultDetailModal
        open={resultDetailOpen}
        onClose={() => setResultDetailOpen(false)}
        mid={selectedMid || ''}
        gtype={gtype}
      />

      {/* Rules Modal */}
      <CasinoRulesModal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        gtype={gtype}
      />
    </Box>
  );
}
