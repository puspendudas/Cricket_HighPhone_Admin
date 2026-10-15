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
  Switch,
  FormControlLabel,
} from '@mui/material';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

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
          Are you sure you want to <Box component="span" sx={{ fontWeight: 'bold' }}>Rollback</Box> this session?
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

// Cancel Session Confirm Modal Component
interface CancelSessionConfirmModalProps {
  open: boolean;
  sessionName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function CancelSessionConfirmModal({ open, sessionName, onClose, onConfirm, loading }: CancelSessionConfirmModalProps) {
  return (
    <Dialog open={open} onClose={() => (loading ? null : onClose())} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", color: "error.main" }}>Confirm Cancel Session</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to <Box component="span" sx={{ fontWeight: 'bold' }}>Cancel</Box> this session?
        </Typography>
        {sessionName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Session: <Box component="span" sx={{ fontWeight: 'bold' }}>{sessionName}</Box>
          </Typography>
        )}
        <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>
          Warning: This action will void/cancel all bets placed on this session.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ display: "flex", justifyContent: "flex-end", gap: 2, p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ bgcolor: "#F32D2D33", color: "#F32D2D", px: 3 }}
          disabled={loading}
        >
          No, Go Back
        </Button>
        <Button
          onClick={onConfirm}
          sx={{ bgcolor: "#F32D2D", color: "#FFFFFF", px: 3, '&:hover': { bgcolor: '#d32f2f' } }}
          disabled={loading}
        >
          {loading ? 'Cancelling...' : 'Yes, Cancel Session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SessionUpdate() {
  const { user } = useAuthContext();
  const isPowerUser = user?.type === 'power_user';
  const canRollbackSession = !isPowerUser || Boolean(user?.permissions?.rollback_session);
  const canCancelSession = !isPowerUser || Boolean(user?.permissions?.cancel_session);

  const queryClient = useQueryClient();
  const { FatchUpdateMatch, updateStatusSession, DeclarefancyMatch, CancelfancyMatch, fancyRollBack, updateStatusMInMax, AutoDeclareRun, toggleToss, DeclareTossMatch, tossRollBack } = useMatchApi();
  const { id } = useParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [declareSession, setDeclareSession] = useState('');
  const [redeclareSession, setRedeclareSession] = useState('');
  const [matchId, setMatchId] = useState('');
  const [declareScore, setDeclareScore] = useState('');
  const [redeclareScore, setRedeclareScore] = useState('');
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [cancelSessionModalOpen, setCancelSessionModalOpen] = useState(false);
  const [selectedSessionForRollback, setSelectedSessionForRollback] = useState<any>(null);
  const [rowMinMax, setRowMinMax] = useState<Record<string, { min: number; max: number }>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTossWinner, setSelectedTossWinner] = useState('');

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
    isAuto?: boolean;
    isRollbacked?: boolean;
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
  const autoDeclareMutation = useMutation({
    mutationFn: (idParam: string) => AutoDeclareRun(idParam),
    onSuccess: () => {
      toast.success("Auto declare run executed successfully");
      queryClient.invalidateQueries({ queryKey: ['match', id] });
    },
    onError: (errors: any) => {
      console.error("AutoDeclareRun failed:", errors);
      toast.error("Failed to auto declare run");
    }
  });

  const toggleTossMutation = useMutation({
    mutationFn: (matchIdParam: string) => toggleToss(matchIdParam),
    onSuccess: (res: any) => {
      const newStatus = res?.data?.match?.isTossActive ?? res?.match?.isTossActive;
      if (newStatus !== undefined) {
        queryClient.setQueryData(['match', id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            isTossActive: newStatus,
            fancyOdds: (old.fancyOdds || []).map((f: any) => {
              if (String(f.sid) === '2501' || String(f.sid) === '2502') {
                return { ...f, isActive: newStatus, isEnabled: newStatus };
              }
              return f;
            })
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      toast.success(newStatus === false ? 'TOSS Inactive' : 'TOSS Active');
    },
    onError: (err: any) => {
      console.error('Toggle toss failed:', err);
      toast.error('Failed to toggle toss status');
    }
  });

  const declareTossMutation = useMutation({
    mutationFn: ({ matchId: targetMatchId, payload }: { matchId: string; payload: any }) =>
      DeclareTossMatch(targetMatchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      setSelectedTossWinner('');
      toast.success('Toss declared successfully');
    },
    onError: (declareError: any) => {
      console.error('Declare toss failed:', declareError);
      const errorMessage = declareError?.response?.data?.message || 'Failed to declare toss';
      toast.error(errorMessage);
    }
  });

  const rollbackTossMutation = useMutation({
    mutationFn: (targetMatchId: string) => tossRollBack(targetMatchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      toast.success('Toss rolled back successfully');
    },
    onError: (err: any) => {
      console.error('Rollback toss failed:', err);
      const errMsg = err?.response?.data?.message || 'Failed to rollback toss';
      toast.error(errMsg);
    }
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
        // Exclude Toss sessions (SIDs 2501 and 2502) from run sessions
        const sidStr = String(item.sid);
        if (sidStr === '2501' || sidStr === '2502') {
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
        isAuto: item.isAuto,
        isRollbacked: item.isRollbacked,
        resultScore: item.resultScore,
        nonDeletedBetCount: item.nonDeletedBetCount || 0
      }));
  }, [matchData, matchId]);

  // Extract Toss sessions (SIDs 2501 & 2502)
  const tossSessions = useMemo(
    () =>
      (matchData?.fancyOdds || []).filter(
        (item: any) => String(item.sid) === '2501' || String(item.sid) === '2502'
      ),
    [matchData]
  );

  const isTossActive = useMemo(() => {
    if (matchData?.isTossActive !== undefined) {
      return matchData.isTossActive;
    }
    if (matchData?.match?.isTossActive !== undefined) {
      return matchData.match.isTossActive;
    }
    if (tossSessions.length > 0) {
      return tossSessions.some((s: any) => s.isActive !== false && s.isEnabled !== false);
    }
    return true;
  }, [matchData, tossSessions]);

  const isTossDeclared = useMemo(() => tossSessions.some((s: any) => s.isDeclared), [tossSessions]);

  const tossDeclaredWinnerName = useMemo(
    () => tossSessions.find((s: any) => s.isDeclared && String(s.resultScore) === '1')?.rname || (isTossDeclared ? 'Declared' : ''),
    [tossSessions, isTossDeclared]
  );


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

  console.log("fancySessions", fancySessions);

  // Filter sessions
  // const allowedMarkets = ["Normal", "Over By Over", "Ball By Ball"];

  // useEffect(() => {
  //   const filtered = fancySessions.filter(
  //     (session: FancyRow) =>
  //       allowedMarkets.includes(session.market || '') &&
  //       !session.isDeclared
  //   );
  //   setFilteredSessions(filtered);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [fancySessions]);

  useEffect(() => {
    const declaredOnly = fancySessions.filter(
      (session: FancyRow) => session.isDeclared === false
    );
    setFilteredSessions(declaredOnly);
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
      toast.success('Session cancelled successfully');
      setCancelSessionModalOpen(false);
      setDeclareSession('');
      setDeclareScore('');
    },
    onError: (cancelError: any) => {
      console.error('Cancel failed:', cancelError);
      const errMsg = cancelError?.response?.data?.message || cancelError?.message || 'Failed to cancel session';
      toast.error(errMsg);
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

  const handleOpenCancelSessionModal = () => {
    if (!canCancelSession) {
      toast.error('You do not have permission to cancel sessions');
      return;
    }
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

    setCancelSessionModalOpen(true);
  };

  const handleConfirmCancelSession = () => {
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
    if (!canRollbackSession) {
      toast.error('You do not have permission to rollback sessions');
      return;
    }
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

  const handleRefreshSessions = () => {
    if (!id) return;

    autoDeclareMutation.mutate(id);
  };
  return (
    <Box p={1}>
      {/* TOSS Management Card */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: isTossActive ? 'primary.light' : 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Toss Management
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isTossActive}
                    onChange={() => id && toggleTossMutation.mutate(id)}
                    disabled={toggleTossMutation.isPending}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isTossActive ? 'success.main' : 'text.secondary' }}>
                    {isTossActive ? 'TOSS Active' : 'TOSS Inactive'}
                  </Typography>
                }
              />
            </Box>

            {isTossDeclared && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: '#e8f5e9', px: 1.5, py: 0.5, borderRadius: 1, border: '1px solid #a5d6a7' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#2e7d32' }}>
                  STATUS: DECLARED ({tossDeclaredWinnerName || 'Settled'})
                </Typography>
              </Box>
            )}
          </Box>

          <Grid container spacing={2} alignItems="center">
            {isTossDeclared ? (
              <>
                <Grid item xs={12} md={8}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Toss has been declared. Winner:{' '}
                    <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {tossDeclaredWinnerName}
                    </Box>
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} textAlign="right">
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: '#1E90FF' }}
                    onClick={() => id && rollbackTossMutation.mutate(id)}
                    disabled={rollbackTossMutation.isPending || !canRollbackSession}
                  >
                    {rollbackTossMutation.isPending ? <CircularProgress size={20} /> : 'Rollback Toss'}
                  </Button>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={tossSessions}
                    getOptionLabel={(option: any) => option.rname || `SID ${option.sid}`}
                    value={tossSessions.find((s: any) => String(s.sid) === String(selectedTossWinner)) || null}
                    onChange={(_, newValue) => setSelectedTossWinner(newValue ? String(newValue.sid) : '')}
                    renderInput={(params) => <TextField {...params} label="Select Winning Team for Toss" placeholder="Choose Winner" />}
                    isOptionEqualToValue={(option: any, value: any) => String(option.sid) === String(value.sid)}
                  />
                </Grid>
                <Grid item xs={12} md={6} textAlign="right">
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!selectedTossWinner || declareTossMutation.isPending}
                    onClick={() => {
                      if (!id || !selectedTossWinner) return;
                      const selectedObj = tossSessions.find((s: any) => String(s.sid) === String(selectedTossWinner));
                      declareTossMutation.mutate({
                        matchId: id,
                        payload: {
                          sid: Number(selectedTossWinner),
                          winnerId: 1,
                          fancyId: selectedObj?._id,
                        }
                      });
                    }}
                  >
                    {declareTossMutation.isPending ? <CircularProgress size={20} /> : 'Declare Toss Winner'}
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Declare Session */}
      <Card sx={{ mb: 3 }}>
        <CardContent>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'initial', mb: 2 }}>

            {/* Left Side Text */}
            <Typography variant="h6" >
              Declare Session
            </Typography>

            {/* Right Side Controls */}
            <Box sx={{ display: 'flex', alignItems: 'right', gap: 8, ml: '72px' }}>

              {/* Refresh Icon Button */}
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleRefreshSessions}
                startIcon={
                  autoDeclareMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Iconify icon="mdi:refresh" width={20} />
                  )
                }
              >
                Refresh
              </Button>


              {/* Toggle Switch */}

            </Box>

          </Box>
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

                      {(option.isRollbacked || option.isAuto === false) && (
                        <Box
                          component="span"
                          sx={{
                            ml: 1,
                            px: 0.8,
                            py: 0.2,
                            borderRadius: '4px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            border: '1px solid #ef9a9a'
                          }}
                        >
                          Rolled Back (Manual)
                        </Box>
                      )}

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
                onClick={handleOpenCancelSessionModal}
                disabled={cancelFancyMutation.isPending || !canCancelSession}
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
                disabled={rollbackMutation.isPending || !canRollbackSession}
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
                  <TableCell>SID</TableCell>
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
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{row.sessionName}</span>
                          {(row.isRollbacked || row.isAuto === false) && !row.isDeclared && (
                            <Box
                              component="span"
                              sx={{
                                px: 0.6,
                                py: 0.1,
                                borderRadius: '4px',
                                backgroundColor: '#ffebee',
                                color: '#c62828',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                border: '1px solid #ef9a9a'
                              }}
                            >
                              Manual Only
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{row.sid}</TableCell>
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

      {/* Cancel Session Confirm Modal */}
      <CancelSessionConfirmModal
        open={cancelSessionModalOpen}
        sessionName={declareSession}
        onClose={() => setCancelSessionModalOpen(false)}
        onConfirm={handleConfirmCancelSession}
        loading={cancelFancyMutation.isPending}
      />
    </Box>
  );
}