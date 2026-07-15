import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Switch,
  Typography,
} from '@mui/material';

import useAutosettingApi from 'src/Api/Autosetting/useAutosettingApi';

interface SwitchItem {
  label: string;
  checked: boolean;
}

export function AutosettingData() {

  const { AutoDeclareSessionstart, AutoDeclareSessionstop, getSettings, updateSettings } = useAutosettingApi();

  const [casinoSwitches, setCasinoSwitches] = useState<SwitchItem[]>([
    { label: 'Auto Session Manually Update', checked: false },
  ]);

  const [scoreboardProvider, setScoreboardProvider] = useState<string>('BetFair');

  // ✅ Fetch initial settings
  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (settingsData?.data) {
      const settings = settingsData.data;
      if (settings.auto_declare !== undefined) {
        setCasinoSwitches([{ label: 'Auto Session Manually Update', checked: settings.auto_declare }]);
      }
      if (settings.scoreboard_provider) {
        setScoreboardProvider(settings.scoreboard_provider);
      }
    }
  }, [settingsData]);

  // ✅ Start mutation
  const startMutation = useMutation({
    mutationFn: () => AutoDeclareSessionstart(),
  });

  // ✅ Stop mutation
  const stopMutation = useMutation({
    mutationFn: () => AutoDeclareSessionstop(),
  });

  // ✅ Update Settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (payload: any) => updateSettings(payload),
  });

  // ✅ Toggle handler with API call
  const handleCasinoToggle = (index: number) => {
    const newChecked = !casinoSwitches[index].checked;

    // Update UI first
    setCasinoSwitches((prev) => {
      const updated = [...prev];
      updated[index].checked = newChecked;
      return updated;
    });

    // Call API based on state
    if (newChecked) {
      startMutation.mutate();
    } else {
      stopMutation.mutate();
    }
  };

  const handleScoreboardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = (event.target as HTMLInputElement).value;
    setScoreboardProvider(newValue);
    updateSettingsMutation.mutate({ scoreboard_provider: newValue });
  };

  const isLoading = startMutation.isPending || stopMutation.isPending;

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

              {isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <Switch
                  checked={item.checked}
                  onChange={() => onToggle(index)}
                  color="primary"
                />
              )}

              <Typography>
                {item.checked ? 'ON' : 'OFF'}
              </Typography>

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
          {renderSwitchSection(
            'Manage Auto Declare',
            casinoSwitches,
            handleCasinoToggle
          )}
        </Grid>
       
        
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Manage Scoreboard</Typography>
              </Box>
              
              {isSettingsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    name="scoreboard-provider"
                    value={scoreboardProvider}
                    onChange={handleScoreboardChange}
                  >
                    <FormControlLabel 
                      value="BetFair" 
                      control={<Radio color="primary" />} 
                      label="BetFair" 
                      disabled={updateSettingsMutation.isPending}
                    />
                    <FormControlLabel 
                      value="Diamond" 
                      control={<Radio color="primary" />} 
                      label="Diamond" 
                      disabled={updateSettingsMutation.isPending}
                    />
                  </RadioGroup>
                  {updateSettingsMutation.isPending && (
                    <Box mt={1} display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={16} />
                      <Typography variant="caption">Updating...</Typography>
                    </Box>
                  )}
                </FormControl>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}
