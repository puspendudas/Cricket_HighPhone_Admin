import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Chip,
  Grid,
  Menu,
  Paper,
  Table,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
} from '@mui/material';

import { formatUTCDateTime12H } from 'src/utils/date';
import {
  calculateMySharePL,
  calculateCommission,
  calculateClientNetAmount,
} from 'src/utils/commissionUtils';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';
import { Iconify } from 'src/components/iconify';

import win from '../../../../public/assets/win.png';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface UnifiedSportItem {
  id: number;
  type: 'cricket' | 'casino';
  key: string;
  name: string;
  date: string;
  wonby?: string | null;
  declared?: boolean;
  gameId?: string; // Cricket gameId
  gameCode?: string; // Casino gameCode
  path?: string; // Casino route path
  mySharePL: number;
  totalPL: number;
  hasData?: boolean;
}

const CASINO_GAMES = [
  { gameCode: 'teen20', name: 'TeenPatti 20 20', path: '/casino/teen20' },
  { gameCode: 'teen', name: 'Teen Patti 1 Day', path: '/casino/teen' },
  { gameCode: 'dt20', name: 'Dragon Tiger 20 20', path: '/casino/dt20' },
  { gameCode: 'lucky7eu', name: 'Lucky 7 B', path: '/casino/lucky7eu' },
];

