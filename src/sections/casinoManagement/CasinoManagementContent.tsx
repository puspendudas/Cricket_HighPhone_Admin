import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Alert,
  Button,
  Divider,
  TextField,
  Typography,
  CardHeader,
  CardContent,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useBatApi from 'src/Api/batLockApi/useBatApi';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface GameSettingsState {
  back_diff?: number | string;
  lay_diff?: number | string;
  rate_diff?: number | string;
  min_bet?: number | string;
  max_bet?: number | string;
  bet_delay?: number | string;
}

export function CasinoManagementContent() {
  const { GetCasinoManagementSettings, UpdateCasinoManagementSettings } = useBatApi();
  const { fetchMe } = useMeApi();

  const [loading, setLoading] = useState<boolean>(true);
  const [savingAll, setSavingAll] = useState<boolean>(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string>('');

  // Global Limits & Delay
  const [globalMinBet, setGlobalMinBet] = useState<number | string>(100);
  const [globalMaxBet, setGlobalMaxBet] = useState<number | string>(100000);
  const [globalBetDelay, setGlobalBetDelay] = useState<number | string>(0);

  // 20-20 Teenpatti (TEEN20) - Back Diff only
  const [teen20, setTeen20] = useState<GameSettingsState>({
    back_diff: 0,
    min_bet: 100,
    max_bet: 100000,
    bet_delay: 0,
  });

  // Teenpatti 1-day (TEEN) - Back Diff & Lay Diff
  const [teen, setTeen] = useState<GameSettingsState>({
    back_diff: 0,
    lay_diff: 0,
    min_bet: 100,
    max_bet: 100000,
    bet_delay: 0,
  });

  // Dragon Tiger 20-20 (DT20) - Dragon & Tiger rate reduction
  const [dt20, setDt20] = useState<GameSettingsState>({
    rate_diff: 0,
    min_bet: 100,
    max_bet: 100000,
    bet_delay: 0,
  });

  // Lucky 7 (LUCKY7EU) - Low Card & High Card rate reduction
  const [lucky7eu, setLucky7eu] = useState<GameSettingsState>({
    rate_diff: 0,
    min_bet: 100,
    max_bet: 100000,
    bet_delay: 0,
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const meRes = await fetchMe();
      const meAdmin = meRes?.data;
      if (meAdmin?._id) {
        setAdminId(meAdmin._id);
      }

      const settingsRes = await GetCasinoManagementSettings();
      const data = settingsRes?.data || settingsRes;

      if (data) {
        if (data.min_bet !== undefined) setGlobalMinBet(data.min_bet);
        if (data.max_bet !== undefined) setGlobalMaxBet(data.max_bet);
        if (data.bet_delay !== undefined) setGlobalBetDelay(data.bet_delay);

        const fallbackDelay = data.bet_delay ?? 0;

        if (data.teen20) {
          setTeen20({
            back_diff: data.teen20.back_diff ?? 0,
            min_bet: data.teen20.min_bet ?? data.min_bet ?? 100,
            max_bet: data.teen20.max_bet ?? data.max_bet ?? 100000,
            bet_delay: data.teen20.bet_delay ?? fallbackDelay,
          });
        }
        if (data.teen) {
          setTeen({
            back_diff: data.teen.back_diff ?? 0,
            lay_diff: data.teen.lay_diff ?? 0,
            min_bet: data.teen.min_bet ?? data.min_bet ?? 100,
            max_bet: data.teen.max_bet ?? data.max_bet ?? 100000,
            bet_delay: data.teen.bet_delay ?? fallbackDelay,
          });
        }
        if (data.dt20) {
          setDt20({
            rate_diff: data.dt20.rate_diff ?? 0,
            min_bet: data.dt20.min_bet ?? data.min_bet ?? 100,
            max_bet: data.dt20.max_bet ?? data.max_bet ?? 100000,
            bet_delay: data.dt20.bet_delay ?? fallbackDelay,
          });
        }
        if (data.lucky7eu) {
          setLucky7eu({
            rate_diff: data.lucky7eu.rate_diff ?? 0,
            min_bet: data.lucky7eu.min_bet ?? data.min_bet ?? 100,
            max_bet: data.lucky7eu.max_bet ?? data.max_bet ?? 100000,
            bet_delay: data.lucky7eu.bet_delay ?? fallbackDelay,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load casino management settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGlobalMinBetChange = (value: string | number) => {
    setGlobalMinBet(value);
    setTeen20((prev: GameSettingsState) => ({ ...prev, min_bet: value }));
    setTeen((prev: GameSettingsState) => ({ ...prev, min_bet: value }));
    setDt20((prev: GameSettingsState) => ({ ...prev, min_bet: value }));
    setLucky7eu((prev: GameSettingsState) => ({ ...prev, min_bet: value }));
  };

  const handleGlobalMaxBetChange = (value: string | number) => {
    setGlobalMaxBet(value);
    setTeen20((prev: GameSettingsState) => ({ ...prev, max_bet: value }));
    setTeen((prev: GameSettingsState) => ({ ...prev, max_bet: value }));
    setDt20((prev: GameSettingsState) => ({ ...prev, max_bet: value }));
    setLucky7eu((prev: GameSettingsState) => ({ ...prev, max_bet: value }));
  };

  const handleGlobalBetDelayChange = (value: string | number) => {
    setGlobalBetDelay(value);
    setTeen20((prev: GameSettingsState) => ({ ...prev, bet_delay: value }));
    setTeen((prev: GameSettingsState) => ({ ...prev, bet_delay: value }));
    setDt20((prev: GameSettingsState) => ({ ...prev, bet_delay: value }));
    setLucky7eu((prev: GameSettingsState) => ({ ...prev, bet_delay: value }));
  };

  const handleSaveAll = async () => {
    if (!adminId) return;
    try {
      setSavingAll(true);
      const globalMin = Number(globalMinBet);
      const globalMax = Number(globalMaxBet);
      const globalDelay = Number(globalBetDelay || 0);

      const payload = {
        adminId,
        min_bet: globalMin,
        max_bet: globalMax,
        bet_delay: globalDelay,
        teen20: {
          back_diff: Number(teen20.back_diff || 0),
          min_bet: Number(teen20.min_bet !== undefined && teen20.min_bet !== '' ? teen20.min_bet : globalMin),
          max_bet: Number(teen20.max_bet !== undefined && teen20.max_bet !== '' ? teen20.max_bet : globalMax),
          bet_delay: Number(teen20.bet_delay !== undefined && teen20.bet_delay !== '' ? teen20.bet_delay : globalDelay),
        },
        teen: {
          back_diff: Number(teen.back_diff || 0),
          lay_diff: Number(teen.lay_diff || 0),
          min_bet: Number(teen.min_bet !== undefined && teen.min_bet !== '' ? teen.min_bet : globalMin),
          max_bet: Number(teen.max_bet !== undefined && teen.max_bet !== '' ? teen.max_bet : globalMax),
          bet_delay: Number(teen.bet_delay !== undefined && teen.bet_delay !== '' ? teen.bet_delay : globalDelay),
        },
        dt20: {
          rate_diff: Number(dt20.rate_diff || 0),
          min_bet: Number(dt20.min_bet !== undefined && dt20.min_bet !== '' ? dt20.min_bet : globalMin),
          max_bet: Number(dt20.max_bet !== undefined && dt20.max_bet !== '' ? dt20.max_bet : globalMax),
          bet_delay: Number(dt20.bet_delay !== undefined && dt20.bet_delay !== '' ? dt20.bet_delay : globalDelay),
        },
        lucky7eu: {
          rate_diff: Number(lucky7eu.rate_diff || 0),
          min_bet: Number(lucky7eu.min_bet !== undefined && lucky7eu.min_bet !== '' ? lucky7eu.min_bet : globalMin),
          max_bet: Number(lucky7eu.max_bet !== undefined && lucky7eu.max_bet !== '' ? lucky7eu.max_bet : globalMax),
          bet_delay: Number(lucky7eu.bet_delay !== undefined && lucky7eu.bet_delay !== '' ? lucky7eu.bet_delay : globalDelay),
        },
      };

      await UpdateCasinoManagementSettings(payload);
    } finally {
      setSavingAll(false);
    }
  };

  const handleSaveSection = async (section: 'global' | 'teen20' | 'teen' | 'dt20' | 'lucky7eu') => {
    if (!adminId) return;
    try {
      setSavingSection(section);
      const globalMin = Number(globalMinBet);
      const globalMax = Number(globalMaxBet);
      const globalDelay = Number(globalBetDelay || 0);

      let payload: any;

      if (section === 'global') {
        // When global section is saved, sync global min/max/delay across all individual casino settings
        payload = {
          adminId,
          min_bet: globalMin,
          max_bet: globalMax,
          bet_delay: globalDelay,
          teen20: {
            back_diff: Number(teen20.back_diff || 0),
            min_bet: globalMin,
            max_bet: globalMax,
            bet_delay: globalDelay,
          },
          teen: {
            back_diff: Number(teen.back_diff || 0),
            lay_diff: Number(teen.lay_diff || 0),
            min_bet: globalMin,
            max_bet: globalMax,
            bet_delay: globalDelay,
          },
          dt20: {
            rate_diff: Number(dt20.rate_diff || 0),
            min_bet: globalMin,
            max_bet: globalMax,
            bet_delay: globalDelay,
          },
          lucky7eu: {
            rate_diff: Number(lucky7eu.rate_diff || 0),
            min_bet: globalMin,
            max_bet: globalMax,
            bet_delay: globalDelay,
          },
        };
        // Update local state to match
        setTeen20((prev: GameSettingsState) => ({ ...prev, min_bet: globalMin, max_bet: globalMax, bet_delay: globalDelay }));
        setTeen((prev: GameSettingsState) => ({ ...prev, min_bet: globalMin, max_bet: globalMax, bet_delay: globalDelay }));
        setDt20((prev: GameSettingsState) => ({ ...prev, min_bet: globalMin, max_bet: globalMax, bet_delay: globalDelay }));
        setLucky7eu((prev: GameSettingsState) => ({ ...prev, min_bet: globalMin, max_bet: globalMax, bet_delay: globalDelay }));
      } else {
        // When saving an individual section, preserve individual customizations
        payload = {
          adminId,
          min_bet: globalMin,
          max_bet: globalMax,
          bet_delay: globalDelay,
          teen20: {
            back_diff: Number(teen20.back_diff || 0),
            min_bet: Number(teen20.min_bet !== undefined && teen20.min_bet !== '' ? teen20.min_bet : globalMin),
            max_bet: Number(teen20.max_bet !== undefined && teen20.max_bet !== '' ? teen20.max_bet : globalMax),
            bet_delay: Number(teen20.bet_delay !== undefined && teen20.bet_delay !== '' ? teen20.bet_delay : globalDelay),
          },
          teen: {
            back_diff: Number(teen.back_diff || 0),
            lay_diff: Number(teen.lay_diff || 0),
            min_bet: Number(teen.min_bet !== undefined && teen.min_bet !== '' ? teen.min_bet : globalMin),
            max_bet: Number(teen.max_bet !== undefined && teen.max_bet !== '' ? teen.max_bet : globalMax),
            bet_delay: Number(teen.bet_delay !== undefined && teen.bet_delay !== '' ? teen.bet_delay : globalDelay),
          },
          dt20: {
            rate_diff: Number(dt20.rate_diff || 0),
            min_bet: Number(dt20.min_bet !== undefined && dt20.min_bet !== '' ? dt20.min_bet : globalMin),
            max_bet: Number(dt20.max_bet !== undefined && dt20.max_bet !== '' ? dt20.max_bet : globalMax),
            bet_delay: Number(dt20.bet_delay !== undefined && dt20.bet_delay !== '' ? dt20.bet_delay : globalDelay),
          },
          lucky7eu: {
            rate_diff: Number(lucky7eu.rate_diff || 0),
            min_bet: Number(lucky7eu.min_bet !== undefined && lucky7eu.min_bet !== '' ? lucky7eu.min_bet : globalMin),
            max_bet: Number(lucky7eu.max_bet !== undefined && lucky7eu.max_bet !== '' ? lucky7eu.max_bet : globalMax),
            bet_delay: Number(lucky7eu.bet_delay !== undefined && lucky7eu.bet_delay !== '' ? lucky7eu.bet_delay : globalDelay),
          },
        };
      }

      await UpdateCasinoManagementSettings(payload);
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10}>
        <CircularProgress size={48} sx={{ color: '#16A34A', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading Casino Management configurations...
        </Typography>
      </Box>
    );
  }

  // Previews
  const teen20BackDiff = Number(teen20.back_diff || 0);
  const teenBackDiff = Number(teen.back_diff || 0);
  const teenLayDiff = Number(teen.lay_diff || 0);
  const dt20RateDiff = Number(dt20.rate_diff || 0);
  const lucky7RateDiff = Number(lucky7eu.rate_diff || 0);

  return (
    <Box>
      {/* Top Banner Action */}
      <Card
        sx={{
          p: 2.5,
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: '#F8FAFC',
          border: '1px solid #E2E8F0',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} color="#1E293B">
            Global Casino Settings, Bet Delay & Real-Time Rate Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Changes saved here are broadcasted in real time to all active users on live casino pages.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleSaveAll}
          disabled={savingAll || !adminId}
          startIcon={savingAll ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:diskette-bold" width={20} />}
          sx={{
            bgcolor: '#16A34A',
            '&:hover': { bgcolor: '#15803D' },
            px: 3,
            py: 1.2,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {savingAll ? 'Saving All...' : 'Save All Settings'}
        </Button>
      </Card>

      <Grid container spacing={3}>
        {/* SECTION 1: GLOBAL CASINO CONFIGURATION (LIMITS & BET DELAY) */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <Iconify icon="solar:wallet-money-bold" width={24} sx={{ color: '#16A34A' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Global Casino Configuration (Default Fallback)
                  </Typography>
                </Box>
              }
              subheader="Sets the baseline minimum stake, maximum stake, and bet delay in seconds for all live casino games."
              action={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSaveSection('global')}
                  disabled={savingSection === 'global'}
                  startIcon={savingSection === 'global' ? <CircularProgress size={14} color="inherit" /> : <Iconify icon="solar:check-circle-bold" width={16} />}
                  sx={{ borderColor: '#16A34A', color: '#16A34A', '&:hover': { borderColor: '#15803D', bgcolor: '#F0FDF4' } }}
                >
                  Save Global Settings
                </Button>
              }
            />
            <Divider sx={{ my: 1.5 }} />
            <CardContent>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Global Minimum Bet"
                    type="number"
                    value={globalMinBet}
                    onChange={(e: any) => handleGlobalMinBetChange(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText="Minimum allowable stake per bet (updates all casinos)"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Global Maximum Bet"
                    type="number"
                    value={globalMaxBet}
                    onChange={(e: any) => handleGlobalMaxBetChange(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText="Maximum allowable stake per bet (updates all casinos)"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Global Bet Delay (Seconds)"
                    type="number"
                    value={globalBetDelay}
                    onChange={(e: any) => handleGlobalBetDelayChange(e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                    }}
                    helperText="Delay before bet is accepted. If market suspends, bet is cancelled."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* SECTION 2: 20-20 TEENPATTI (TEEN20) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label="TEEN20" size="small" sx={{ bgcolor: '#3B82F6', color: '#FFF', fontWeight: 800 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      20-20 Teenpatti
                    </Typography>
                  </Box>
                </Box>
              }
              subheader="Only has Back rate data. Difference reduces Back odds."
              action={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSaveSection('teen20')}
                  disabled={savingSection === 'teen20'}
                  startIcon={savingSection === 'teen20' ? <CircularProgress size={14} color="inherit" /> : <Iconify icon="solar:check-circle-bold" width={16} />}
                  sx={{ borderColor: '#3B82F6', color: '#3B82F6', '&:hover': { borderColor: '#2563EB', bgcolor: '#EFF6FF' } }}
                >
                  Save
                </Button>
              }
            />
            <Divider sx={{ my: 1.5 }} />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Back Rate Difference (Reduce)"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                value={teen20.back_diff}
                onChange={(e: any) => setTeen20({ ...teen20, back_diff: e.target.value })}
                helperText="Reduces Back odds: Rate - Difference"
              />

              {/* Live Preview Box */}
              <Alert severity="info" sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <Typography variant="caption" fontWeight={700} display="block" color="#1E40AF">
                  Live Calculation Preview:
                </Typography>
                <Typography variant="body2" color="#1E3A8A">
                  Original Back: <Box component="span" sx={{ fontWeight: 'bold' }}>1.98</Box> ➔ User Back:{' '}
                  <Box component="span" sx={{ color: '#16A34A', fontWeight: 'bold' }}>
                    {Math.max(0, 1.98 - teen20BackDiff).toFixed(2)}
                  </Box>
                </Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mt: 'auto' }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Min Bet"
                    type="number"
                    value={teen20.min_bet}
                    onChange={(e: any) => setTeen20({ ...teen20, min_bet: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Max Bet"
                    type="number"
                    value={teen20.max_bet}
                    onChange={(e: any) => setTeen20({ ...teen20, max_bet: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Delay (s)"
                    type="number"
                    value={teen20.bet_delay}
                    onChange={(e: any) => setTeen20({ ...teen20, bet_delay: e.target.value })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* SECTION 3: TEENPATTI 1-DAY (TEEN) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label="TEEN" size="small" sx={{ bgcolor: '#8B5CF6', color: '#FFF', fontWeight: 800 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Teenpatti 1-day
                    </Typography>
                  </Box>
                </Box>
              }
              subheader="Has Back and Lay odds. Back rate reduces, Lay rate increases."
              action={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSaveSection('teen')}
                  disabled={savingSection === 'teen'}
                  startIcon={savingSection === 'teen' ? <CircularProgress size={14} color="inherit" /> : <Iconify icon="solar:check-circle-bold" width={16} />}
                  sx={{ borderColor: '#8B5CF6', color: '#8B5CF6', '&:hover': { borderColor: '#7C3AED', bgcolor: '#F5F3FF' } }}
                >
                  Save
                </Button>
              }
            />
            <Divider sx={{ my: 1.5 }} />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Back Rate Diff (Reduce)"
                    type="number"
                    inputProps={{ step: '0.01', min: '0' }}
                    value={teen.back_diff}
                    onChange={(e: any) => setTeen({ ...teen, back_diff: e.target.value })}
                    helperText="Reduces Back: Back - Diff"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Lay Rate Diff (Increase)"
                    type="number"
                    inputProps={{ step: '0.01', min: '0' }}
                    value={teen.lay_diff}
                    onChange={(e: any) => setTeen({ ...teen, lay_diff: e.target.value })}
                    helperText="Increases Lay: Lay + Diff"
                  />
                </Grid>
              </Grid>

              {/* Live Preview Box */}
              <Alert severity="info" sx={{ bgcolor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                <Typography variant="caption" fontWeight={700} display="block" color="#5B21B6">
                  Live Calculation Preview:
                </Typography>
                <Typography variant="body2" color="#4C1D95">
                  Back <Box component="span" sx={{ fontWeight: 'bold' }}>1.98</Box> ➔ User Back:{' '}
                  <Box component="span" sx={{ color: '#16A34A', fontWeight: 'bold' }}>
                    {Math.max(0, 1.98 - teenBackDiff).toFixed(2)}
                  </Box>{' '}
                  | Lay <Box component="span" sx={{ fontWeight: 'bold' }}>2.02</Box> ➔ User Lay:{' '}
                  <Box component="span" sx={{ color: '#E11D48', fontWeight: 'bold' }}>
                    {(2.02 + teenLayDiff).toFixed(2)}
                  </Box>
                </Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mt: 'auto' }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Min Bet"
                    type="number"
                    value={teen.min_bet}
                    onChange={(e: any) => setTeen({ ...teen, min_bet: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Max Bet"
                    type="number"
                    value={teen.max_bet}
                    onChange={(e: any) => setTeen({ ...teen, max_bet: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Delay (s)"
                    type="number"
                    value={teen.bet_delay}
                    onChange={(e: any) => setTeen({ ...teen, bet_delay: e.target.value })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* SECTION 4: DRAGON TIGER 20-20 (DT20) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label="DT20" size="small" sx={{ bgcolor: '#F59E0B', color: '#FFF', fontWeight: 800 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Dragon Tiger 20-20
                    </Typography>
                  </Box>
                </Box>
              }
              subheader="Rate comes in 'b'. Difference reduces strictly Dragon & Tiger rates only."
              action={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSaveSection('dt20')}
                  disabled={savingSection === 'dt20'}
                  startIcon={savingSection === 'dt20' ? <CircularProgress size={14} color="inherit" /> : <Iconify icon="solar:check-circle-bold" width={16} />}
                  sx={{ borderColor: '#F59E0B', color: '#F59E0B', '&:hover': { borderColor: '#D97706', bgcolor: '#FFFBEB' } }}
                >
                  Save
                </Button>
              }
            />
            <Divider sx={{ my: 1.5 }} />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Dragon / Tiger Rate Difference (Reduce)"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                value={dt20.rate_diff}
                onChange={(e: any) => setDt20({ ...dt20, rate_diff: e.target.value })}
                helperText="Reduces rate strictly for Dragon & Tiger. Side bets stay standard."
              />

              {/* Live Preview Box */}
              <Alert severity="info" sx={{ bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <Typography variant="caption" fontWeight={700} display="block" color="#92400E">
                  Live Calculation Preview:
                </Typography>
                <Typography variant="body2" color="#78350F">
                  Dragon/Tiger <Box component="span" sx={{ fontWeight: 'bold' }}>1.98</Box> ➔ User:{' '}
                  <Box component="span" sx={{ color: '#16A34A', fontWeight: 'bold' }}>
                    {Math.max(0, 1.98 - dt20RateDiff).toFixed(2)}
                  </Box>{' '}
                  | Tie / Pair: <Box component="span" sx={{ fontWeight: 'bold' }}>9.00</Box> (Unchanged)
                </Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mt: 'auto' }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Min Bet"
                    type="number"
                    value={dt20.min_bet}
                    onChange={(e: any) => setDt20({ ...dt20, min_bet: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Max Bet"
                    type="number"
                    value={dt20.max_bet}
                    onChange={(e: any) => setDt20({ ...dt20, max_bet: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Delay (s)"
                    type="number"
                    value={dt20.bet_delay}
                    onChange={(e: any) => setDt20({ ...dt20, bet_delay: e.target.value })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* SECTION 5: LUCKY 7 (LUCKY7EU) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label="LUCKY7" size="small" sx={{ bgcolor: '#10B981', color: '#FFF', fontWeight: 800 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Lucky 7
                    </Typography>
                  </Box>
                </Box>
              }
              subheader="Rate comes in 'b'. Difference reduces strictly Low Card & High Card rates only."
              action={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSaveSection('lucky7eu')}
                  disabled={savingSection === 'lucky7eu'}
                  startIcon={savingSection === 'lucky7eu' ? <CircularProgress size={14} color="inherit" /> : <Iconify icon="solar:check-circle-bold" width={16} />}
                  sx={{ borderColor: '#10B981', color: '#10B981', '&:hover': { borderColor: '#059669', bgcolor: '#ECFDF5' } }}
                >
                  Save
                </Button>
              }
            />
            <Divider sx={{ my: 1.5 }} />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Low / High Card Rate Difference (Reduce)"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                value={lucky7eu.rate_diff}
                onChange={(e: any) => setLucky7eu({ ...lucky7eu, rate_diff: e.target.value })}
                helperText="Reduces rate strictly for Low Card & High Card. Card 7 stays standard."
              />

              {/* Live Preview Box */}
              <Alert severity="info" sx={{ bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <Typography variant="caption" fontWeight={700} display="block" color="#065F46">
                  Live Calculation Preview:
                </Typography>
                <Typography variant="body2" color="#064E3B">
                  Low/High <Box component="span" sx={{ fontWeight: 'bold' }}>1.98</Box> ➔ User:{' '}
                  <Box component="span" sx={{ color: '#16A34A', fontWeight: 'bold' }}>
                    {Math.max(0, 1.98 - lucky7RateDiff).toFixed(2)}
                  </Box>{' '}
                  | Card 7 / Color: <Box component="span" sx={{ fontWeight: 'bold' }}>12.00</Box> (Unchanged)
                </Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mt: 'auto' }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Min Bet"
                    type="number"
                    value={lucky7eu.min_bet}
                    onChange={(e: any) => setLucky7eu({ ...lucky7eu, min_bet: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Max Bet"
                    type="number"
                    value={lucky7eu.max_bet}
                    onChange={(e: any) => setLucky7eu({ ...lucky7eu, max_bet: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Delay (s)"
                    type="number"
                    value={lucky7eu.bet_delay}
                    onChange={(e: any) => setLucky7eu({ ...lucky7eu, bet_delay: e.target.value })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
