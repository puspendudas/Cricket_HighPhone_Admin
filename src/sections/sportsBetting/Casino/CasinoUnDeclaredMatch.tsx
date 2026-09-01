import type { Dayjs } from 'dayjs';
import type { SelectChangeEvent } from '@mui/material';

import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  Typography,
  FormControl,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  DialogContentText,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { getCasinoGameTitle, getCasinoSelections } from 'src/utils/casino';

export default function CasinoUnDeclaredMatch() {
  const queryClient = useQueryClient();
  const { id, gameCode } = useParams<{ id?: string; gameCode?: string }>();
  const gtype = (gameCode || id || 'teen').toLowerCase();
  const gameTitle = getCasinoGameTitle(gtype);
  const availableSelections = useMemo(() => getCasinoSelections(gtype), [gtype]);

  const [selectionFilter, setSelectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate1, setFromDate1] = useState<Dayjs | null>(null);
  const [fromTime1, setFromTime1] = useState<Dayjs | null>(null);
  const [fromDate2, setFromDate2] = useState<Dayjs | null>(null);
  const [fromTime2, setFromTime2] = useState<Dayjs | null>(null);

  const [selectedBets, setSelectedBets] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);

  const { fetchMe } = useMeApi();
  const { getAdminGameBets, deleteCasinoBet, deleteMultipleCasinoBets } = useCasinoApi();

  // Fetch logged in admin
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  // Fetch game bets
  const {
    data: gameBetsData,
    isLoading: betsLoading,
    error: betsError,
  } = useQuery({
    queryKey: ['adminGameBets', userId, gtype],
    queryFn: () => getAdminGameBets(gtype),
    enabled: !!userId && !!gtype,
  });

  // Delete single bet mutation
  const deleteBetMutation = useMutation({
    mutationFn: (betId: string) => deleteCasinoBet(betId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGameBets'] });
      toast.success('Bet deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting casino bet:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete bet');
    },
  });

  // Delete multiple bets mutation
  const deleteMultipleBetsMutation = useMutation({
    mutationFn: (betIds: string[]) => deleteMultipleCasinoBets(betIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGameBets'] });
      setSelectedBets([]);
      toast.success('All selected bets deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting bets:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete bets');
    },
  });

  // Filtered bets list - Only Unsettled / Pending bets (and Deleted if filtered)
  const filteredData = useMemo(() => {
    const rawBets = gameBetsData?.bets || [];

    return rawBets.filter((row: any) => {
      // Exclude settled bets completely from Undeclared Match view
      if (row.status === 'SETTLED') return false;

      // Apply selection filter
      if (selectionFilter && (row.selection || '').toLowerCase() !== selectionFilter.toLowerCase()) {
        return false;
      }

      // Apply status filter: default to PENDING (Unsettled) unless DELETED is selected
      if (statusFilter === 'DELETED') {
        if (row.status !== 'DELETED' && row.status !== 'CANCELLED') return false;
      } else if (row.status !== 'PENDING') {
        return false;
      }

      // Apply date/time filters
      const rowDate = dayjs(row.createdAt);

      if (fromDate1 && fromTime1) {
        const fromDateTime = dayjs(fromDate1)
          .set('hour', fromTime1.hour())
          .set('minute', fromTime1.minute())
          .set('second', fromTime1.second());

        if (rowDate.isBefore(fromDateTime)) return false;
      }

      if (fromDate2 && fromTime2) {
        const toDateTime = dayjs(fromDate2)
          .set('hour', fromTime2.hour())
          .set('minute', fromTime2.minute())
          .set('second', fromTime2.second());

        if (rowDate.isAfter(toDateTime)) return false;
      }

      return true;
    });
  }, [gameBetsData, selectionFilter, statusFilter, fromDate1, fromTime1, fromDate2, fromTime2]);

  const handleSelectionChange = (event: SelectChangeEvent) => {
    setSelectionFilter(event.target.value as string);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as string);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const selectableIds = filteredData
        .filter((b: any) => b.status !== 'DELETED' && b.status !== 'CANCELLED')
        .map((b: any) => b._id || b.id);
      setSelectedBets(selectableIds);
    } else {
      setSelectedBets([]);
    }
  };

  const handleSelectBet = (betId: string) => {
    if (selectedBets.includes(betId)) {
      setSelectedBets(selectedBets.filter((idVal) => idVal !== betId));
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

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`UnDeclared Casino - ${gameTitle}`}
        links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Casino', href: '/sport/casino' }, { name: gameTitle }]}
        sx={{ mb: { xs: 2, md: 4 } }}
      />

      {/* Filter Section */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2}>
            {/* Selection Select */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Option / Team</InputLabel>
                <Select value={selectionFilter} label="Select Option / Team" onChange={handleSelectionChange}>
                  <MenuItem value="">
                    <em>All Options</em>
                  </MenuItem>
                  {availableSelections.map((sel) => (
                    <MenuItem key={sel} value={sel}>
                      {sel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Select */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Bet Status</InputLabel>
                <Select value={statusFilter} label="Bet Status" onChange={handleStatusChange}>
                  <MenuItem value="">
                    <em>Unsettled Bets (Pending)</em>
                  </MenuItem>
                  <MenuItem value="PENDING">Pending Bet</MenuItem>
                  <MenuItem value="DELETED">Deleted Bet</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date / Time Filters */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="From Date"
                value={fromDate1}
                onChange={(newValue) => setFromDate1(newValue)}
                format="DD/MM/YY"
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TimePicker
                format="HH:mm:ss"
                label="From Time"
                views={['hours', 'minutes', 'seconds']}
                value={fromTime1}
                onChange={(newValue) => setFromTime1(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="To Date"
                value={fromDate2}
                onChange={(newValue) => setFromDate2(newValue)}
                format="DD/MM/YY"
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TimePicker
                label="To Time"
                value={fromTime2}
                onChange={(newValue) => setFromTime2(newValue)}
                views={['hours', 'minutes', 'seconds']}
                format="HH:mm:ss"
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {/* Table Section */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Bets List ({filteredData.length})
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<Iconify icon="eva:trash-2-outline" />}
            onClick={() => setDeleteAllModalOpen(true)}
            disabled={selectedBets.length === 0 || deleteMultipleBetsMutation.isPending}
          >
            {deleteMultipleBetsMutation.isPending ? 'Deleting...' : `Delete Selected (${selectedBets.length})`}
          </Button>
        </Box>

        <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedBets.length > 0 &&
                      selectedBets.length <
                        filteredData.filter((b: any) => b.status !== 'DELETED' && b.status !== 'CANCELLED').length
                    }
                    checked={
                      filteredData.filter((b: any) => b.status !== 'DELETED' && b.status !== 'CANCELLED').length > 0 &&
                      selectedBets.length ===
                        filteredData.filter((b: any) => b.status !== 'DELETED' && b.status !== 'CANCELLED').length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Round ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Selection</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {betsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    Loading casino bets...
                  </TableCell>
                </TableRow>
              ) : betsError ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'error.main' }}>
                    Error loading casino bets
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((row: any) => {
                  const betId = row._id || row.id;
                  const isDeleted = row.status === 'DELETED' || row.status === 'CANCELLED';

                  return (
                    <TableRow key={betId} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedBets.includes(betId)}
                          onChange={() => handleSelectBet(betId)}
                          disabled={isDeleted}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {row.client || row.userName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {row.round_id || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {row.selection || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{Number(row.rate || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>₹{Number(row.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{dayjs(row.createdAt).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                      <TableCell>
                        {isDeleted ? (
                          <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>Deleted</span>
                        ) : row.status === 'PENDING' ? (
                          <span style={{ color: '#ed6c02', fontWeight: 'bold' }}>Pending</span>
                        ) : row.status === 'SETTLED' ? (
                          <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Settled</span>
                        ) : (
                          row.status
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {isDeleted ? (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            Already Deleted
                          </Typography>
                        ) : (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<Iconify icon="eva:trash-2-outline" />}
                            onClick={() => {
                              setSelectedBets([betId]);
                              setDeleteModalOpen(true);
                            }}
                            disabled={deleteBetMutation.isPending}
                          >
                            {deleteBetMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No Data Found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Confirmation Modal for Single Bet */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Casino Bet</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this casino bet? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)} disabled={deleteBetMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteBet(selectedBets[0])}
            color="error"
            variant="contained"
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
        aria-labelledby="alert-dialog-title-multi"
        aria-describedby="alert-dialog-description-multi"
      >
        <DialogTitle id="alert-dialog-title-multi">Delete Selected Casino Bets</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description-multi">
            Are you sure you want to delete {selectedBets.length} selected casino bets? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllModalOpen(false)} disabled={deleteMultipleBetsMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSelected}
            color="error"
            variant="contained"
            disabled={deleteMultipleBetsMutation.isPending}
            autoFocus
          >
            {deleteMultipleBetsMutation.isPending ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
