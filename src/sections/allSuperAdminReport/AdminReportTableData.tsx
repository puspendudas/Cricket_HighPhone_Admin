import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Grid,
  Paper,
  Table,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  TableContainer,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { Iconify } from 'src/components/iconify';

import { AdminReportModal } from './AdminReportModal';

interface ReportRow {
  superAdmin: string;
  match: number;
  session: number;
  total: number;
  mCom: number;
  sCom: number;
  tCom: number;
  netAmount: number;
  shareAmount: number;
  gTotal: number;
}

interface MatchSummary {
  client_summary: never[];
  _id: string;
  eventName: string;
  createdAt: string;
  user?: {
    name?: string;
    user_name?: string;
    match_commission?: number;
    session_commission?: number;
    immediate_child_admin?: any;
  };
  matchBets: Array<{
    _id: string;
    user_id: string;
    bet_type: string;
    stake_amount: string | number;
    potential_winnings: string | number;
    status: string;
    selection: string;
    immediate_child_admin?: {
      _id: string;
      user_name: string;
      name: string;
      match_commission: number;
      session_commission: number;
      share: number;
    };
    createdAt: string;
  }>;
}

// ------------------ DATA PROCESS LOGIC ------------------

const processAdminReportData = (matches: MatchSummary[]): ReportRow[] => {
  if (!matches || matches.length === 0) return [];

  const adminMap: Record<string, ReportRow> = {};

  matches.forEach((match) => {
    const betsByAdmin: Record<string, any[]> = {};

    match.matchBets.forEach((bet) => {
      const adminId = bet.immediate_child_admin?._id || 'unknown';
      if (!betsByAdmin[adminId]) betsByAdmin[adminId] = [];
      betsByAdmin[adminId].push(bet);
    });

    Object.values(betsByAdmin).forEach((adminBets) => {
      const firstBet = adminBets[0];
      const immediate = firstBet?.immediate_child_admin;
      if (!immediate) return;

      // YAHAN FORMAT UPDATE KARO - Name (username)
      const adminName = immediate.name || 'Unknown';
      const adminUserName = immediate.user_name || 'N/A';
      const displayName = `${adminName} (${adminUserName})`; // Name (username) format
      const adminKey = `${displayName} (${immediate._id})`;

      if (!adminMap[adminKey]) {
        adminMap[adminKey] = {
          superAdmin: displayName, // Yahan formatted name use karo
          match: 0,
          session: 0,
          total: 0,
          mCom: 0,
          sCom: 0,
          tCom: 0,
          netAmount: 0,
          shareAmount: 0,
          gTotal: 0,
        };
      }

      const adminRow = adminMap[adminKey];

      const bookmakerBets = adminBets.filter((b) => b.bet_type === 'BOOKMAKER');
      const fancyBets = adminBets.filter((b) => b.bet_type === 'FANCY');

      const matchPL = bookmakerBets.reduce((acc: number, bet) => {
        const stake = parseFloat(bet.stake_amount as string) || 0;
        const potential = parseFloat(bet.potential_winnings as string) || 0;
        let value = 0;

        if (bet.status === 'WON') {
          if (bet.selection === 'Back') value = potential;
          if (bet.selection === 'Lay') value = stake;
        } else if (bet.status === 'LOST') {
          if (bet.selection === 'Back') value = -stake;
          if (bet.selection === 'Lay') value = -potential;
        }
        return acc + value;
      }, 0);

      const sessionPL = fancyBets.reduce((acc: number, bet) => {
        const stake = parseFloat(bet.stake_amount as string) || 0;
        const potential = parseFloat(bet.potential_winnings as string) || 0;
        let value = 0;

        if (bet.status === 'WON') {
          if (bet.selection === 'Yes') value = potential;
          if (bet.selection === 'Not') value = stake;
        } else if (bet.status === 'LOST') {
          if (bet.selection === 'Yes') value = -stake;
          if (bet.selection === 'Not') value = -potential;
        }
        return acc + value;
      }, 0);

      const invertedMatchPL = matchPL * -1;
      const invertedSessionPL = sessionPL * -1;

      const totalSessionStake = fancyBets.reduce(
        (acc: number, bet) => acc + (parseFloat(bet.stake_amount as string) || 0),
        0
      );


      const matchCommissionRate = immediate?.match_commission || 0;
      const sessionCommissionRate = immediate?.session_commission || 0;
      let matchCommission = 0;
      const clientSummaries = match.client_summary || [];

      clientSummaries.forEach((c: any) => {
        const belongsToThisAdmin = match.matchBets.some(
          (b: any) =>
            b.user_id === c.client_id &&
            b.immediate_child_admin?._id === immediate._id
        );

        if (!belongsToThisAdmin) return;

        if (c.client_net_match_pl < 0) {
          matchCommission +=
            Math.abs(c.client_net_match_pl) *
            (matchCommissionRate / 100);
        }
      });

      const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
      const totalCommission = matchCommission + sessionCommission;

      const total = invertedMatchPL + invertedSessionPL;
      const netAmount = total - totalCommission;
      const sharePercentage = immediate?.share || 0;
      const shareRate = sharePercentage / 100;
      const shareAmount = netAmount * shareRate;
      const grandTotal = netAmount - shareAmount;

      adminRow.match += invertedMatchPL;
      adminRow.session += invertedSessionPL;
      adminRow.total += total;
      adminRow.mCom += matchCommission;
      adminRow.sCom += sessionCommission;
      adminRow.tCom += totalCommission;
      adminRow.netAmount += netAmount;
      adminRow.shareAmount += shareAmount;
      adminRow.gTotal += grandTotal;
    });
  });

  return Object.values(adminMap);
};
// ------------------ MAIN COMPONENT ------------------

