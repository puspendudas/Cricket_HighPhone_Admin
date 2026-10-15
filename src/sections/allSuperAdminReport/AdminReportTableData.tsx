import type { Dayjs } from 'dayjs';

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
  CircularProgress,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { Iconify } from 'src/components/iconify';

import { AdminReportModal } from './AdminReportModal';

export interface ReportRow {
  adminId: string;
  superAdmin: string;
  adminName?: string;
  adminUserName?: string;
  type?: string;
  match: number;
  session: number;
  casino: number;
  toss?: number;
  total: number;
  mCom: number;
  sCom: number;
  cCom: number;
  tCom: number;
  netAmount: number;
  shareAmount: number;
  gTotal: number;
}

export function AdminReportTableData() {
  const [startDate, setStartDate] = React.useState<Dayjs | null>(null);
  const [endDate, setEndDate] = React.useState<Dayjs | null>(null);
  const [selectedAdmin, setSelectedAdmin] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<ReportRow | null>(null);

  const { fetchAdminSuperReport } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  const formattedStartDate = startDate ? startDate.format('YYYY-MM-DD') : undefined;
  const formattedEndDate = endDate ? endDate.format('YYYY-MM-DD') : undefined;

  // Authoritative server-side super admin report calculation
  const {
    data: reportResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminSuperReport', userId, formattedStartDate, formattedEndDate],
    queryFn: () =>
      userId
        ? fetchAdminSuperReport(userId, undefined, formattedStartDate, formattedEndDate)
        : Promise.reject(new Error('Missing user ID')),
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  const processedRows: ReportRow[] =
    reportResponse?.data?.reportRows || reportResponse?.data?.rows || [];

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
        <CircularProgress size={32} sx={{ mb: 1 }} />
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
                <TableCell>Toss</TableCell>
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
                  <TableRow key={`${row.adminId || row.superAdmin}-${index}`}>
                    <TableCell>{row.superAdmin}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: row.match >= 0 ? 'green' : 'red' }}>
                      {row.match >= 0 ? '+' : '-'} ₹{Math.abs(row.match).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: row.session >= 0 ? 'green' : 'red' }}>
                      {row.session >= 0 ? '+' : '-'} ₹{Math.abs(row.session).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: row.casino >= 0 ? 'green' : 'red' }}>
                      {row.casino >= 0 ? '+' : '-'} ₹{Math.abs(row.casino).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: (row.toss || 0) >= 0 ? 'green' : 'red' }}>
                      {(row.toss || 0) >= 0 ? '+' : '-'} ₹{Math.abs(row.toss || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: row.total >= 0 ? 'green' : 'red' }}>
                      {row.total >= 0 ? '+' : '-'} ₹{Math.abs(row.total).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'red' }}>
                      -₹{row.mCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'red' }}>
                      -₹{row.sCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'red' }}>
                      -₹{row.cCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'red' }}>
                      -₹{row.tCom.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: row.netAmount >= 0 ? 'green' : 'red' }}>
                      {row.netAmount >= 0 ? '+' : '-'} ₹{Math.abs(row.netAmount).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: row.shareAmount >= 0 ? 'green' : 'red' }}>
                      {row.shareAmount >= 0 ? '+' : '-'} ₹{Math.abs(row.shareAmount).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: row.gTotal >= 0 ? 'green' : 'red' }}>
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
                  <TableCell colSpan={14} align="center">
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
        startDate={formattedStartDate}
        endDate={formattedEndDate}
      />
    </LocalizationProvider>
  );
}
