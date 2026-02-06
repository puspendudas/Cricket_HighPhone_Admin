import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Switch,
  Typography,
  CardContent,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useBatApi from 'src/Api/batLockApi/useBatApi';

interface SwitchItem {
  label: string;
  checked: boolean;
}

export function LockedcasinoTableData() {
  const { MatchOddsLock, FancyLock } = useBatApi();
  const { fetchMe } = useMeApi();

  const [casinoSwitches, setCasinoSwitches] = useState<SwitchItem[]>([
    { label: 'Teenpatti', checked: true },
    { label: '1 DAY Dragon Tiger', checked: false },
    { label: 'Teenpatti One Day', checked: true },
    { label: 'Lucky 7B', checked: true },
  ]);

  const [matchSwitches, setMatchSwitches] = useState<SwitchItem[]>([
    { label: 'BookMaker Lock', checked: false },
    { label: 'Fancy Lock', checked: false },
  ]);

  const [adminId, setAdminId] = useState<string>("");

  // Fetch user data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchMe();
        if (res?.data) {
          setAdminId(res.data._id); 
          setMatchSwitches([
            { label: 'BookMaker Lock', checked: !!res.data.bm_lock_status },
            { label: 'Fancy Lock', checked: !!res.data.fancy_lock_status },
          ]);
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCasinoToggle = (index: number) => {
    const updated = [...casinoSwitches];
    updated[index].checked = !updated[index].checked;
    setCasinoSwitches(updated);
  };

  const handleMatchToggle = async (index: number) => {
    const updated = [...matchSwitches];
    updated[index].checked = !updated[index].checked;
    setMatchSwitches(updated);

    if (updated[index].label === 'BookMaker Lock') {
      await MatchOddsLock(adminId, updated[index].checked);
    }
    if (updated[index].label === 'Fancy Lock') {
      await FancyLock(adminId, updated[index].checked);
    }
  };

  const renderSwitchSection = (
    title: string,
    data: SwitchItem[],
    onToggle: (index: number) => void
  ) => (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>
        </Box>
        {data.map((item, index) => (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            py={1}
          >
            <Typography>{item.label}</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Switch
                checked={item.checked}
                onChange={() => onToggle(index)}
                color="primary"
              />
              <Typography>{item.checked ? 'ON' : 'OFF'}</Typography>
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {renderSwitchSection('Manage Casino', casinoSwitches, handleCasinoToggle)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderSwitchSection('Manage Match', matchSwitches, handleMatchToggle)}
        </Grid>
      </Grid>
    </Box>
  );
}
