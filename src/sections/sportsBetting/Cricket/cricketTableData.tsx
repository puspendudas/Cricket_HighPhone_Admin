import type { Match } from 'src/Interface/matchManagement.interface';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import React, { useState } from 'react';
import timezone from 'dayjs/plugin/timezone';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
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

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { Iconify } from 'src/components/iconify';

import win from '../../../../public/assets/win.png';

dayjs.extend(utc);
dayjs.extend(timezone);

export function CricketTableData() {
  const { fetchMe } = useMeApi();
  const { fetchAllMatch, fetchTotalData } = useMatchApi();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const navigate = useNavigate();

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userType = userData?.data?.type;
  const userId = userData?.data?._id;
  const parentId = userData?.data?.parent_id;


  // Fetch all matches
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['allMatches'],
    queryFn: fetchAllMatch,
  });

  // Fetch total data - Child/Current user
  const { data: totalDataResponse, isLoading: totalDataLoading } = useQuery({
    queryKey: ['totalData', userId],
    queryFn: () => fetchTotalData(userId!),
    enabled: !!userId,
  });

  // Fetch total data - MyLedger (Parent/admin side)
  const { data: parentTotalDataResponse } = useQuery({
    queryKey: ['totalData-parent', parentId],
    queryFn: () => fetchTotalData(parentId!),
    enabled: !!parentId,
  });

  // Process matches data
  const matches = React.useMemo(() => {
    if (!matchesData?.matches) return [];

    const activeMatches = matchesData.matches.filter((m: any) => m.status === true);

    const sortedMatches = activeMatches.sort(
      (a: any, b: any) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
    );

    return sortedMatches.map((m: any) => ({
      gameId: m.gameId,
      _id: m._id,
      eventName: m.eventName || 'N/A',
      eventTime: m.eventTime || 'N/A',
      wonby: m.wonby || null,
      declared: m.declared ?? false,
      status: m.status,
    }));
  }, [matchesData]);



  // My Share P/L = Child grandTotal (SuperAdmin) or Child grandTotal - Parent grandTotal (SubAdmin)
  const myShareByMatch = React.useMemo(() => {
    const out: Record<string, number> = {};
    const parentMatchesMap = new Map<string, any>();
    (parentTotalDataResponse?.matches || []).forEach((m: any) => parentMatchesMap.set(m._id, m));

    matches.forEach((m: any) => {
      const childMatch = (totalDataResponse?.matches || []).find((cm: any) => cm._id === m._id);
      const parentMatch = parentMatchesMap.get(m._id);

      if (!parentId) {
        // SuperAdmin: Full match grandTotal retained
        out[m._id] = childMatch?.grandTotal !== undefined ? Number(childMatch.grandTotal.toFixed(2)) : 0;
      } else if (childMatch?.grandTotal !== undefined && parentMatch?.grandTotal !== undefined) {
        // Sub-admin: Net retained share = child grandTotal - parent grandTotal
        out[m._id] = Number((childMatch.grandTotal - parentMatch.grandTotal).toFixed(2));
      } else {
        out[m._id] = 0;
      }
    });
    return out;
  }, [matches, totalDataResponse, parentTotalDataResponse, parentId]);

  // Authoritative server-provided match summaries
  const plDataMap = React.useMemo(() => {
    if (!totalDataResponse?.matches) return {};

    const plMap: Record<string, { matchPL: number; afterCommission: number }> = {};

    totalDataResponse.matches.forEach((match: any) => {
      if (match.grandTotal !== undefined || match.totalMatchPL !== undefined) {
        plMap[match._id] = {
          matchPL: match.totalMatchPL ?? 0,
          afterCommission: match.grandTotal ?? 0,
        };
        return;
      }

      if (match.summary && Array.isArray(match.summary) && match.summary.length > 0) {
        const total = match.summary.reduce((acc: number, row: any) => acc + (row.total || 0), 0);
        const grandTotal = match.summary.reduce((acc: number, row: any) => acc + (row.grandTotal || 0), 0);
        plMap[match._id] = {
          matchPL: Number(total.toFixed(2)),
          afterCommission: Number(grandTotal.toFixed(2)),
        };
        return;
      }

      plMap[match._id] = { matchPL: 0, afterCommission: 0 };
    });

    return plMap;
  }, [totalDataResponse]);

  // Totals bar
  const totalData = React.useMemo(() => {
    let totalPL = 0;
    let mySharePL = 0;

    matches.forEach((match: any) => {
      const plData = plDataMap[match._id];
      if (plData) {
        totalPL += plData.matchPL;
      }
      mySharePL += myShareByMatch[match._id] ?? 0;
    });

    return { totalPL, mySharePL };
  }, [matches, plDataMap, myShareByMatch]);

  // Rest of the component remains the same...
  const handleClick = (event: React.MouseEvent<HTMLElement>, row: Match) => {
    setAnchorEl(event.currentTarget);
    setSelectedMatch(row);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const invertSign = (n?: number) => {
    if (typeof n !== 'number') return 0;
    return n < 0 ? -n : n;
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  // Get P/L for individual match
  const getIndividualMatchPL = (matchId: string) =>
    plDataMap[matchId] || { matchPL: 0, afterCommission: 0 };

  if (matchesLoading || totalDataLoading) {
    return (
      <Paper sx={{ boxShadow: 3, p: 3 }}>
        <Typography>Loading match data...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ boxShadow: 3 }}>
      {/* Header */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: 1, flexWrap: 'wrap' }}
      >
        <Grid item>
          <Typography variant="h5" sx={{ mb: { xs: 1, md: 0 } }}>
            Cricket Betting
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
                color={totalData.mySharePL >= 0 ? 'success.main' : 'error.main'}
              >
                {typeof totalData?.mySharePL === 'number'
                  ? formatINR(invertSign(totalData.mySharePL))
                  : '₹0.00'}
              </Typography>
            </Box>

            {/* Divider */}
            <Box sx={{ width: '1px', height: 24, backgroundColor: '#ccc' }} />

            {/* Total P/L */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontSize={14} fontWeight="bold">
                Total P/L:
              </Typography>
              <Typography
                fontSize={14}
                fontWeight="bold"
                color={totalData.totalPL >= 0 ? 'success.main' : 'error.main'}
              >
                {typeof totalData?.totalPL === 'number'
                  ? formatINR(invertSign(totalData.totalPL))
                  : '₹0.00'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Table */}
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Match</TableCell>
              <TableCell>Winner</TableCell>
              <TableCell>My Share P/L</TableCell>
              <TableCell>Total P/L</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.length > 0 ? (
              matches.map((match: Match, index: number) => {
                const { matchPL } = getIndividualMatchPL(match._id);
                const myShare = myShareByMatch[match._id] ?? 0;

                return (
                  <TableRow
                    key={match._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (match.declared === false) {
                        navigate(`/cricket-live-match-data/${match.gameId}`);
                      } else {
                        navigate(`/sport/display-match/${match.gameId}`);
                      }
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {formatUTCDateTime12H(match.eventTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {match.eventName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {match.wonby ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img src={win} alt="winner" width={24} height={24} />
                          <Typography>{match.wonby}</Typography>
                        </Box>
                      ) : match.declared === true && !match.wonby ? (
                        <Typography sx={{ color: 'red' }}>Cancel Match</Typography>
                      ) : (
                        <Typography>--</Typography>
                      )}
                    </TableCell>

                    {/* My Share P/L */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ color: myShare >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatINR(myShare)}
                      </Typography>
                    </TableCell>

                    {/* Total P/L (using same commission logic as DisplayMatch.tsx) */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ color: matchPL >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatINR(matchPL)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      {userType === 'super_admin' ? (
                        <IconButton onClick={(e: React.MouseEvent<HTMLElement>) => handleClick(e, match)}>
                          <Iconify icon="material-symbols:more-vert" />
                        </IconButton>
                      ) : (
                        <Typography variant="body2" color="text.secondary">--</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 3 }}>
                    No active matches found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Menu Actions */}
      {userType === 'super_admin' && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem
            onClick={() => {
              if (selectedMatch) {
                navigate(`/deleted-bet/${selectedMatch.gameId}`);
                handleClose();
              }
            }}
          >
            <Iconify icon="material-symbols:delete" sx={{ mr: 1 }} />
            Deleted Bet
          </MenuItem>

          <MenuItem
            onClick={() => {
              if (selectedMatch) {
                navigate(`/sport/undeclared-match/${selectedMatch.gameId}`);
                handleClose();
              }
            }}
          >
            <Iconify icon="material-symbols:visibility-outline" sx={{ mr: 1 }} />
            Un Declared Bet
          </MenuItem>
        </Menu>
      )}
    </Paper>
  );
}
