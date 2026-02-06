import { useParams } from 'react-router-dom';
import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Box,
  Card,
  Grid,
  Table,
  Paper,
  Button,
  Dialog,
  TableRow,
  Checkbox,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  Pagination,
  CardContent,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
  FormControlLabel
} from '@mui/material';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// Rollback Confirm Modal Component
interface RollbackConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function RollbackConfirmModal({ open, onClose, onConfirm }: RollbackConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Confirm Rollback</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to <strong>Rollback</strong> this session?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ display: "flex", justifyContent: "flex-end", gap: 2, p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ bgcolor: "#F32D2D33", color: "#F32D2D", px: 3 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          sx={{ bgcolor: "#0ED98D33", color: "#1E9C6D", px: 3 }}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SessionUpdate() {
  const queryClient = useQueryClient();
  const { FatchUpdateMatch, updateStatusSession, DeclarefancyMatch, CancelfancyMatch, fancyRollBack, updateStatusMInMax } = useMatchApi();
  const { id } = useParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [declareSession, setDeclareSession] = useState('');
  const [redeclareSession, setRedeclareSession] = useState('');
  const [matchId, setMatchId] = useState('');
  const [declareScore, setDeclareScore] = useState('');
  const [redeclareScore, setRedeclareScore] = useState('');
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [selectedSessionForRollback, setSelectedSessionForRollback] = useState<any>(null);
  const [rowMinMax, setRowMinMax] = useState<Record<string, { min: number; max: number }>>({});
  const [isEditing, setIsEditing] = useState(false);

  type FancyRow = {
    matchId: string;
    isActive: boolean | unknown;
    id: string;
    sessionName: string;
    status?: 'Active' | 'Inactive';
    min?: number;
    max?: number;
    gameId?: string;
    sid?: string;
    market?: string;
    isDeclared?: boolean;
    resultScore?: string;
  };

  const [filteredSessions, setFilteredSessions] = useState<FancyRow[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog and feedback state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());




  const updateMinMaxMutation = useMutation({
    mutationFn: (payload: { id: string; min: number; max: number }) => updateStatusMInMax(payload),
    onSuccess: () => {
      toast.success("Updated successfully");
      queryClient.invalidateQueries({ queryKey: ['match', id] });
    },
    onError: () => {
      toast.error("Failed to update min/max");
    }
  });

  // TanStack Query for fetching match data
  const { data: matchData, isLoading, error } = useQuery({
    queryKey: ['match', id],
    queryFn: () => FatchUpdateMatch(id!),
    enabled: !!id && !isEditing,
    refetchInterval: 1000,

  });

  // Process fancy sessions data
  const fancySessions = useMemo(() => {
    const fancyOdds = matchData?.fancyOdds || [];

    if (fancyOdds.length > 0 && !matchId) {
      setMatchId(fancyOdds[0].matchId);
    }

    return fancyOdds
      .filter((item: any) => {
        if (item.isEnabled === false && item.isFancyEnded === true) {
          return false;
        }
        return true;
      })
      .map((item: any) => ({
        id: item._id,
        matchId: item.matchId,
        sessionName: item.rname,
        status: item.isActive ? 'Active' : 'Inactive',
        min: item.min,
        max: item.max,
        gameId: item.gameId,
        sid: item.sid,
        isActive: item.isActive,
        market: item.market,
        isDeclared: item.isDeclared,
        resultScore: item.resultScore,
        nonDeletedBetCount: item.nonDeletedBetCount || 0
      }));
  }, [matchData, matchId]);


  useEffect(() => {
    const initial: any = {};
    fancySessions.forEach((row: any) => {
      initial[row.id] = {
        min: row.min || 100,
        max: row.max || 25000
      };
    });
    setRowMinMax(initial);
  }, [fancySessions]);

  // Filter sessions
  const allowedMarkets = ["Normal", "Over By Over", "Ball By Ball"];

  useEffect(() => {
    const filtered = fancySessions.filter(
      (session: FancyRow) =>
        allowedMarkets.includes(session.market || '') &&
        !session.isDeclared
    );
    setFilteredSessions(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fancySessions]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ gameId, sid }: { gameId: string; sid: string }) =>
      updateStatusSession(gameId, sid),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['match', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          fancyOdds: old.fancyOdds.map((item: any) =>
            item.gameId === variables.gameId && item.sid === variables.sid
              ? { ...item, isActive: !item.isActive, status: item.isActive ? 'Inactive' : 'Active' }
              : item
          )
        };
      });
    },
    onError: (statusError) => {
      console.error('Status update failed:', statusError);
      toast.error('Failed to update status');
    }
  });

  const declareFancyMutation = useMutation({
    mutationFn: ({ matchId: declareMatchId, payload }: { matchId: string; payload: any }) =>
      DeclarefancyMatch(declareMatchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      setDeclareSession('');
      setDeclareScore('');
      toast.success('Session declared successfully');
    },
    onError: (declareError: any) => {
      console.error('Declare failed:', declareError);
      const errorMessage = declareError?.response?.data?.message || 'Failed to declare session';
      toast.error(errorMessage);
    }
  });

  const cancelFancyMutation = useMutation({
    mutationFn: ({ matchId: cancelMatchId, payload }: { matchId: string; payload: any }) =>
      CancelfancyMatch(cancelMatchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      toast.success('Match cancelled successfully');
    },
    onError: (cancelError: any) => {
      console.error('Cancel failed:', cancelError);
      toast.error('Failed to cancel match');
    }
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ matchId: rollbackMatchId, payload }: { matchId: string; payload: any }) =>
      fancyRollBack(rollbackMatchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      setRedeclareSession('');
      setRedeclareScore('');
    },
    onError: (rollbackError: any) => {
      console.error('Rollback failed:', rollbackError);
      const errorMessage = rollbackError?.response?.data?.message || 'Failed to rollback session';
      toast.error(errorMessage);
    }
  });

  const paginatedRows = useMemo(
    () => filteredSessions.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filteredSessions, page]
  );

  const allVisibleChecked = useMemo(() => {
    if (paginatedRows.length === 0) return false;
    return paginatedRows.every((r) => selectedIds.has(r.id));
  }, [paginatedRows, selectedIds]);

  const someVisibleChecked = useMemo(
    () => paginatedRows.some((r) => selectedIds.has(r.id)),
    [paginatedRows, selectedIds]
  );

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleToggleRowSelect = (rowId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (checked) n.add(rowId);
      else n.delete(rowId);
      return n;
    });
  };

  const handleToggleSelectPage = (checked: boolean) => {
    if (checked) {
      const add = new Set(selectedIds);
      paginatedRows.forEach((r) => add.add(r.id));
      setSelectedIds(add);
    } else {
      const rem = new Set(selectedIds);
      paginatedRows.forEach((r) => rem.delete(r.id));
      setSelectedIds(rem);
    }
  };

  const handleStatusUpdate = async (gameId: string, sid: string) => {
    updateStatusMutation.mutate({ gameId, sid });
  };

  const targetRowsOnPage = useMemo(() => {
    const checkedRows = paginatedRows.filter((r) => selectedIds.has(r.id));
    return checkedRows.length > 0 ? checkedRows : paginatedRows;
  }, [paginatedRows, selectedIds]);

  const bulkSetStatusForCurrentPage = async (targetStatus: 'Active' | 'Inactive') => {
    setBulkLoading(true);

    const rowsNeedingChange = targetRowsOnPage.filter(
      (row) => row.status !== targetStatus && row.gameId && row.sid
    );

    if (rowsNeedingChange.length === 0) {
      setBulkLoading(false);
      setStatusDialogOpen(false);
      return;
    }

    try {
      await Promise.all(
        rowsNeedingChange.map((row) =>
          updateStatusMutation.mutateAsync({
            gameId: row.gameId as string,
            sid: row.sid as string
          })
        )
      );
      setStatusDialogOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeclareFancy = async () => {
    const selectedSession = fancySessions.find(
      (row: FancyRow) => row.sessionName === declareSession && !row.isDeclared
    );

    if (!selectedSession) {
      toast.error('Please select a valid session to declare');
      return;
    }

    const payload = {
      isWon: true,
      fancyId: selectedSession.id,
      sid: selectedSession.sid,
      run: Number(declareScore)
    };

    declareFancyMutation.mutate({
      matchId: selectedSession.matchId as string,
      payload
    });
  };

  const filteredSessionBySearch = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return filteredSessions.filter(session =>
      session.sessionName.toLowerCase().includes(term)
    );
  }, [filteredSessions, searchTerm]);

  const paginatedSearchRows = useMemo(
    () => filteredSessionBySearch.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filteredSessionBySearch, page]
  );

  const handleCancelMatch = async () => {
    if (!matchId) {
      toast.error("Match ID not found!");
      return;
    }

    const selectedSession = fancySessions.find(
      (row: FancyRow) => row.sessionName === declareSession && !row.isDeclared
    );

    if (!selectedSession) {
      toast.error("Please select a session to cancel");
      return;
    }

    const payload = {
      fancyId: selectedSession.id,
      sid: selectedSession.sid,
    };

    cancelFancyMutation.mutate({ matchId, payload });
  };

  const handleRollbackClick = () => {
    const selectedSession = fancySessions.find(
      (row: FancyRow) => row.sessionName === redeclareSession && row.isDeclared
    );

    if (!selectedSession) {
      toast.error("Please select a declared session to rollback");
      return;
    }

    setSelectedSessionForRollback(selectedSession);
    setRollbackOpen(true);
  };

  const handleRollbackConfirm = async () => {
    if (!selectedSessionForRollback) return;

    const payload = {
      fancyId: selectedSessionForRollback.id,
      sid: selectedSessionForRollback.sid
    };

    rollbackMutation.mutate({
      matchId: selectedSessionForRollback.matchId,
      payload
    });

    setRollbackOpen(false);
    setSelectedSessionForRollback(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">Error loading match data</Typography>
      </Box>
    );
  }
  const handleFetchNewSession = () => {
    queryClient.invalidateQueries({ queryKey: ['match', id] });
  };

  return (
    <Box p={1}>
      {/* Declare Session */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Declare Session
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={fancySessions.filter((row: FancyRow) => row.isActive && !row.isDeclared)}
                getOptionLabel={(option) => option.sessionName || ''}
                value={
                  fancySessions.find((row: FancyRow) => row.sessionName === declareSession) || null
                }
                onChange={(_, newValue) => setDeclareSession(newValue?.sessionName ?? '')}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography
                        component="span"
                        sx={{ fontWeight: option.nonDeletedBetCount >= 1 ? 700 : 0 }}
                        style={{ fontWeight: option.nonDeletedBetCount >= 1 ? 700 : 0 }}
                      >
                        {option.sessionName}
                      </Typography>

                      {option.nonDeletedBetCount >= 1 && (
                        <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                          <Iconify icon="line-md:hazard-lights-loop" style={{ color: '#ff9800', marginLeft: 6 }} />
                        </Box>
                      )}
                    </Box>
                  </li>
                )}

                renderInput={(params) => <TextField {...params} label="Select Session" placeholder="Session" />}
                isOptionEqualToValue={(option, value) => option.sessionName === value.sessionName}
              />
            </Grid>


            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="declareScore"
                value={declareScore}
                onChange={(e) => setDeclareScore(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6} textAlign="right">
              <Button
                variant="contained"
                color="error"
                sx={{ mr: 2 }}
                onClick={handleCancelMatch}
                disabled={cancelFancyMutation.isPending}
              >
                {cancelFancyMutation.isPending ? <CircularProgress size={20} /> : 'Cancel Session'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleDeclareFancy}
                disabled={declareFancyMutation.isPending}
              >
                {declareFancyMutation.isPending ? <CircularProgress size={20} /> : 'Declare'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Redeclare Session */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Redeclare Session
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={fancySessions.filter((row: FancyRow) => row.isDeclared)}
                getOptionLabel={(option) => option.sessionName || ''}
                value={
                  fancySessions.find((row: FancyRow) => row.sessionName === redeclareSession) || null
                }
                onChange={(_, newValue) => {
                  setRedeclareSession(newValue?.sessionName ?? '');
                  setRedeclareScore(newValue?.resultScore ?? '');
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Select Session" placeholder="Session" />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.sessionName === value.sessionName
                }
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="declareScore"
                value={redeclareScore}
                onChange={(e) => setRedeclareScore(e.target.value)}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6} textAlign="right">
              <Button
                variant="contained"
                sx={{ backgroundColor: '#1E90FF' }}
                onClick={handleRollbackClick}
                disabled={rollbackMutation.isPending}
              >
                {rollbackMutation.isPending ? <CircularProgress size={20} /> : 'Rollback'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Session Update Table */}
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" mb={2} gap={1}>
            {/* Title */}
            <Typography variant="h6">Session Update</Typography>

            {/* Buttons and Search */}
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }} // Mobile: column, Desktop: row
              alignItems={{ xs: 'stretch', sm: 'center' }}
              gap={1}
            >
              {/* Buttons in one line */}
              <Box display="flex" flexDirection="row" gap={1} flexWrap="wrap">
                <Button variant="contained" onClick={handleFetchNewSession}>
                  Fetch New Session
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setStatusDialogOpen(true)}
                >
                  Change Status
                </Button>
              </Box>

              {/* Search field below buttons on mobile */}
              <TextField
                size="small"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 120 }}
              />
            </Box>
          </Box>


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
            <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              Only current page rows will be affected.
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allVisibleChecked}
                      indeterminate={!allVisibleChecked && someVisibleChecked}
                      onChange={(e) => handleToggleSelectPage(e.target.checked)}
                      inputProps={{ 'aria-label': 'select all on page' }}
                    />
                  </TableCell>
                  <TableCell>#</TableCell>
                  <TableCell>Session Name</TableCell>
                  <TableCell>Min amount</TableCell>
                  <TableCell>Max amount</TableCell>
                  <TableCell>Update</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSearchRows.map((row, index) => {
                  const checked = selectedIds.has(row.id);
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={checked}
                          onChange={(e) =>
                            handleToggleRowSelect(row.id, e.target.checked)
                          }
                          inputProps={{ 'aria-label': `select row ${row.id}` }}
                        />
                      </TableCell>
                      <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{row.sessionName}</TableCell>
                      <TableCell>
                        <TextField
                          onFocus={() => setIsEditing(true)}
                          onBlur={() => setIsEditing(false)}
                          sx={{ width: "80px" }}
                          value={rowMinMax[row.id]?.min || ""}
                          onChange={(e) =>
                            setRowMinMax({
                              ...rowMinMax,
                              [row.id]: { ...rowMinMax[row.id], min: Number(e.target.value) }
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          onFocus={() => setIsEditing(true)}
                          onBlur={() => setIsEditing(false)}
                          sx={{ width: "80px" }}
                          value={rowMinMax[row.id]?.max || ""}
                          onChange={(e) =>
                            setRowMinMax({
                              ...rowMinMax,
                              [row.id]: { ...rowMinMax[row.id], max: Number(e.target.value) }
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => {
                            const payload = {
                              id: row.id,
                              min: rowMinMax[row.id]?.min,
                              max: rowMinMax[row.id]?.max,
                            };

                            updateMinMaxMutation.mutate(payload);
                          }}
                        >
                          {updateMinMaxMutation.isPending ? (
                            <CircularProgress size={20} />
                          ) : (
                            "Save"
                          )}
                        </Button>

                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          onClick={() => {
                            if (row.gameId && row.sid) {
                              handleStatusUpdate(row.gameId, row.sid);
                            } else {
                              console.error('Missing gameId or sid');
                            }
                          }}
                          disabled={updateStatusMutation.isPending}
                          sx={{
                            backgroundColor:
                              row.status === 'Active' ? 'green' : 'red',
                            '&:hover': {
                              backgroundColor:
                                row.status === 'Active' ? '#2e7d32' : '#c62828'
                            }
                          }}
                        >
                          {updateStatusMutation.isPending ? <CircularProgress size={20} /> : row.status}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            display="flex"
            justifyContent="space-between"
            mt={2}
            alignItems="center"
          >
            <Typography variant="body2">
              Showing {(page - 1) * rowsPerPage + 1} to{' '}
              {Math.min(page * rowsPerPage, filteredSessionBySearch.length)} of{' '}
              {filteredSessionBySearch.length} entries
            </Typography>
            <Pagination
              count={Math.ceil(filteredSessionBySearch.length / rowsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Change Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => (bulkLoading ? null : setStatusDialogOpen(false))}
        fullWidth
        maxWidth="xs"
      >
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
            onClick={() => bulkSetStatusForCurrentPage('Active')}
            startIcon={
              bulkLoading ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            Active All
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={bulkLoading}
            onClick={() => bulkSetStatusForCurrentPage('Inactive')}
            startIcon={
              bulkLoading ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            Inactive All
          </Button>
          <Button onClick={() => setStatusDialogOpen(false)} disabled={bulkLoading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollback Confirm Modal */}
      <RollbackConfirmModal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        onConfirm={handleRollbackConfirm}
      />
    </Box>
  );
}