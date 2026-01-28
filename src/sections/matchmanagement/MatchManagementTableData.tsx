import type { Dayjs } from 'dayjs';
import type { Match } from 'src/Interface/matchManagement.interface';

import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Menu,
  Table,
  Button,
  Dialog,
  MenuItem,
  TableRow,
  Checkbox,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  TableContainer,
  TableSortLabel,
  TablePagination,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import StatusModal from './StatusModal';
import win from '../../../public/assets/win.png';
import { RollbackConfirmModal } from './RollbackConfirmModal';

export function MatchManagementTableData() {
  const { fetchAllMatchs, updateTogalStatus, matchRollback } = useMatchApi();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedTime, setSelectedTime] = useState<Dayjs>(dayjs());
  const [matches, setMatches] = useState<Match[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const navigate = useNavigate();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const fetchMatches = async () => {
    try {
      const response = await fetchAllMatchs();
      setMatches(response.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to fetch matches.');
    }
  };

  const fetchNewData = async () => {
    try {
      const response = await fetchAllMatchs();
      setMatches(response.matches || []);
      toast.success('Matches fetched successfully!');
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to fetch matches.');
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(() => {
      fetchMatches();
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rollback functionality
  const handleRollbackClick = (match: Match) => {
    setSelectedMatch(match);
    setRollbackOpen(true);
  };

  const handleRollbackConfirm = async () => {
    if (selectedMatch?._id) {
      console.log("Rollback confirmed for match:", selectedMatch._id);

      const response = await matchRollback(selectedMatch._id);

      if (response) {
        fetchMatches(); // Refresh the data
      } else {
        toast.error('Rollback failed!');
      }
    }
    setRollbackOpen(false);
    setSelectedMatch(null);
  };

  // Derived: current page rows
  const paginatedRows = useMemo(
    () => matches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [matches, page, rowsPerPage]
  );

  // Derived: checkbox states
  const allVisibleChecked = useMemo(() => {
    if (paginatedRows.length === 0) return false;
    return paginatedRows.every((r) => selectedIds.has(r._id));
  }, [paginatedRows, selectedIds]);

  const someVisibleChecked = useMemo(
    () => paginatedRows.some((r) => selectedIds.has(r._id)),
    [paginatedRows, selectedIds]
  );

  // Reset selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, gameId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedGameId(gameId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGameId(null);
  };

  const handleNavigation = (path: string) => {
    const selectedMatchs = matches.find((m) => m.gameId === selectedGameId);

    if (selectedMatchs && !selectedMatchs.status) {
      toast.error('Inactive match! Action not allowed.');
      handleMenuClose();
      return;
    }

    navigate(path, {
      state: {
        matchName: selectedMatch?.eventName || 'N/A',
      },
    });

    handleMenuClose();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSortRequest = () => {
    setOrder(order === 'asc' ? 'desc' : 'asc');
  };

  const handleStatusClick = (match: Match) => {
    setSelectedMatchId(match._id);
    const dt = dayjs(match.eventTime);
    setSelectedDate(dt);
    setSelectedTime(dt);
    setStatusModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (selectedMatchId) {
      await updateTogalStatus(selectedMatchId);
    }
    setStatusModalOpen(false);
    fetchMatches();
  };

  const handleToggleRowSelect = (matchId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (checked) n.add(matchId);
      else n.delete(matchId);
      return n;
    });
  };

  const handleToggleSelectPage = (checked: boolean) => {
    if (checked) {
      const add = new Set(selectedIds);
      paginatedRows.forEach((r) => add.add(r._id));
      setSelectedIds(add);
    } else {
      const rem = new Set(selectedIds);
      paginatedRows.forEach((r) => rem.delete(r._id));
      setSelectedIds(rem);
    }
  };

  // Decide which rows to act on for bulk
  const targetRowsOnPage = useMemo(() => {
    const checkedRows = paginatedRows.filter((r) => selectedIds.has(r._id));
    return checkedRows.length > 0 ? checkedRows : paginatedRows;
  }, [paginatedRows, selectedIds]);

  const bulkSetStatusForCurrentPage = async (targetStatus: boolean) => {
    setBulkLoading(true);

    // Save previous state for revert
    const prevState = matches;

    // Optimistic update
    setMatches((prev) =>
      prev.map((match) => {
        const isTarget = targetRowsOnPage.some((t) => t._id === match._id);
        if (isTarget) {
          return { ...match, status: targetStatus };
        }
        return match;
      })
    );

    try {
      const rowsNeedingUpdate = targetRowsOnPage.filter(row => row.status !== targetStatus);
      await Promise.all(rowsNeedingUpdate.map((match) => updateTogalStatus(match._id)));
      setStatusDialogOpen(false);
    } catch (err) {
      console.error(err);
      setMatches(prevState);
    } finally {
      setBulkLoading(false);
      setSelectedIds(new Set());
    }
  };

  const filteredMatches = useMemo(() => {
    const term = searchTerm.toLowerCase();

    // Step 1: Search filter
    let data = matches.filter(
      (match) =>
        match.eventName.toLowerCase().includes(term) ||
        match.gameId.toLowerCase().includes(term)
    );

    // Step 2: Sorting by date
    data = data.sort((a, b) => {
      const dateA = new Date(a.eventTime).getTime();
      const dateB = new Date(b.eventTime).getTime();

      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return data;
  }, [matches, searchTerm, order]);


  return (
    <Box >
      <Card>
        <CardContent>
          <Grid container direction="column" spacing={1} mb={2}>
            {/* Title */}
            <Grid item>
              <Typography variant="h6" fontWeight={600}>
                Sport Details
              </Typography>
            </Grid>

            <Grid item>
              <Box display="flex" flexDirection="row" gap={1} flexWrap="wrap">
                <Button variant="outlined" color="primary" onClick={fetchNewData}>
                  Fetch New Data
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setStatusDialogOpen(true)}
                  disabled={paginatedRows.length === 0}
                >
                  Change Status
                </Button>
              </Box>
            </Grid>

            <Grid item>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

          </Grid>


          {/* Checkbox selection header */}
          <Box mb={1} display="flex" alignItems="center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={allVisibleChecked}
                  indeterminate={!allVisibleChecked && someVisibleChecked}
                  onChange={(e) => handleToggleSelectPage(e.target.checked)}
                />
              }
              label="Select Page"
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f9fafb' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allVisibleChecked}
                      indeterminate={!allVisibleChecked && someVisibleChecked}
                      onChange={(e) => handleToggleSelectPage(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>#</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell sortDirection={order}>
                    <TableSortLabel
                      active
                      direction={order}
                      onClick={handleSortRequest}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Declared</TableCell>
                  <TableCell>Won By</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMatches
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item, index) => {
                    const dateTime = new Date(item.eventTime);
                    const date = dateTime.toLocaleDateString();
                    const time = dateTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <TableRow key={item._id}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.has(item._id)}
                            onChange={(e) => handleToggleRowSelect(item._id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>{item.gameId}</TableCell>
                        <TableCell>{item.eventName}</TableCell>
                        <TableCell>{date}</TableCell>
                        <TableCell>{time}</TableCell>
                        <TableCell>
                          {item.declared ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {item.declared ? (
                            item.wonby ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                <img
                                  src={win}
                                  alt="Won"
                                  style={{ width: 30, height: 30 }}
                                />
                                <Typography variant="body2" fontWeight={600}>
                                  {item.wonby}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography color="error" fontWeight={600}>
                                Cancel Match
                              </Typography>
                            )
                          ) : (
                            "--"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={item.declared}
                            sx={{
                              backgroundColor: item.declared
                                ? '#9e9e9e'
                                : item.status
                                  ? '#4caf50'
                                  : '#f44336',
                              color: '#fff',
                              cursor: item.declared ? 'not-allowed' : 'pointer',
                              '&:hover': {
                                backgroundColor: item.declared
                                  ? '#9e9e9e'
                                  : item.status
                                    ? '#388e3c'
                                    : '#d32f2f',
                              },
                            }}
                            onClick={() => {
                              if (!item.declared) {
                                handleStatusClick(item);
                              }
                            }}
                          >
                            {item.status ? 'Active' : 'Inactive'}
                          </Button>

                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={(e) =>
                              handleMenuOpen(e, item.gameId)
                            }
                          >
                            <Iconify icon="mdi:dots-vertical" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={matches.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() =>
                handleNavigation(`/match-manuall-update/${selectedGameId}`)
              }
            >
              <Iconify icon="mdi:refresh" sx={{ mr: 1 }} />
              Match Manually Update
            </MenuItem>

            <MenuItem
              onClick={() =>
                handleNavigation(`/session-update/${selectedGameId}`)
              }
            >
              <Iconify icon="mdi:update" sx={{ mr: 1 }} />
              Session Manually Update
            </MenuItem>

            <MenuItem
              onClick={() => {
                const match = matches.find(m => m.gameId === selectedGameId);
                if (match) {
                  handleRollbackClick(match);
                }
                handleMenuClose();
              }}
            >
              <Iconify icon="material-symbols:camera-roll-outline-rounded" sx={{ mr: 1 }} />
              Rollback
            </MenuItem>

            {/* <MenuItem onClick={handleMenuClose}>
              <Iconify icon="mdi:television" sx={{ mr: 1 }} />
              Fetch LiveTV Key
            </MenuItem> */}
          </Menu>

          <StatusModal
            open={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            onConfirm={handleStatusConfirm}
            date={selectedDate}
            time={selectedTime}
          />

          {/* Bulk Status Dialog */}
          <Dialog open={statusDialogOpen} onClose={() => !bulkLoading && setStatusDialogOpen(false)} fullWidth maxWidth="xs">
            <DialogTitle>Change Status (Current Page Only)</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Action applies to:
              </Typography>
              <ul style={{ marginTop: 0 }}>
                <li>
                  {selectedIds.size > 0
                    ? `Selected rows on this page (${selectedIds.size})`
                    : `All rows on this page (${paginatedRows.length})`}
                </li>
              </ul>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
              <Button
                variant="contained"
                color="success"
                disabled={bulkLoading}
                onClick={() => bulkSetStatusForCurrentPage(true)}
                startIcon={bulkLoading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                Active All
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={bulkLoading}
                onClick={() => bulkSetStatusForCurrentPage(false)}
                startIcon={bulkLoading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                Inactive All
              </Button>
              <Button onClick={() => setStatusDialogOpen(false)} disabled={bulkLoading}>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Rollback Confirmation Modal */}
          <RollbackConfirmModal
            open={rollbackOpen}
            onClose={() => setRollbackOpen(false)}
            onConfirm={handleRollbackConfirm}
          />
        </CardContent>
      </Card>
    </Box>
  );
}