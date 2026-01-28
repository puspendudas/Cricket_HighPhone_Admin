// MatchManuallyUpdate.tsx
import type { OddData } from 'src/Interface/matchManagement.interface';

import { useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Box,
  Card,
  Grid,
  Button,
  Select,
  MenuItem,
  TextField,
  Typography,
  CardContent,
} from '@mui/material';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { toast } from 'src/components/snackbar';

interface Team {
  sid: number;
  name: string;
}

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
  const [matchName, setMatchName] = useState<string>('N/A');

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
  }, [matchData?.match?._id,]);


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

  const teams: Team[] =
    matchData?.match?.teams?.map((name: string, idx: number) => ({
      sid: idx + 1,
      name,
    })) || [];


//  const teams: Team[] = matchData?.match?.matchOdds?.[0]?.oddDatas?.map((item: OddData, idx: number) => ({
//     sid: item.sid || idx + 1,
//     name: item.rname
//   })) || [];
  const bookMakerOddsObj =
    matchData?.match?.bookMakerOdds?.[0] || {};

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
    if (!winner || !matchId) {
      toast.error('Please select a team first!');
      return;
    }

    const selectedTeam = JSON.parse(winner) as Team;
    const payload = {
      isWon: true,
      sid: selectedTeam.sid,
      team: selectedTeam.name,
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
      <Typography variant="h4" mb={2}>
        Match Name : {matchName}
      </Typography>

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
              <Select
                fullWidth
                displayEmpty
                value={winner}
                onChange={(e) => setWinner(e.target.value as string)}
                disabled={matchData?.match?.declared === true}>

                <MenuItem value="">Select Team</MenuItem>
                {teams.map((team: Team, idx: number) => (
                  <MenuItem key={idx} value={JSON.stringify(team)}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={8} textAlign="right">
              <Button
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
                onClick={handleDeclare}
                disabled={
                  matchData?.match?.declared === true ||
                  !winner ||
                  !matchId ||
                  declareMutation.isPending
                }
              >
                {declareMutation.isPending ? 'Declaring...' : 'Declare'}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleCancelMatch}
                disabled={cancelMutation.isPending || bookMakerTeams.length === 0}
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Match'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
