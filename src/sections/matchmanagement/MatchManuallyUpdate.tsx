// MatchManuallyUpdate.tsx
import type { OddData } from 'src/Interface/matchManagement.interface';

import { useParams } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import type { ExtractedTeam } from 'src/utils/extractTeams';

import { extractTeamsFromMatchData } from 'src/utils/extractTeams';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { toast } from 'src/components/snackbar';

interface OddTeam {
  name: string;
  lagai: number;
  khai: number;
  status: string;
}

export default function MatchManuallyUpdate() {
  const { FatchUpdateMatchData, DeclareMatch, CancelMatch, Matchdelay, FetchBetData } = useMatchApi();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // states
  const [betDelay, setBetDelay] = useState<number>(0);
  const [betMin, setBetMin] = useState<number>(0);
  const [betMax, setBetMax] = useState<number>(0);
  const [winner, setWinner] = useState<string>('');
  const [customTeamName, setCustomTeamName] = useState<string>('');
  const [customSid, setCustomSid] = useState<number>(1);
  const [matchName, setMatchName] = useState<string>('N/A');
  const [includeDraw, setIncludeDraw] = useState<boolean>(false);

  // Query for fetching match data (odds & teams)
  const {
    data: matchData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['matchData', id],
    queryFn: () => {
      if (!id) throw new Error('ID not found');
      return FatchUpdateMatchData(id);
    },
    enabled: !!id,
    refetchInterval: 1000,
  });

  // useEffect for FetchBetData
  useEffect(() => {
    const fetchBetDetails = async () => {
      if (!matchData?.match?._id) return;
      try {
        const response = await FetchBetData(matchData.match._id);
        if (response?.match) {
          setBetDelay(response.match.bet_delay || 10);
          setBetMin(response.match.min || 0);
          setBetMax(response.match.max || 0);
          setMatchName(response.match.eventName || 'N/A');
        }
      } catch (error) {
        console.error('Error fetching bet data:', error);
        toast.error('Failed to fetch bet data');
      }
    };

    fetchBetDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchData?.match?._id]);

  // Mutations
  const declareMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: any }) =>
      DeclareMatch(matchId, payload),
    onSuccess: () => {
      toast.success('Match declared successfully!');
      queryClient.invalidateQueries({ queryKey: ['matchData', id] });
    },
    onError: (declareError: any) => {
      toast.error(`Declare failed: ${declareError?.message || 'Unknown error'}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (matchId: string) => CancelMatch(matchId),
    onSuccess: () => {
      toast.success('Match cancelled successfully!');
      queryClient.invalidateQueries({ queryKey: ['matchData', id] });
    },
    onError: (cancelError: any) => {
      toast.error(`Cancel failed: ${cancelError?.message || 'Unknown error'}`);
    },
  });

  const matchDelayMutation = useMutation({
    mutationFn: ({ matchId, delay, min, max }: { matchId: string; delay: number; min: number; max: number }) =>
      Matchdelay(matchId, delay, min, max),
    onSuccess: () => {
      toast.success('Match updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update match: ${error?.message || 'Unknown error'}`);
    },
  });

  // Derived state
  const matchId = matchData?.match?._id || null;
  const isDeclared = matchData?.match?.declared === true;
  const declaredWinner = matchData?.match?.wonby;

  // Extract teams from match data using all available sources
  const teams: ExtractedTeam[] = useMemo(
    () => extractTeamsFromMatchData(matchData?.match, includeDraw),
    [matchData?.match, includeDraw]
  );

  const bookMakerOddsObj = matchData?.match?.bookMakerOdds?.[0] || {};

  const bookmakerMarket =
    bookMakerOddsObj.bm1 ||
    bookMakerOddsObj.bm2 ||
    bookMakerOddsObj.bm3 ||
    null;

  const bookMakerTeams =
    bookmakerMarket?.oddDatas?.map((item: any) => ({
      name: item.rname,
      lagai: parseFloat(item.l1 || '0'),
      khai: parseFloat(item.b1 || '0'),
      status: item.status,
    })) || [];

  const matchOdds: OddTeam[] =
    matchData?.match?.matchOdds?.[0]?.oddDatas?.map((item: OddData) => ({
      name: item.rname || 'Unknown',
      lagai: parseFloat(item.l1 || '0'),
      khai: parseFloat(item.b1 || '0'),
      status: item.status || 'Inactive',
    })) || [];

  // Handlers
  const handleDeclare = async () => {
    if (!matchId) {
      toast.error('Match ID not found!');
      return;
    }

    let selectedTeamName = '';
    let selectedSid = 1;

    if (winner === '__custom__') {
      if (!customTeamName.trim()) {
        toast.error('Please enter the custom winning team name!');
        return;
      }
      selectedTeamName = customTeamName.trim();
      selectedSid = Number(customSid) || 1;
    } else if (winner) {
      try {
        const parsed = JSON.parse(winner) as ExtractedTeam;
        selectedTeamName = parsed.name;
        selectedSid = parsed.sid;
      } catch {
        selectedTeamName = winner;
      }
    } else {
      toast.error('Please select a team first!');
      return;
    }

    const payload = {
      isWon: true,
      sid: selectedSid,
      team: selectedTeamName,
    };

    declareMutation.mutate({ matchId, payload });
  };

  const handleCancelMatch = async () => {
    if (!matchId) {
      toast.error('Match ID not found!');
      return;
    }
    cancelMutation.mutate(matchId);
  };

  const handleUpdateMatch = () => {
    if (!matchId) {
      toast.error('Match ID not found!');
      return;
    }
    matchDelayMutation.mutate({
      matchId,
      delay: Number(betDelay),
      min: Number(betMin),
      max: Number(betMax),
    });
  };

  // Early returns
  if (isLoading) {
    return <Typography>Loading match data...</Typography>;
  }

  if (queryError) {
    return <Typography color="error">Error loading match data</Typography>;
  }

  // UI render
  return (
    <Box p={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4">
          Match Name : {matchName || matchData?.match?.eventName || 'N/A'}
        </Typography>
        {isDeclared && (
          <Chip
            label={`DECLARED (Winner: ${declaredWinner || 'N/A'})`}
            color="success"
            sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}
          />
        )}
      </Stack>

      {isDeclared && (
        <Alert severity="success" sx={{ mb: 3 }}>
          This match has already been declared. Winning Team:{' '}
          <strong>{declaredWinner || 'N/A'}</strong>
        </Alert>
      )}

      {/* Book Maker Section */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" mb={2}>
            Book Maker
          </Typography>
          <Grid container spacing={2} fontWeight={600} mb={2}>
            <Grid item xs={3}>Team</Grid>
            <Grid item xs={3}>Khai</Grid>
            <Grid item xs={3}>Lagai</Grid>
            <Grid item xs={3}>Status</Grid>
          </Grid>

          {bookMakerTeams.map((team: OddTeam, idx: number) => (
            <Grid container spacing={2} key={idx} alignItems="center" mb={1}>
              <Grid item xs={3}>{team.name}</Grid>
              <Grid item xs={3}>
                <TextField fullWidth value={team.lagai.toFixed(2)} disabled />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth value={team.khai.toFixed(2)} disabled />
              </Grid>
              <Grid item xs={3}>
                <Button variant="contained" color="error">
                  {team.status}
                </Button>
              </Grid>
            </Grid>
          ))}
        </CardContent>
      </Card>

      {/* Match Odds Section */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" mb={2}>
            Match Odds
          </Typography>
          <Grid container spacing={2} fontWeight={600} mb={2}>
            <Grid item xs={3}>Team</Grid>
            <Grid item xs={3}>Lagai</Grid>
            <Grid item xs={3}>Khai</Grid>
            <Grid item xs={3}>Status</Grid>
          </Grid>

          {matchOdds.map((odds: OddTeam, idx: number) => (
            <Grid container spacing={2} key={idx} alignItems="center" mb={1}>
              <Grid item xs={3}>{odds.name}</Grid>
              <Grid item xs={3}>
                <TextField fullWidth value={odds.lagai.toFixed(2)} disabled />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth value={odds.khai.toFixed(2)} disabled />
              </Grid>
              <Grid item xs={3}>
                <Button variant="contained" color="error">
                  {odds.status}
                </Button>
              </Grid>
            </Grid>
          ))}
        </CardContent>
      </Card>

      {/* Update Match Section */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Update Match
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Select
                fullWidth
                value={betDelay}
                onChange={(e) => setBetDelay(Number(e.target.value))}
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <MenuItem key={i} value={i}>
                    {i}
                  </MenuItem>
                ))}

                {!(betDelay >= 0 && betDelay <= 10) && (
                  <MenuItem value={betDelay}>{betDelay}</MenuItem>
                )}
              </Select>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bet Min"
                type="number"
                value={betMin}
                onChange={(e) => setBetMin(Number(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bet Max"
                type="number"
                value={betMax}
                onChange={(e) => setBetMax(Number(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} textAlign="right">
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdateMatch}
                disabled={matchDelayMutation.isPending}
              >
                {matchDelayMutation.isPending ? 'Updating...' : 'Submit'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Declare Team Section */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Declare Team
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="declare-team-select-label">Select Team</InputLabel>
                <Select
                  labelId="declare-team-select-label"
                  label="Select Team"
                  displayEmpty
                  value={winner}
                  onChange={(e) => setWinner(e.target.value as string)}
                  disabled={isDeclared}
                >
                  <MenuItem value="">
                    <em>Select Team</em>
                  </MenuItem>
                  {teams.map((team: ExtractedTeam, idx: number) => (
                    <MenuItem key={idx} value={JSON.stringify(team)}>
                      {team.name} (SID: {team.sid})
                    </MenuItem>
                  ))}
                  <MenuItem value="__custom__">
                    <em>+ Enter Custom Team Name</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeDraw}
                    onChange={(e) => setIncludeDraw(e.target.checked)}
                    disabled={isDeclared}
                  />
                }
                label="Include 'The Draw'"
              />
            </Grid>
            <Grid item xs={12} md={5} textAlign="right">
              <Button
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
                onClick={handleDeclare}
                disabled={
                  isDeclared ||
                  !winner ||
                  !matchId ||
                  (winner === '__custom__' && !customTeamName.trim()) ||
                  declareMutation.isPending
                }
              >
                {declareMutation.isPending ? 'Declaring...' : 'Declare'}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleCancelMatch}
                disabled={cancelMutation.isPending || isDeclared}
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Match'}
              </Button>
            </Grid>

            {/* Custom Team Name Inputs */}
            {winner === '__custom__' && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="subtitle2" mb={1}>
                    Enter Custom Winning Team:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Winning Team Name"
                        value={customTeamName}
                        onChange={(e) => setCustomTeamName(e.target.value)}
                        placeholder="e.g. England U19"
                        disabled={isDeclared}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Selection ID (SID)"
                        type="number"
                        value={customSid}
                        onChange={(e) => setCustomSid(Number(e.target.value) || 1)}
                        disabled={isDeclared}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
