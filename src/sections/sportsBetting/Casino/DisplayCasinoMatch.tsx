import { useParams, useSearchParams } from 'react-router-dom';
import React, { useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';

import {
  Accordion,
  AccordionDetails,
  Box,
  AccordionSummary,
  Card,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';
import { Iconify } from 'src/components/iconify';
import { formatUTCDateTime12H } from 'src/utils/date';

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

const getCasinoTeams = (gameType: string) => {
  if (gameType === 'dt20') return ['Dragon', 'Tiger'];
  if (gameType === 'lucky7eu') return ['Low', 'High', 'Even', 'Odd', 'Red', 'Black'];
  return ['Player A', 'Player B'];
};

const GAME_TITLES: Record<string, string> = {
  teen20: '20-20 TEENPATTI',
  teen: 'TEEN PATTI 1 DAY',
  dt20: '20-20 DRAGON TIGER',
  lucky7eu: 'LUCKY 7 B',
};

export default function DisplayCasinoMatch() {
  const { gameCode } = useParams();
  const gtype = gameCode || 'teen20';
  const title = GAME_TITLES[gtype] || gtype.toUpperCase();

  const [searchParams] = useSearchParams();
  const rawDateParam = searchParams.get('date');
  const selectedDate = rawDateParam ? rawDateParam.split('T')[0] : dayjs().format('YYYY-MM-DD');

  const { fetchMe } = useMeApi();
  const { getAdminGameBets } = useCasinoApi();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const pastTeams = useMemo(() => getCasinoTeams(gtype), [gtype]);

  // Fetch logged in admin data
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;
  const userType = userData?.data?.type;
  const isPowerUser = userType === 'power_user';

  // Fetch admin game bets, hierarchy summary & exposure for the selected date
  const { data: gameBetsData, isLoading: isBetsLoading } = useQuery({
    queryKey: ['adminGameBets', userId, gtype, selectedDate],
    queryFn: () => getAdminGameBets(gtype, selectedDate),
    enabled: !!userId,
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

  const declaredBets = useMemo(
    () =>
      nonDeletedBets.filter((b: BetRow) => {
        const s = (b.status || '').toUpperCase();
        const r = (b.result || '').toUpperCase();
        return s === 'SETTLED' || s === 'WON' || s === 'LOST' || r === 'WON' || r === 'LOST';
      }),
    [nonDeletedBets]
  );

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

  const displayTitle = `${title} (${dayjs(selectedDate).format('MMM DD, YYYY')})`;

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Grid container spacing={{ xs: 1.5, md: 3 }}>
        {/* LEFT 50% */}
        <Grid item xs={12} md={6}>
          {/* Header */}
          <Paper
            sx={{
              alignItems: 'center',
              bgcolor: '#00A76F',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              mb: { xs: 1.5, md: 3 },
              px: { xs: 1.5, md: 3 },
              py: 2,
              borderRadius: '6px',
            }}
          >
            <Box>
              <Typography
                sx={{ color: '#ebebebff', fontSize: { xs: '14px', md: '18px' }, fontWeight: 'bold' }}
              >
                {displayTitle}
              </Typography>
            </Box>
          </Paper>

          {/* Exposure Card */}
          <Card sx={{ mb: 3 }}>
            <Box sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Team
                  </Typography>
                  {pastTeams.map((team: string, index: number) => (
                    <Typography key={index} variant="body1" sx={{ mb: 1.5 }}>
                      {team}
                    </Typography>
                  ))}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    Amount
                  </Typography>
                  {pastTeams.map((team: string, index: number) => {
                    const teamPL = getExposureForPlayer(team, index);
                    return (
                      <Typography
                        key={index}
                        sx={{ mb: 1.5, fontWeight: 'bold', color: teamPL >= 0 ? 'green' : 'red', textAlign: 'center' }}
                      >
                        {teamPL >= 0 ? '+' : ''}{teamPL.toFixed(2)}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* RIGHT 50% - CASINO BETS */}
        <Grid item xs={12} md={6}>
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
            </Box>
            <Divider sx={{ mb: 2 }} />

            {declaredBets.length > 0 ? (
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
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>P/L</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Winner</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isPowerUser ? (
                      <TableRow sx={{ backgroundColor: '#FFC107' }}>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Total ({declaredBets.length} Bets)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          ₹{declaredBets.reduce((sum: number, b: BetRow) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            color: declaredBets.reduce((sum: number, b: BetRow) => sum + (Number(b.pnl) || 0), 0) >= 0 ? 'green' : 'red',
                          }}
                        >
                          ₹{declaredBets.reduce((sum: number, b: BetRow) => sum + (Number(b.pnl) || 0), 0).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>--</TableCell>
                      </TableRow>
                    ) : (
                      declaredBets.slice(0, 50).map((bet: BetRow) => {
                        const pnl = bet.pnl || 0;
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
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', color: pnl >= 0 ? 'green' : 'red' }}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{bet.result}</TableCell>
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

      {/* SUMMARY / TOTALS SEGMENT */}
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

    </Box>
  );
}
