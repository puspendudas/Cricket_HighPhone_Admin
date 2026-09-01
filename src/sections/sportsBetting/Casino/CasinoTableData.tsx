import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState } from 'react';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Grid,
  Menu,
  IconButton,
  Paper,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Typography,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';

import { formatUTCDateTime12H } from 'src/utils/date';
import { Iconify } from 'src/components/iconify';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface CasinoItem {
  id: number;
  gameCode: string;
  name: string;
  path: string;
  date: string;
  dateLabel: string;
  mySharePL: number;
  totalPL: number;
  hasData: boolean;
}

// User-specified series sequence: teen20, Teen, dt20, Lucky 7
const CASINO_GAMES = [
  { gameCode: 'teen20', name: 'TeenPatti 20 20', path: '/casino/teen20' },
  { gameCode: 'teen', name: 'Teen Patti 1 Day', path: '/casino/teen' },
  { gameCode: 'dt20', name: 'Dragon Tiger 20 20', path: '/casino/dt20' },
  { gameCode: 'lucky7eu', name: 'Lucky 7 B', path: '/casino/lucky7eu' },
];

export function CasinoTableData() {
  const { fetchMe } = useMeApi();
  const { getAdminCasinoReports } = useCasinoApi();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCasino, setSelectedCasino] = useState<CasinoItem | null>(null);

  // Fetch current logged in admin info
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userType = userData?.data?.type;

  // Fetch casino reports data
  const { data: casinoReports } = useQuery({
    queryKey: ['adminCasinoReports'],
    queryFn: () => getAdminCasinoReports(),
    refetchInterval: 10000,
  });

  // Build report map by date_gameCode and gameCode fallback
  const reportsMap = useMemo(() => {
    const map: Record<
      string,
      { mySharePL: number; totalBets: number; totalPL: number; totalStake: number }
    > = {};

    if (Array.isArray(casinoReports)) {
      casinoReports.forEach((r: any) => {
        const code = r.game_code || r._id;
        const dateStr = r.date || 'today';
        const key = `${dateStr}_${code}`;

        const totalPL = r.total_pl || 0;
        const shareRate = (userData?.data?.share || 0) / 100;
        const mySharePL = r.my_share_pl !== undefined ? r.my_share_pl : (totalPL * shareRate);

        map[key] = {
          totalPL,
          totalStake: r.total_stake || 0,
          mySharePL,
          totalBets: r.total_bets || 0,
        };

        // Also aggregate by gameCode alone for quick lookup
        if (!map[code]) {
          map[code] = { totalPL: 0, totalStake: 0, mySharePL: 0, totalBets: 0 };
        }
        map[code].totalPL += totalPL;
        map[code].totalStake += r.total_stake || 0;
        map[code].mySharePL += mySharePL;
        map[code].totalBets += r.total_bets || 0;
      });
    }

    return map;
  }, [casinoReports, userData]);

  // Construct date-wise casino rows according to specified rules:
  // 1. Series order: teen20, Teen, dt20, Lucky 7
  // 2. 1st 4 rows ALWAYS display Today's 4 casinos
  // 3. Subsequent rows for past dates ONLY display if bet data exists for that casino on that date
  // 4. Unlimited rows as long as bet data is available in the database
  const casinoRows = useMemo(() => {
    const todayStr = dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const rows: CasinoItem[] = [];
    let currentId = 1;

    // --- Step 1: First 4 rows (Today's 4 casinos in specified series order) ---
    CASINO_GAMES.forEach((game) => {
      const todayKey = `${todayStr}_${game.gameCode}`;
      const fallbackTodayKey = `today_${game.gameCode}`;
      const report = reportsMap[todayKey] || reportsMap[fallbackTodayKey] || {
        totalPL: 0,
        totalStake: 0,
        mySharePL: 0,
        totalBets: 0,
      };

      rows.push({
        id: currentId,
        gameCode: game.gameCode,
        name: game.name,
        path: game.path,
        date: dayjs().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss'),
        dateLabel: `Today, ${dayjs().tz('Asia/Kolkata').format('hh:mm:ss A')}`,
        mySharePL: report.mySharePL,
        totalPL: report.totalPL,
        hasData: report.totalBets > 0 || report.totalStake > 0 || report.totalPL !== 0,
      });
      currentId += 1;
    });

    // --- Step 2: Past dates (Only include casinos that have actual bet data for that date) ---
    const pastDatesSet = new Set<string>();
    if (Array.isArray(casinoReports)) {
      casinoReports.forEach((r: any) => {
        if (r.date && r.date !== todayStr && r.date !== 'today') {
          pastDatesSet.add(r.date);
        }
      });
    }

    // Sort past dates descending (newest past date first)
    const sortedPastDates = Array.from(pastDatesSet).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    sortedPastDates.forEach((dateStr) => {
      CASINO_GAMES.forEach((game) => {
        const key = `${dateStr}_${game.gameCode}`;
        const report = reportsMap[key];

        // Include past date row ONLY if bet data is available
        if (report && (report.totalBets > 0 || report.totalStake > 0 || report.totalPL !== 0)) {
          rows.push({
            id: currentId,
            gameCode: game.gameCode,
            name: game.name,
            path: game.path,
            date: dayjs(dateStr).format('YYYY-MM-DDTHH:mm:ss'),
            dateLabel: dayjs(dateStr).format('MMM DD, YYYY'),
            mySharePL: report.mySharePL,
            totalPL: report.totalPL,
            hasData: true,
          });
          currentId += 1;
        }
      });
    });

    return rows;
  }, [reportsMap, casinoReports]);

  // Cumulative P/L summary for top header box
  const totalSummary = useMemo(() => {
    let totalPL = 0;
    let mySharePL = 0;
    if (Array.isArray(casinoReports)) {
      const shareRate = (userData?.data?.share || 0) / 100;
      casinoReports.forEach((r: any) => {
        totalPL += (r.total_pl || 0);
        mySharePL += r.my_share_pl !== undefined ? r.my_share_pl : ((r.total_pl || 0) * shareRate);
      });
    }

    return { totalPL, mySharePL };
  }, [casinoReports, userData]);

  const handleClick = (event: React.MouseEvent<HTMLElement>, row: CasinoItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedCasino(row);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <Paper sx={{ boxShadow: 3 }}>
      {/* Top Header & Summary Card */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ gap: 2, p: 2, flexWrap: 'wrap' }}
      >
        <Grid item>
          <Typography variant="h5">
            Casino Betting
          </Typography>
        </Grid>

        <Grid item>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              flexWrap: 'wrap',
            }}
          >
            {/* My Share P/L */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontSize={14} fontWeight="bold">
                My Share P/L:
              </Typography>
              <Typography
                fontSize={14}
                fontWeight="bold"
                color={totalSummary.mySharePL >= 0 ? 'success.main' : 'error.main'}
              >
                {formatINR(totalSummary.mySharePL)}
              </Typography>
            </Box>

            {/* Vertical Divider */}
            <Box sx={{ width: '1px', height: 24, backgroundColor: '#ccc' }} />

            {/* Total P/L */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontSize={14} fontWeight="bold">
                Total P/L:
              </Typography>
              <Typography
                fontSize={14}
                fontWeight="bold"
                color={totalSummary.totalPL >= 0 ? 'success.main' : 'error.main'}
              >
                {formatINR(totalSummary.totalPL)}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Casino</TableCell>
              <TableCell>My Share P/L</TableCell>
              <TableCell>Total P/L</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {casinoRows.length > 0 ? (
              casinoRows.map((row: CasinoItem) => (
                <TableRow
                  key={`${row.id}-${row.gameCode}`}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    const dateParam = dayjs(row.date).format('YYYY-MM-DD');
                    const isToday = dateParam === dayjs().format('YYYY-MM-DD');
                    if (isToday) {
                      navigate(`${row.path}?date=${dateParam}`);
                    } else {
                      navigate(`/sport/display-casino-match/${row.gameCode}?date=${dateParam}`);
                    }
                  }}
                >
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {formatUTCDateTime12H(row.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{ color: row.mySharePL >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {formatINR(row.mySharePL)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{ color: row.totalPL >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {formatINR(row.totalPL)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    {userType === 'power_user' ? (
                      <Typography variant="body2" color="text.secondary">--</Typography>
                    ) : (
                      <IconButton onClick={(e: React.MouseEvent<HTMLElement>) => handleClick(e, row)}>
                        <Iconify icon="material-symbols:more-vert" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" sx={{ py: 3 }}>
                    No casino data found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (selectedCasino) {
              const dateParam = dayjs(selectedCasino.date).format('YYYY-MM-DD');
              const isToday = dateParam === dayjs().format('YYYY-MM-DD');
              if (isToday) {
                navigate(`${selectedCasino.path}?date=${dateParam}`);
              } else {
                navigate(`/sport/display-casino-match/${selectedCasino.gameCode}?date=${dateParam}`);
              }
              handleClose();
            }
          }}
        >
          <Iconify icon="material-symbols:play-circle-outline" sx={{ mr: 1 }} />
          Play Casino Game
        </MenuItem>

        {userType === 'super_admin' && (
          <MenuItem
            onClick={() => {
              if (selectedCasino) {
                navigate(`/deleted-bet/${selectedCasino.gameCode}`);
                handleClose();
              }
            }}
          >
            <Iconify icon="material-symbols:delete" sx={{ mr: 1 }} />
            Deleted Bet
          </MenuItem>
        )}

        {userType === 'super_admin' && (
          <MenuItem
            onClick={() => {
              if (selectedCasino) {
                navigate(`/sport/undeclared-match/${selectedCasino.gameCode}`);
                handleClose();
              }
            }}
          >
            <Iconify icon="material-symbols:visibility-outline" sx={{ mr: 1 }} />
            Un Declared Bet
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
}