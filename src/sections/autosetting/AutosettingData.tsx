import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import {
  Box,
  Card,
  Grid,
  Switch,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import useAutosettingApi from 'src/Api/Autosetting/useAutosettingApi';

interface SwitchItem {
  label: string;
  checked: boolean;
}

export function AutosettingData() {

  const { AutoDeclareSessionstart, AutoDeclareSessionstop } = useAutosettingApi();

  const [casinoSwitches, setCasinoSwitches] = useState<SwitchItem[]>([
    { label: 'Auto Session Manually Update', checked: false },
  ]);

  // ✅ Start mutation
  const startMutation = useMutation({
    mutationFn: () => AutoDeclareSessionstart(),
  });

  // ✅ Stop mutation
  const stopMutation = useMutation({
    mutationFn: () => AutoDeclareSessionstop(),
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
      </Grid>
    </Box>
  );
}
