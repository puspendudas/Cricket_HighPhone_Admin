import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Paper,
  Table,
  Stack,
  Dialog,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { formatUTCDateTime12H } from 'src/utils/date';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';
import useAgnetApi from 'src/Api/agent_api/useAgnetApi';

import { Iconify } from 'src/components/iconify';

interface MatchItem {
  _id: string;
  gameId: string;
  eventName: string;
  eventTime: string;
  wonby: string | null;
}

interface CommissionPayload {
  match_id?: string;
  game_id?: string;
  user?: {
    user_name?: string;
    name?: string;
    type?: string;
    match_commission?: number;
    session_commission?: number;
  };
  parent?: {
    data?: {
      user_name?: string;
      name?: string;
    };
    match_commission?: number;
    session_commission?: number;
  };
  summary?: {
    total_bets?: number;
    total_fancy_stake?: number;
    net_match_pl?: number;
    net_session_pl?: number;
    total_net_pl?: number;
  };
  lena_h?: {
    parent_name?: string;
    session_commission?: number;
    match_commission?: number;
    total_commission?: number;
  };
  dena_h?: {
    session_commission?: number;
    match_commission?: number;
    total_commission?: number;
  };
  bets?: {
    data?: any[];
  };
}

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const extractCommissionPayload = (response: any): CommissionPayload | null => {
  if (!response) return null;
  if (response?.status && response?.data && typeof response.data === 'object') return response.data;
  if (response?.data?.data && typeof response.data.data === 'object') return response.data.data;
  if (response?.data?.match_id) return response.data;
  if (response?.match_id) return response;
  return null;
};

const getBets = (payload: CommissionPayload | null): any[] => {
  if (!payload) return [];
  if (Array.isArray((payload as any)?.bets)) return (payload as any).bets;
  if (Array.isArray(payload?.bets?.data)) return payload.bets.data;
  return [];
};

export function TotalProfitTableData() {
  const { fetchlenDen } = useAgnetApi();
  const { fetchMe } = useMeApi();
  const { fetchAllMatch } = useMatchApi();

  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [selectedEventName, setSelectedEventName] = useState<string>('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  const {
    data: allMatchData,
    isLoading: isMatchLoading,
    error: matchError,
  } = useQuery({
    queryKey: ['commissionAllMatches'],
    queryFn: fetchAllMatch,
  });

  const matchList: MatchItem[] = useMemo(() => allMatchData?.matches || [], [allMatchData]);

  useEffect(() => {
    if (!selectedGameId && matchList.length > 0) {
      setSelectedGameId(matchList[0].gameId);
    }
  }, [matchList, selectedGameId]);

  const {
    data: lenDenData,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ['commissionLenDenDetails', userId, selectedGameId],
    queryFn: () =>
      userId && selectedGameId
        ? fetchlenDen(selectedGameId, userId)
        : Promise.reject(new Error('Missing user ID or game ID')),
    enabled: !!userId && !!selectedGameId && detailsOpen,
  });

  const commissionPayload = useMemo(() => extractCommissionPayload(lenDenData), [lenDenData]);
  const bets = useMemo(() => getBets(commissionPayload), [commissionPayload]);

  const handleOpenDetails = (match: MatchItem) => {
    setSelectedGameId(match.gameId);
    setSelectedEventName(match.eventName);
    setDetailsOpen(true);
  };

  const detailRows = useMemo(
    () => [
      { label: 'Match Name', value: selectedEventName || 'N/A' },
      { label: 'User Name', value: commissionPayload?.user?.user_name || 'N/A' },
      { label: 'User Type', value: commissionPayload?.user?.type || 'N/A' },
      { label: 'Parent Name', value: commissionPayload?.parent?.data?.name || 'N/A' },
      { label: 'Total Bets', value: commissionPayload?.summary?.total_bets ?? 0 },
      {
        label: 'Total Fancy Stake',
        value: toNumber(commissionPayload?.summary?.total_fancy_stake).toFixed(2),
      },
      { label: 'Net Match P/L', value: toNumber(commissionPayload?.summary?.net_match_pl).toFixed(2) },
      { label: 'Net Session P/L', value: toNumber(commissionPayload?.summary?.net_session_pl).toFixed(2) },
      { label: 'Total Net P/L', value: toNumber(commissionPayload?.summary?.total_net_pl).toFixed(2) },
      {
        label: 'Lena - Total Commission',
        value: toNumber(commissionPayload?.lena_h?.total_commission).toFixed(2),
      },
      {
        label: 'Dena - Total Commission',
        value: toNumber(commissionPayload?.dena_h?.total_commission).toFixed(2),
      },
    ],
    [commissionPayload, selectedEventName]
  );

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          overflowX: 'auto',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '10px',
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Event List
        </Typography>

        {isMatchLoading ? (
          <Box p={3} textAlign="center">
            <CircularProgress size={24} />
          </Box>
        ) : matchError ? (
          <Box p={3} textAlign="center">
            <Typography color="error">Unable to load events</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Winner</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matchList.length > 0 ? (
                  matchList.map((match, index) => {
                    const isSelected = selectedGameId === match.gameId;
                    return (
                      <TableRow
                        key={match._id}
                        sx={{
                          backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{match.eventName}</TableCell>
                        <TableCell>{match.wonby || 'Pending'}</TableCell>
                        <TableCell>{formatUTCDateTime12H(match.eventTime)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color={isSelected ? 'primary' : 'default'}
                            onClick={() => handleOpenDetails(match)}
                          >
                            <Iconify icon="mdi-light:eye" width={20} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>No events available</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Commission Details - {selectedEventName} ({selectedGameId})
        </DialogTitle>
        <DialogContent dividers>
          {isDetailsLoading ? (
            <Box p={3} textAlign="center">
              <CircularProgress size={24} />
            </Box>
          ) : detailsError ? (
            <Typography color="error">Error loading commission details</Typography>
          ) : !commissionPayload ? (
            <Typography>No data available</Typography>
          ) : (
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Commission Data (API Response)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
                      <TableRow>
                        <TableCell sx={{ width: '35%' }}>Field</TableCell>
                        <TableCell>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailRows.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell sx={{ fontWeight: 700 }}>{row.label}</TableCell>
                          <TableCell>{String(row.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Bets Data
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Selection</TableCell>
                        <TableCell>Stake</TableCell>
                        <TableCell>Potential</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Team/Runner</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bets.length > 0 ? (
                        bets.map((bet: any, index: number) => (
                          <TableRow key={bet?._id || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{bet?.bet_type || 'N/A'}</TableCell>
                            <TableCell>{bet?.selection || 'N/A'}</TableCell>
                            <TableCell>{toNumber(bet?.stake_amount).toFixed(2)}</TableCell>
                            <TableCell>{toNumber(bet?.potential_winnings).toFixed(2)}</TableCell>
                            <TableCell>{bet?.status || 'N/A'}</TableCell>
                            <TableCell>{bet?.result || 'N/A'}</TableCell>
                            <TableCell>{bet?.team_name || bet?.runner_name || 'N/A'}</TableCell>
                            <TableCell>
                              {bet?.createdAt ? formatUTCDateTime12H(bet.createdAt) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            No bets found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Note
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Above details are shown from selected event action response.
                </Typography>
              </Paper>
            </Stack>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDetailsOpen(false)} variant="contained">
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