export function AllPositionsTableData() {
  const { fetchMe } = useMeApi();
  const { fetchAllMatch, fetchTotalData } = useMatchApi();
  const { getAdminCasinoReports } = useCasinoApi();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<UnifiedSportItem | null>(null);

  // Fetch logged in user info
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userType = userData?.data?.type;
  const userId = userData?.data?._id;
  const parentId = userData?.data?.parent_id;

  // 1. Fetch Cricket matches & total data
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['allMatches'],
    queryFn: fetchAllMatch,
  });

  const { data: totalDataResponse, isLoading: totalDataLoading } = useQuery({
    queryKey: ['totalData', userId],
    queryFn: () => fetchTotalData(userId!),
    enabled: !!userId,
  });

  const { data: parentTotalDataResponse } = useQuery({
    queryKey: ['totalData-parent', parentId],
    queryFn: () => fetchTotalData(parentId!),
    enabled: !!parentId,
  });

  // 2. Fetch Casino reports
  const { data: casinoReports, isLoading: casinoReportsLoading } = useQuery({
    queryKey: ['adminCasinoReports'],
    queryFn: () => getAdminCasinoReports(),
    refetchInterval: 10000,
  });

  // Process Cricket Matches
  const matches = useMemo(() => {
    if (!matchesData?.matches) return [];

    const activeMatches = matchesData.matches.filter((m: any) => m.status === true);

    return activeMatches.map((m: any) => ({
      gameId: m.gameId,
      _id: m._id,
      eventName: m.eventName || 'N/A',
      eventTime: m.eventTime || 'N/A',
      wonby: m.wonby || null,
      declared: m.declared ?? false,
      status: m.status,
    }));
  }, [matchesData]);

  // Build per-match net from totalData response for Cricket
  const buildNetByMatch = React.useCallback(
    (resp: any, restrictImmediateChildId?: string) => {
      if (!resp?.matches) return {};
      const matchNet: Record<string, number> = {};
      const processedMatches = new Set<string>();

      resp.matches.forEach((match: any) => {
        if (processedMatches.has(match._id)) return;
        processedMatches.add(match._id);

        const clientSummaries = match.client_summary || [];
        const summariesByClient: Record<string, any[]> = {};

        clientSummaries.forEach((c: any) => {
          const cid = c.immediate_child_admin?._id || 'unknown';
          if (!summariesByClient[cid]) summariesByClient[cid] = [];
          summariesByClient[cid].push(c);
        });

        Object.values(summariesByClient).forEach((adminSummaries) => {
          const admin = adminSummaries[0]?.immediate_child_admin;
          if (!admin) return;

          if (restrictImmediateChildId && admin._id !== restrictImmediateChildId) return;

          const net = calculateClientNetAmount(adminSummaries);
          matchNet[match._id] = (matchNet[match._id] || 0) + net;
        });
      });

      return matchNet;
    },
    []
  );

  const childNetByMatch = useMemo(
    () => buildNetByMatch(totalDataResponse),
    [totalDataResponse, buildNetByMatch]
  );

  const myLedgerNetByMatch = useMemo(
    () => buildNetByMatch(parentTotalDataResponse, userId),
    [parentTotalDataResponse, userId, buildNetByMatch]
  );

  // Cricket My Share P/L
  const myShareByMatch = useMemo(() => {
    const out: Record<string, number> = {};
    matches.forEach((m: any) => {
      const child = childNetByMatch[m._id] || 0;
      const mine = myLedgerNetByMatch[m._id] || 0;
      out[m._id] = calculateMySharePL(child, mine);
    });
    return out;
  }, [matches, childNetByMatch, myLedgerNetByMatch]);

  // Cricket Total P/L calculation using commission logic
  const plDataMap = useMemo(() => {
    if (!totalDataResponse?.matches) return {};

    const plMap: Record<string, { matchPL: number; afterCommission: number }> = {};

    totalDataResponse.matches.forEach((match: any) => {
      if (!match?.client_summary?.length) {
        plMap[match._id] = { matchPL: 0, afterCommission: 0 };
        return;
      }

      const clientSummaries = match.client_summary || [];
      const summariesByAdmin: Record<string, any[]> = {};
      clientSummaries.forEach((c: any) => {
        const adminId = c.immediate_child_admin?._id || 'unknown';
        if (!summariesByAdmin[adminId]) summariesByAdmin[adminId] = [];
        summariesByAdmin[adminId].push(c);
      });

      let totalMatchPL = 0;
      let totalAfterCommission = 0;

      Object.values(summariesByAdmin).forEach((adminSummaries: any[]) => {
        const result = calculateCommission(adminSummaries);
        totalMatchPL += result.matchPL + result.sessionPL;
        totalAfterCommission += result.grandTotal;
      });

      plMap[match._id] = {
        matchPL: totalMatchPL,
        afterCommission: totalAfterCommission,
      };
    });

    return plMap;
  }, [totalDataResponse]);

  // Build Casino reports map
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

  // Build Unified Merged Rows (Cricket + Casino) sorted Date-Wise
  const unifiedRows = useMemo(() => {
    const rows: UnifiedSportItem[] = [];

    // 1. Convert Cricket matches to Unified items
    matches.forEach((m: any) => {
      const plData = plDataMap[m._id] || { matchPL: 0, afterCommission: 0 };
      const myShare = myShareByMatch[m._id] ?? 0;

      rows.push({
        id: 0,
        type: 'cricket',
        key: `cricket_${m._id}`,
        name: m.eventName,
        date: m.eventTime,
        wonby: m.wonby,
        declared: m.declared,
        gameId: m.gameId,
        mySharePL: myShare,
        totalPL: plData.matchPL,
      });
    });

    // 2. Convert Casino items to Unified items
    const todayStr = dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD');

    // Step 2a: Today's 4 Casinos
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
        id: 0,
        type: 'casino',
        key: `casino_today_${game.gameCode}`,
        gameCode: game.gameCode,
        name: game.name,
        path: game.path,
        date: dayjs().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss'),
        wonby: null,
        declared: true,
        mySharePL: report.mySharePL,
        totalPL: report.totalPL,
        hasData: report.totalBets > 0 || report.totalStake > 0 || report.totalPL !== 0,
      });
    });

    // Step 2b: Past Dates Casinos (only if data exists)
    const pastDatesSet = new Set<string>();
    if (Array.isArray(casinoReports)) {
      casinoReports.forEach((r: any) => {
        if (r.date && r.date !== todayStr && r.date !== 'today') {
          pastDatesSet.add(r.date);
        }
      });
    }

    const sortedPastDates = Array.from(pastDatesSet).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    sortedPastDates.forEach((dateStr) => {
      CASINO_GAMES.forEach((game) => {
        const key = `${dateStr}_${game.gameCode}`;
        const report = reportsMap[key];

        if (report && (report.totalBets > 0 || report.totalStake > 0 || report.totalPL !== 0)) {
          rows.push({
            id: 0,
            type: 'casino',
            key: `casino_${dateStr}_${game.gameCode}`,
            gameCode: game.gameCode,
            name: game.name,
            path: game.path,
            date: dayjs(dateStr).format('YYYY-MM-DDTHH:mm:ss'),
            wonby: null,
            declared: true,
            mySharePL: report.mySharePL,
            totalPL: report.totalPL,
            hasData: true,
          });
        }
      });
    });

    // 3. Sort descending date-wise (newest event/casino first)
    rows.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return a.name.localeCompare(b.name);
    });

    // 4. Assign 1-based sequential ID
    return rows.map((row, idx) => ({
      ...row,
      id: idx + 1,
    }));
  }, [matches, plDataMap, myShareByMatch, reportsMap, casinoReports]);

  // Combined Cumulative Totals for Header Box
  const totalSummary = useMemo(() => {
    // Cricket Totals
    let cricketTotalPL = 0;
    let cricketMySharePL = 0;
    matches.forEach((m: any) => {
      const plData = plDataMap[m._id];
      if (plData) {
        cricketTotalPL += plData.matchPL;
      }
      cricketMySharePL += myShareByMatch[m._id] ?? 0;
    });

    // Casino Totals
    let casinoTotalPL = 0;
    let casinoMySharePL = 0;
    if (Array.isArray(casinoReports)) {
      const shareRate = (userData?.data?.share || 0) / 100;
      casinoReports.forEach((r: any) => {
        casinoTotalPL += (r.total_pl || 0);
        casinoMySharePL += r.my_share_pl !== undefined ? r.my_share_pl : ((r.total_pl || 0) * shareRate);
      });
    }

    return {
      totalPL: cricketTotalPL + casinoTotalPL,
      mySharePL: cricketMySharePL + casinoMySharePL,
    };
  }, [matches, plDataMap, myShareByMatch, casinoReports, userData]);

  const handleClick = (event: React.MouseEvent<HTMLElement>, row: UnifiedSportItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(row);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleRowClick = (item: UnifiedSportItem) => {
    if (item.type === 'cricket') {
      if (item.declared === false) {
        navigate(`/cricket-live-match-data/${item.gameId}`);
      } else {
        navigate(`/sport/display-match/${item.gameId}`);
      }
    } else if (item.type === 'casino') {
      const dateParam = dayjs(item.date).format('YYYY-MM-DD');
      const isToday = dateParam === dayjs().format('YYYY-MM-DD');
      if (isToday) {
        navigate(`${item.path}?date=${dateParam}`);
      } else {
        navigate(`/sport/display-casino-match/${item.gameCode}?date=${dateParam}`);
      }
    }
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  if (matchesLoading || totalDataLoading || casinoReportsLoading) {
    return (
      <Paper sx={{ boxShadow: 3, p: 3 }}>
        <Typography>Loading sports betting data...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ boxShadow: 3 }}>
      {/* Top Header & Summary Card */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
      >
        <Grid item>
          <Typography variant="h5">
            All Betting
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

      {/* Main Merged Table */}
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 850 }}>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Event / Casino</TableCell>
              <TableCell>Winner</TableCell>
              <TableCell>My Share P/L</TableCell>
              <TableCell>Total P/L</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {unifiedRows.length > 0 ? (
              unifiedRows.map((row: UnifiedSportItem) => (
                <TableRow
                  key={row.key}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(row)}
                >
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {formatUTCDateTime12H(row.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.type === 'cricket' ? 'Cricket' : 'Casino'}
                      size="small"
                      color={row.type === 'cricket' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {row.type === 'cricket' ? (
                      row.wonby ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img src={win} alt="winner" width={24} height={24} />
                          <Typography>{row.wonby}</Typography>
                        </Box>
                      ) : row.declared === true && !row.wonby ? (
                        <Typography sx={{ color: 'error.main' }}>Cancel Match</Typography>
                      ) : (
                        <Typography>--</Typography>
                      )
                    ) : (
                      <Typography color="text.secondary">--</Typography>
                    )}
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
                    {userType !== 'power_user' && (row.type === 'casino' || userType === 'super_admin') ? (
                      <IconButton onClick={(e: React.MouseEvent<HTMLElement>) => handleClick(e, row)}>
                        <Iconify icon="material-symbols:more-vert" />
                      </IconButton>
                    ) : (
                      <Typography variant="body2" color="text.secondary">--</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 3 }}>
                    No sports betting data found
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
        {selectedItem?.type === 'cricket' && (
          <>
            {userType === 'super_admin' && (
              <MenuItem
                onClick={() => {
                  if (selectedItem?.gameId) {
                    navigate(`/deleted-bet/${selectedItem.gameId}`);
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
                  if (selectedItem?.gameId) {
                    navigate(`/sport/undeclared-match/${selectedItem.gameId}`);
                    handleClose();
                  }
                }}
              >
                <Iconify icon="material-symbols:visibility-outline" sx={{ mr: 1 }} />
                Un Declared Bet
              </MenuItem>
            )}
          </>
        )}

        {selectedItem?.type === 'casino' && (
          <>
            <MenuItem
              onClick={() => {
                if (selectedItem) {
                  const dateParam = dayjs(selectedItem.date).format('YYYY-MM-DD');
                  const isToday = dateParam === dayjs().format('YYYY-MM-DD');
                  if (isToday) {
                    navigate(`${selectedItem.path}?date=${dateParam}`);
                  } else {
                    navigate(`/sport/display-casino-match/${selectedItem.gameCode}?date=${dateParam}`);
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
                  if (selectedItem?.gameCode) {
                    navigate(`/deleted-bet/${selectedItem.gameCode}`);
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
                  if (selectedItem?.gameCode) {
                    navigate(`/sport/undeclared-match/${selectedItem.gameCode}`);
                    handleClose();
                  }
                }}
              >
                <Iconify icon="material-symbols:visibility-outline" sx={{ mr: 1 }} />
                Un Declared Bet
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </Paper>
  );
}