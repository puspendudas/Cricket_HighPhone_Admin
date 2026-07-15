import React, { useState, useEffect } from 'react';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

interface ExposureModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

interface Bet {
  _id: string;
  bet_type: string;
  selection: string;
  stake_amount: number | string;
  potential_winnings: number | string;
  status: string;
  createdAt: string;
  odds_value?: string;
  odds_rate?: string;
  team_name?: string;
  session_name?: string;
  runner_name?: string;
}

interface MatchWithBets {
  _id: string;
  eventName: string;
  eventTime: string;
  matchBets: Bet[];
}

export function ExposureModal({ open, onClose, userId, userName }: ExposureModalProps) {
  const { fetchUndeclaredBets } = useMatchApi();
  const [matches, setMatches] = useState<MatchWithBets[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !userId) return;
      setLoading(true);
      try {
        const response = await fetchUndeclaredBets(userId);
        const fetchedMatches = response?.matches || response?.data?.matches || [];
        setMatches(fetchedMatches);
      } catch (error) {
        console.error('Failed to fetch undeclared bets', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Exposure Details - {userName || 'User'}</DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : matches.length === 0 ? (
          <Typography textAlign="center" color="textSecondary">
            No active exposure or undeclared bets found.
          </Typography>
        ) : (
          matches.map((match: MatchWithBets) => {
            if (!match.matchBets || match.matchBets.length === 0) return null;

            const bookmakerBets = match.matchBets.filter((bet) => bet.bet_type === 'BOOKMAKER');
            const fancyBets = match.matchBets.filter((bet) => bet.bet_type === 'FANCY');

            return (
              <Box key={match._id} mb={4}>
                <Typography variant="h6" gutterBottom color="primary">
                  {match.eventName}
                </Typography>

                {bookmakerBets.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Bookmaker Bets
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'background.neutral' }}>
                          <TableRow>
                            <TableCell sx={{ minWidth: 250 }}>Team Name</TableCell>
                            <TableCell>Rate</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bookmakerBets.map((bet: Bet) => {
                            const isBackOrYes = bet.selection?.toLowerCase() === 'back';
                            const selectionColor = isBackOrYes ? '#1976d2' : '#d81b60';

                            return (
                              <TableRow key={bet._id}>
                                <TableCell>{bet.team_name || 'Team'}</TableCell>
                                <TableCell>
                                  <span style={{ color: selectionColor, fontWeight: 'bold' }}>{bet.selection}</span> ({bet.odds_rate || '-'})
                                </TableCell>
                                <TableCell align="right">
                                  ₹{Number(bet.stake_amount).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {new Date(bet.createdAt).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {fancyBets.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Fancy / Session Bets
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'background.neutral' }}>
                          <TableRow>
                            <TableCell sx={{ minWidth: 250 }}>Runner / Session Name</TableCell>
                            <TableCell>Run</TableCell>
                            <TableCell>Rate</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fancyBets.map((bet: Bet) => {
                            const isBackOrYes = bet.selection?.toLowerCase() === 'yes';
                            const selectionColor = isBackOrYes ? '#1976d2' : '#d81b60';

                            return (
                              <TableRow key={bet._id}>
                                <TableCell>{bet.runner_name || 'Session'}</TableCell>
                                <TableCell>{bet.odds_value || '-'}</TableCell>
                                <TableCell>
                                  <span style={{ color: selectionColor, fontWeight: 'bold' }}>{bet.selection}</span> ({bet.odds_rate})
                                </TableCell>
                                <TableCell align="right">
                                  ₹{Number(bet.stake_amount).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {new Date(bet.createdAt).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