export function AdminReportTableData() {
  const [startDate, setStartDate] = React.useState<Dayjs | null>(null);
  const [endDate, setEndDate] = React.useState<Dayjs | null>(null);
  const [selectedAdmin, setSelectedAdmin] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<ReportRow | null>(null);

  const { fetchTotalData } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  const {
    data: tableData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminReportTableData', userId],
    queryFn: () => (userId ? fetchTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId,
    refetchInterval: 3000,
  });

  const allMatches = tableData?.matches || [];

  // ✅ Filter matches based on selected date range
  const filteredMatches = allMatches.filter((match: MatchSummary) => {
    const matchDate = dayjs(match.createdAt);
    if (startDate && matchDate.isBefore(startDate, 'day')) return false;
    if (endDate && matchDate.isAfter(endDate, 'day')) return false;
    return true;
  });

  const processedRows = filteredMatches.length
    ? processAdminReportData(filteredMatches)
    : [];

  const superAdmins = Array.from(new Set(processedRows.map((r) => r.superAdmin)));

  const filteredRows = selectedAdmin
    ? processedRows.filter((r) => r.superAdmin === selectedAdmin)
    : processedRows;

  const handleOpenModal = (row: ReportRow) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  if (isLoading)
    return (
      <Box p={3} textAlign="center">
        <Typography>Loading admin report data...</Typography>
      </Box>
    );

  if (error)
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error loading admin report data</Typography>
      </Box>
    );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slots={{ openPickerIcon: () => <Iconify icon="solar:calendar-bold" width={20} /> }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slots={{ openPickerIcon: () => <Iconify icon="solar:calendar-bold" width={20} /> }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Select Super Admin"
              select
              fullWidth
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
            >
              <MenuItem value="">All Admins</MenuItem>
              {superAdmins.map((admin) => (
                <MenuItem key={admin} value={admin}>
                  {admin}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Super Admin</TableCell>
                <TableCell>Match</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>M. Comm</TableCell>
                <TableCell>S. Comm</TableCell>
                <TableCell>T. Comm</TableCell>
                <TableCell>NET.AMT</TableCell>
                <TableCell>SHR.AMT</TableCell>
                <TableCell>G. Total</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.superAdmin}</TableCell>
                    <TableCell sx={{ color: row.match >= 0 ? 'green' : 'red' }}>
                      ₹{Math.abs(row.match).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: row.session >= 0 ? 'green' : 'red' }}>
                      ₹{Math.abs(row.session).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: row.total >= 0 ? 'green' : 'red' }}>
                      ₹{Math.abs(row.total).toFixed(2)}
                    </TableCell>
                    <TableCell>₹{row.mCom.toFixed(2)}</TableCell>
                    <TableCell>₹{row.sCom.toFixed(2)}</TableCell>
                    <TableCell>₹{row.tCom.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: row.netAmount >= 0 ? 'green' : 'red' }}>
                      ₹{Math.abs(row.netAmount).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: row.shareAmount >= 0 ? 'green' : 'red' }}>
                      ₹{Math.abs(row.shareAmount).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: row.gTotal >= 0 ? 'green' : 'red' }}>
                      ₹{Math.abs(row.gTotal).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenModal(row)}>
                        <Iconify icon="mdi-light:eye" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography>No admin report data available</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <AdminReportModal open={modalOpen} onClose={handleCloseModal} rowData={selectedRow} />
    </LocalizationProvider>
  );
}
