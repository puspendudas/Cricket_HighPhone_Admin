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
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';

import { Iconify } from 'src/components/iconify';

import { AdminReportModal } from './AdminReportModal';

interface ReportRow {
  superAdmin: string;
  match: number;
  session: number;
  casino: number;
  total: number;
  mCom: number;
  sCom: number;
  cCom: number;
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
    const clientSummaries = match.client_summary || [];

    clientSummaries.forEach((c: any) => {
      const immediate = c.immediate_child_admin;
      if (!immediate) return;

      const adminName = immediate.name || 'Unknown';
      const adminUserName = immediate.user_name || 'N/A';
      const displayName = `${adminName} (${adminUserName})`;
      const adminKey = `${displayName} (${immediate._id})`;

      if (!adminMap[adminKey]) {
        adminMap[adminKey] = {
          superAdmin: displayName,
          match: 0,
          session: 0,
          casino: 0,
          total: 0,
          mCom: 0,
          sCom: 0,
          cCom: 0,
          tCom: 0,
          netAmount: 0,
          shareAmount: 0,
          gTotal: 0,
        };
      }

      const adminRow = adminMap[adminKey];

      const invertedMatchPL = (c.client_net_match_pl || 0) * -1;
      const invertedSessionPL = (c.client_net_session_pl || 0) * -1;
      const invertedCasinoPL = (c.client_net_casino_pl || 0) * -1;

      const totalSessionStake = c.client_total_session_stake || 0;

      const matchCommissionRate = immediate.match_commission || 0;
      const sessionCommissionRate = immediate.session_commission || 0;
      const casinoCommissionRate = immediate.casino_commission || 0;

      let matchCommission = 0;
      if (c.client_net_match_pl < 0) {
        matchCommission = Math.abs(c.client_net_match_pl) * (matchCommissionRate / 100);
      }
      
      const casinoCommission = c.client_total_casino_commission !== undefined
        ? c.client_total_casino_commission
        : (c.client_net_casino_pl < 0 ? Math.abs(c.client_net_casino_pl) * (casinoCommissionRate / 100) : 0);

      const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
      const totalCommission = matchCommission + sessionCommission + casinoCommission;

      const total = invertedMatchPL + invertedSessionPL + invertedCasinoPL;
      const netAmount = total - totalCommission;

      const sharePercentage = immediate.share || 0;
      const shareRate = sharePercentage / 100;
      const shareAmount = netAmount * shareRate;
      const grandTotal = netAmount - shareAmount;

      adminRow.match += invertedMatchPL;
      adminRow.session += invertedSessionPL;
      adminRow.casino += invertedCasinoPL;
      adminRow.total += total;
      adminRow.mCom += matchCommission;
      adminRow.sCom += sessionCommission;
      adminRow.cCom += casinoCommission;
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
  const { fetchCasinoTotalData } = useCasinoApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  const {
    data: tableData,
    isLoading: isCricketLoading,
    error: cricketError,
  } = useQuery({
    queryKey: ['adminReportTableData', userId],
    queryFn: () => (userId ? fetchTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  const {
    data: casinoTableData,
    isLoading: isCasinoLoading,
    error: casinoError,
  } = useQuery({
    queryKey: ['adminReportCasinoTableData', userId],
    queryFn: () => (userId ? fetchCasinoTotalData(userId) : Promise.reject(new Error('Missing user ID'))),
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  const allMatches = [
    ...(tableData?.matches || []),
    ...(casinoTableData?.matches || []),
  ];

  // ✅ Filter matches based on selected date range
  const filteredMatches = allMatches.filter((match: any) => {
    const matchDate = dayjs(match.createdAt || match.eventTime);
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

  if (isCricketLoading || isCasinoLoading)
    return (
      <Box p={3} textAlign="center">
        <Typography>Loading admin report data...</Typography>
      </Box>
    );

  if (cricketError || casinoError)
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
              onChange={(newValue: any) => setStartDate(newValue)}
              slots={{ openPickerIcon: () => <Iconify icon="solar:calendar-bold" width={20} /> }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue: any) => setEndDate(newValue)}
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
              onChange={(e: any) => setSelectedAdmin(e.target.value)}
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
                <TableCell>Casino</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>M. Comm</TableCell>
                <TableCell>S. Comm</TableCell>
                <TableCell>C. Comm</TableCell>
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
                    <TableCell sx={{ whiteSpace: "nowrap", color: row.match >= 0 ? 'green' : 'red' }}>
                      {row.match >= 0 ? '+' : '-'} ₹{Math.abs(row.match).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: row.session >= 0 ? 'green' : 'red' }}>
                      {row.session >= 0 ? '+' : '-'} ₹{Math.abs(row.session).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: row.casino >= 0 ? 'green' : 'red' }}>
                      {row.casino >= 0 ? '+' : '-'} ₹{Math.abs(row.casino).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: row.total >= 0 ? 'green' : 'red' }}>
                      {row.total >= 0 ? '+' : '-'} ₹{Math.abs(row.total).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: 'red' }}>
                      -₹{row.mCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: 'red' }}>
                      -₹{row.sCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: 'red' }}>
                      -₹{row.cCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: 'red' }}>
                      -₹{row.tCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: row.netAmount >= 0 ? 'green' : 'red' }}>
                      {row.netAmount >= 0 ? '+' : '-'} ₹{Math.abs(row.netAmount).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: row.shareAmount >= 0 ? 'green' : 'red' }}>
                      {row.shareAmount >= 0 ? '+' : '-'} ₹{Math.abs(row.shareAmount).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: row.gTotal >= 0 ? 'green' : 'red' }}>
                      {row.gTotal >= 0 ? '+' : '-'} ₹{Math.abs(row.gTotal).toFixed(2)}
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

      <AdminReportModal
        open={modalOpen}
        onClose={handleCloseModal}
        rowData={selectedRow}
        matches={filteredMatches}
      />
    </LocalizationProvider>
  );
}
