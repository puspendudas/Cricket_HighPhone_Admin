import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Button,
  Switch,
  TextField,
  Typography,
  CardContent,
  Tooltip,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useBatApi from 'src/Api/batLockApi/useBatApi';

interface CasinoSwitchItem {
  gameCode: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  lockedByParent: boolean;
}

interface MatchSwitchItem {
  type: 'bm' | 'fancy';
  label: string;
  checked: boolean;
  disabled: boolean;
  lockedByParent: boolean;
}

const CASINO_GAMES_CONFIG = [
  { gameCode: 'teen', label: 'Teen Patti 1 Day' },
  { gameCode: 'teen20', label: '20-20 TeenPatti' },
  { gameCode: 'dt20', label: 'Dragon Tiger 20-20' },
  { gameCode: 'lucky7eu', label: 'Lucky 7 B' },
];

export function LockedcasinoTableData() {
  const { MatchOddsLock, FancyLock, CasinoLock, UpdateCasinoLimits, UpdateCasinoRateDiff } = useBatApi();
  const { fetchMe } = useMeApi();

  const [casinoSwitches, setCasinoSwitches] = useState<CasinoSwitchItem[]>([
    { gameCode: 'teen', label: 'Teen Patti 1 Day', checked: true, disabled: false, lockedByParent: false },
    { gameCode: 'teen20', label: '20-20 TeenPatti', checked: true, disabled: false, lockedByParent: false },
    { gameCode: 'dt20', label: 'Dragon Tiger 20-20', checked: true, disabled: false, lockedByParent: false },
    { gameCode: 'lucky7eu', label: 'Lucky 7 B', checked: true, disabled: false, lockedByParent: false },
  ]);

  const [matchSwitches, setMatchSwitches] = useState<MatchSwitchItem[]>([
    { type: 'bm', label: 'BookMaker Lock', checked: false, disabled: false, lockedByParent: false },
    { type: 'fancy', label: 'Fancy Lock', checked: false, disabled: false, lockedByParent: false },
  ]);

  const [adminId, setAdminId] = useState<string>('');
  const [minBet, setMinBet] = useState<number | string>(100);
  const [maxBet, setMaxBet] = useState<number | string>(100000);
  const [rateDiff, setRateDiff] = useState<number | string>(0);
  const [isSavingLimits, setIsSavingLimits] = useState<boolean>(false);
  const [isSavingRateDiff, setIsSavingRateDiff] = useState<boolean>(false);

  // Fetch admin and hierarchy lock data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchMe();
        if (res?.data) {
          const adminData = res.data;
          const lockStatus = res.lockStatus || {};
          setAdminId(adminData._id);

          const parentCasinoLocks: string[] = lockStatus.parentCasinoLocks || [];
          const isCasinoLockedByParent: boolean = !!lockStatus.isCasinoLockedByParent;
          const adminCasinoLocks: string[] = adminData.casino_lock || [];
          const adminCasinoLockStatus: boolean = !!adminData.casino_lock_status;

          const initializedCasinoSwitches: CasinoSwitchItem[] = CASINO_GAMES_CONFIG.map((game) => {
            const isLockedByParent = isCasinoLockedByParent || parentCasinoLocks.includes(game.gameCode);
            const isLockedByAdmin = adminCasinoLockStatus || adminCasinoLocks.includes(game.gameCode);

            return {
              gameCode: game.gameCode,
              label: game.label,
              checked: !isLockedByParent && !isLockedByAdmin,
              disabled: isLockedByParent,
              lockedByParent: isLockedByParent,
            };
          });

          setCasinoSwitches(initializedCasinoSwitches);

          const isBmLockedByParent = !!lockStatus.isBmLockedByParent;
          const isFancyLockedByParent = !!lockStatus.isFancyLockedByParent;

          setMatchSwitches([
            {
              type: 'bm',
              label: 'BookMaker Lock',
              checked: !!adminData.bm_lock_status,
              disabled: isBmLockedByParent,
              lockedByParent: isBmLockedByParent,
            },
            {
              type: 'fancy',
              label: 'Fancy Lock',
              checked: !!adminData.fancy_lock_status,
              disabled: isFancyLockedByParent,
              lockedByParent: isFancyLockedByParent,
            },
          ]);

          // Set min/max and rate diff from admin or effective locks
          if (adminData.casino_min_bet !== undefined || lockStatus.effectiveCasinoMinBet !== undefined) {
            setMinBet(adminData.casino_min_bet ?? lockStatus.effectiveCasinoMinBet ?? 100);
          }
          if (adminData.casino_max_bet !== undefined || lockStatus.effectiveCasinoMaxBet !== undefined) {
            setMaxBet(adminData.casino_max_bet ?? lockStatus.effectiveCasinoMaxBet ?? 100000);
          }
          if (adminData.casino_rate_diff !== undefined || lockStatus.effectiveCasinoRateDiff !== undefined) {
            setRateDiff(adminData.casino_rate_diff ?? lockStatus.effectiveCasinoRateDiff ?? 0);
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCasinoToggle = async (index: number) => {
    const target = casinoSwitches[index];
    if (!target || target.disabled || !adminId) return;

    const newChecked = !target.checked;
    const lockedParam = !newChecked;

    try {
      const updated = [...casinoSwitches];
      updated[index] = { ...target, checked: newChecked };
      setCasinoSwitches(updated);

      await CasinoLock(adminId, target.gameCode, lockedParam);
    } catch (err) {
      console.error('Error toggling casino lock:', err);
      const reverted = [...casinoSwitches];
      reverted[index] = { ...target, checked: target.checked };
      setCasinoSwitches(reverted);
    }
  };

  const handleMatchToggle = async (index: number) => {
    const target = matchSwitches[index];
    if (!target || target.disabled || !adminId) return;

    const newChecked = !target.checked;

    try {
      const updated = [...matchSwitches];
      updated[index] = { ...target, checked: newChecked };
      setMatchSwitches(updated);

      if (target.type === 'bm') {
        await MatchOddsLock(adminId, newChecked);
      } else if (target.type === 'fancy') {
        await FancyLock(adminId, newChecked);
      }
    } catch (err) {
      console.error('Error toggling match lock:', err);
      const reverted = [...matchSwitches];
      reverted[index] = { ...target, checked: target.checked };
      setMatchSwitches(reverted);
    }
  };

  const handleSaveCasinoLimits = async () => {
    if (!adminId) return;
    const numMin = Number(minBet);
    const numMax = Number(maxBet);
    if (Number.isNaN(numMin) || numMin < 0) return;
    if (Number.isNaN(numMax) || numMax <= 0) return;

    try {
      setIsSavingLimits(true);
      await UpdateCasinoLimits(adminId, numMin, numMax);
    } catch (err) {
      console.error('Error saving casino limits:', err);
    } finally {
      setIsSavingLimits(false);
    }
  };

  const handleSaveRateDiff = async () => {
    if (!adminId) return;
    const numDiff = Number(rateDiff);
    if (Number.isNaN(numDiff) || numDiff < 0) return;

    try {
      setIsSavingRateDiff(true);
      await UpdateCasinoRateDiff(adminId, numDiff);
    } catch (err) {
      console.error('Error saving casino rate diff:', err);
    } finally {
      setIsSavingRateDiff(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Manage Casino Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Manage Casino</Typography>
              </Box>
              {casinoSwitches.map((item: CasinoSwitchItem, index: number) => (
                <Box
                  key={item.gameCode}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  py={1.5}
                  sx={{ borderBottom: index < casinoSwitches.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography fontWeight={500}>{item.label}</Typography>
                    {item.lockedByParent && (
                      <Chip
                        label="Locked by Upline"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 22 }}
                      />
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Tooltip title={item.lockedByParent ? 'Enforced by upline admin hierarchy' : ''} arrow>
                      <Box component="span">
                        <Switch
                          checked={item.checked}
                          disabled={item.disabled}
                          onChange={() => handleCasinoToggle(index)}
                          color="primary"
                        />
                      </Box>
                    </Tooltip>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: item.checked ? 'success.main' : 'text.secondary', minWidth: 32 }}
                    >
                      {item.checked ? 'ON' : 'OFF'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Manage Match Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Manage Match</Typography>
              </Box>
              {matchSwitches.map((item: MatchSwitchItem, index: number) => (
                <Box
                  key={item.type}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  py={1.5}
                  sx={{ borderBottom: index < matchSwitches.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography fontWeight={500}>{item.label}</Typography>
                    {item.lockedByParent && (
                      <Chip
                        label="Locked by Upline"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 22 }}
                      />
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Tooltip title={item.lockedByParent ? 'Enforced by upline admin hierarchy' : ''} arrow>
                      <Box component="span">
                        <Switch
                          checked={item.checked}
                          disabled={item.disabled}
                          onChange={() => handleMatchToggle(index)}
                          color="primary"
                        />
                      </Box>
                    </Tooltip>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: item.checked ? 'error.main' : 'text.secondary', minWidth: 32 }}
                    >
                      {item.checked ? 'ON' : 'OFF'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
