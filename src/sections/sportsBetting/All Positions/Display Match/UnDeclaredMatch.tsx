import type { Dayjs } from 'dayjs';
import type {
  SelectChangeEvent} from '@mui/material';

import React, { useState } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, TimePicker,LocalizationProvider } from '@mui/x-date-pickers';
import {
  Grid,
  Stack,
  Paper,
  Table,
  Button,
  Select,
  MenuItem,
  TableRow,
  TableCell,
  TableHead,
  InputLabel,
  Typography,
  FormControl,
  TableContainer
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

const UnDeclaredMatch = () => {
  const [team, setTeam] = useState('');
  const [bets, setBets] = useState('All Bets');
  const [fromDate1, setFromDate1] = useState<Dayjs | null>(null);
  const [fromTime1, setFromTime1] = useState<Dayjs | null>(null);
  const [fromDate2, setFromDate2] = useState<Dayjs | null>(null);
  const [fromTime2, setFromTime2] = useState<Dayjs | null>(null);

  const handleTeamChange = (event: SelectChangeEvent) => {
    setTeam(event.target.value as string);
  };

  const handleBetsChange = (event: SelectChangeEvent) => {
    setBets(event.target.value as string);
  };

  const handleSearch = () => {
    // Handle search logic here
    console.log({
      team,
      bets,
      fromDate1,
      fromTime1,
      fromDate2,
      fromTime2
    });
  };

  return (<>
    <Paper sx={{ p: 2, m: 5, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Un Declared Match Bets
      </Typography>

      <Grid container justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {/* Team Select */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Team</InputLabel>
                <Select
                  value={team}
                  label="Select Team"
                  onChange={handleTeamChange}
                >
                  <MenuItem value=""><em>Select</em></MenuItem>
                  <MenuItem value="team1">Team 1</MenuItem>
                  <MenuItem value="team2">Team 2</MenuItem>
                  <MenuItem value="team3">Team 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Bets Select */}
            <Grid item xs={12} md={6} mb={4}>
              <FormControl fullWidth>
                <InputLabel>Bets</InputLabel>
                <Select
                  value={bets}
                  label="Bets"
                  onChange={handleBetsChange}
                >
                  <MenuItem value="All Bets">All Bets</MenuItem>
                  <MenuItem value="Match">Match</MenuItem>
                  <MenuItem value="Session">Session</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* From Date */}
            <Grid item xs={12} md={3}>
              <DatePicker
                label="From Date"
                value={fromDate1}
                onChange={(newValue) => setFromDate1(newValue)}
                format="DD/MM/YY"
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {/* From Time */}
            <Grid item xs={12} md={3}>
              <TimePicker
                label="From Time"
                value={fromTime1}
                onChange={(newValue) => setFromTime1(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {/* To Date */}
            <Grid item xs={12} md={3}>
              <DatePicker
                label="To Date"
                value={fromDate2}
                onChange={(newValue) => setFromDate2(newValue)}
                format="DD/MM/YY"
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {/* To Time */}
            <Grid item xs={12} md={3}>
              <TimePicker
                label="To Time"
                value={fromTime2}
                onChange={(newValue) => setFromTime2(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  sx={{ minWidth: 150 }}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  sx={{ minWidth: 150 }}
                >
                  Match
                </Button>
                <Button
                  variant="outlined"
                  sx={{ minWidth: 150 }}
                >
                  Session
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Grid>
    </Paper>


    <Paper sx={{ p: 2, m: 5, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
      <Grid item xs={12} container justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          color="error"
          style={{ marginRight: '20px' }}
          startIcon={<Iconify icon="eva:trash-2-outline" />}
        >
          Delete
        </Button>
      </Grid>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell align="right">Rate</TableCell>
              <TableCell align="right">Run</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Mode</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
    
        </Table>
      </TableContainer>


    </Paper>
  </>
  );
};

export default UnDeclaredMatch;