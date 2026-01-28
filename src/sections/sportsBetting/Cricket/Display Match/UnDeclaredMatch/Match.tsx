import type { Dayjs } from 'dayjs';
import type { SelectChangeEvent } from '@mui/material';

import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import {
  Box,
  Grid,
  Paper,
  Table,
  Button,
  Select,
  Dialog,
  MenuItem,
  TableRow,
  Checkbox,
  TableCell,
  TableHead,
  TableBody,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  DialogContentText,
} from '@mui/material';

import useMatchApi from 'src/Api/matchApi/useMatchApi';
import useBetHistroyApi from 'src/Api/matchApi/useBetHistroyApi';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

const Match = () => {
  const queryClient = useQueryClient();
  const { id: gameId } = useParams();
  const [team, setTeam] = useState('');
  const [bets, setBets] = useState('');
  const [fromDate1, setFromDate1] = useState<Dayjs | null>(null);
  const [fromTime1, setFromTime1] = useState<Dayjs | null>(null);
  const [fromDate2, setFromDate2] = useState<Dayjs | null>(null);
  const [fromTime2, setFromTime2] = useState<Dayjs | null>(null);

  const [selectedBets, setSelectedBets] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);

  const { FatchUpdateMatchData } = useMatchApi();
  const { fetchBetUndlecarHistory, deleteBetHistory } = useBetHistroyApi();

  // TanStack Query for fetching match data
  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ['matchData', gameId],
    queryFn: () => FatchUpdateMatchData(gameId!),
    enabled: !!gameId,
  });
  const normalizeTeam = (name = '') =>
    name.replace(/\./g, '').trim().toLowerCase();

  // Extract teams from match data
  const teams = useMemo<string[]>(
    () => matchData?.match?.teams || [],
    [matchData]
  );

  // TanStack Query for fetching bet history
  const {
    data: betHistoryData,
    isLoading: betHistoryLoading,
    error: betHistoryError
  } = useQuery({
    queryKey: ['betHistory', matchData?.match?._id],
    queryFn: () => fetchBetUndlecarHistory(matchData!.match._id),
    enabled: !!matchData?.match?._id,
  });



  // Delete bet mutation
  const deleteBetMutation = useMutation({
    mutationFn: (betId: string) => deleteBetHistory(betId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betHistory'] });
      toast.success('Bet deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting bet:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete bet');
    }
  });

  const deleteMultipleBetsMutation = useMutation({
    mutationFn: async (betIds: string[]) => {
      await betIds.reduce(
        (prevPromise, id) =>
          prevPromise.then(() => deleteBetHistory(id)),
        Promise.resolve()
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betHistory'] });
      setSelectedBets([]);
      toast.success('All bets deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting bets:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete bets');
    }
  });



  const filteredData = useMemo(() => {
    if (!betHistoryData?.data) return [];

    return betHistoryData.data.filter((row: any) => {
      if (row.match?.declared === true || row.bet_type !== 'BOOKMAKER') return false;

      // Apply team filter
      if (
        team &&
        normalizeTeam(row.team_name) !== normalizeTeam(team)
      ) {
        return false;
      }


      // Apply bets filter
      if (bets === "FAIR" && row.status !== "FAIR") return false;
      if (bets === "DELETED" && row.status !== "DELETED") return false;

      // Apply date/time filters
      const rowDate = dayjs(row.createdAt);

      if (fromDate1 && fromTime1) {
        const fromDateTime = dayjs(fromDate1)
          .set('hour', fromTime1.hour())
          .set('minute', fromTime1.minute());

        if (rowDate.isBefore(fromDateTime)) return false;
      }

      if (fromDate2 && fromTime2) {
        const toDateTime = dayjs(fromDate2)
          .set('hour', fromTime2.hour())
          .set('minute', fromTime2.minute());

        if (rowDate.isAfter(toDateTime)) return false;
      }

      return true;
    });
  }, [betHistoryData, team, bets, fromDate1, fromTime1, fromDate2, fromTime2]);

  const handleTeamChange = (event: SelectChangeEvent) => {
    setTeam(event.target.value as string);
  };

  const handleBetsChange = (event: SelectChangeEvent) => {
    setBets(event.target.value as string);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedBets(filteredData.map((bet: any) => bet.id));
    } else {
      setSelectedBets([]);
    }
  };

  const handleSelectBet = (betId: string) => {
    if (selectedBets.includes(betId)) {
      setSelectedBets(selectedBets.filter((id) => id !== betId));
    } else {
      setSelectedBets([...selectedBets, betId]);
    }
  };

  const handleDeleteBet = async (betId: string) => {
    deleteBetMutation.mutate(betId);
    setDeleteModalOpen(false);
  };

  const handleDeleteSelected = async () => {
    deleteMultipleBetsMutation.mutate(selectedBets);
    setDeleteAllModalOpen(false);
  };

  const loading = matchLoading || betHistoryLoading;
  const getDisplayTeam = (row: any) => {
    if (row.selection === 'Lay' && teams.length === 2) {
      const betTeam = normalizeTeam(row.team_name);
      const t0 = normalizeTeam(teams[0]);
      const t1 = normalizeTeam(teams[1]);

      if (betTeam === t0) return teams[1];
      if (betTeam === t1) return teams[0];
    }

    return row.team_name;
  };

  return (
    <>
      {/* Filter Section */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          m: { xs: 2, md: 1 },
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Grid container justifyContent="space-between" alignItems="center" sx={{ p: { xs: 0, md: 2 } }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Team Select */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Team</InputLabel>
                  <Select value={team} label="Select Team" onChange={handleTeamChange}>
                    <MenuItem value="">
                      <em>All Teams</em>
                    </MenuItem>
                    {teams.map((t: string) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Bets Select */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Bets</InputLabel>
                  <Select value={bets} label="Bets" onChange={handleBetsChange}>
                    <MenuItem value="">
                      <em>All Bets</em>
                    </MenuItem>
                    <MenuItem value="FAIR">Faire Bet</MenuItem>
                    <MenuItem value="DELETED">Deleted Bet</MenuItem>

                  </Select>
                </FormControl>
              </Grid>

              {/* Date / Time Filters */}
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="From Date"
                  value={fromDate1}
                  onChange={(newValue) => setFromDate1(newValue)}
                  format="DD/MM/YY"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TimePicker
                  format="HH:mm:ss"
                  label="From Time"
                  views={['hours', 'minutes', 'seconds']}
                  value={fromTime1}
                  onChange={(newValue) => setFromTime1(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <DatePicker
                  label="To Date"
                  value={fromDate2}
                  onChange={(newValue) => setFromDate2(newValue)}
                  format="DD/MM/YY"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TimePicker
                  label="To Time"
                  value={fromTime2}
                  onChange={(newValue) => setFromTime2(newValue)}
                  views={['hours', 'minutes', 'seconds']}
                  format="HH:mm:ss"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Grid>
      </Paper>

      {/* Table Section */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          m: { xs: 2, md: 1 },
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Grid item xs={12} container justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            color="error"
            sx={{ mr: { xs: 0, md: 2 }, width: { xs: '100%', sm: 'auto' } }}
            startIcon={<Iconify icon="eva:trash-2-outline" />}
            onClick={() => setDeleteAllModalOpen(true)}
            disabled={selectedBets.length === 0 || deleteMultipleBetsMutation.isPending}
          >
            {deleteMultipleBetsMutation.isPending ? (
              'Deleting...'
            ) : (
              `Delete Selected (${selectedBets.length})`
            )}
          </Button>
        </Grid>

        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedBets.length > 0 && selectedBets.length < filteredData.length}
                      checked={filteredData.length > 0 && selectedBets.length === filteredData.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : betHistoryError ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ color: 'error.main' }}>
                      Error loading data
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedBets.includes(row.id)}
                          onChange={() => handleSelectBet(row.id)}
                          disabled={row.status === "DELETED"}
                        />
                      </TableCell>
                      <TableCell>{row.user?.user_name || '-'}</TableCell>
                      <TableCell>{row.odds_rate}</TableCell>
                      <TableCell>{row.stake_amount}</TableCell>
                      <TableCell>{row.selection}</TableCell>
                      <TableCell>{getDisplayTeam(row)}</TableCell>
                      <TableCell>{dayjs(row.createdAt).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                      <TableCell>
                        {row.status === "DELETED" ? (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>Deleted</span>
                        ) : row.status === "PENDING" ? (
                          <span style={{ color: 'orange', fontWeight: 'bold' }}>Pending</span>
                        ) : row.status === "WON" ? (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>Won</span>
                        ) : row.status === "LOST" ? (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>Lost</span>
                        ) : (
                          row.status
                        )}
                      </TableCell>
                      <TableCell>
                        {row.status === "DELETED" ? (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>Already Deleted</span>
                        ) : (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Iconify icon="eva:trash-2-outline" />}
                            onClick={() => {
                              setSelectedBets([row.id]);
                              setDeleteModalOpen(true);
                            }}
                            disabled={deleteBetMutation.isPending}
                          >
                            {deleteBetMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No Data Found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Delete Confirmation Modal for Single Bet */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Bet
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this bet? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleteBetMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteBet(selectedBets[0])}
            color="error"
            disabled={deleteBetMutation.isPending}
            autoFocus
          >
            {deleteBetMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal for Multiple Bets */}
      <Dialog
        open={deleteAllModalOpen}
        onClose={() => setDeleteAllModalOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Selected Bets
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete {selectedBets.length} selected bets? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteAllModalOpen(false)}
            disabled={deleteMultipleBetsMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSelected}
            color="error"
            disabled={deleteMultipleBetsMutation.isPending}
            autoFocus
          >
            {deleteMultipleBetsMutation.isPending ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Match;