import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  Paper,
  Typography,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  Button,
  Stack,
  TablePagination,
} from '@mui/material';

import { formatUTCDateTime12H } from 'src/utils/date';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';

const GAME_OPTIONS = [
  { value: 'all', label: 'All Games' },
  { value: 'dt20', label: 'Dragon Tiger (DT20)' },
  { value: 'teen20', label: '20-20 Teenpatti (TEEN20)' },
  { value: 'teen', label: 'Teenpatti 1-Day (TEEN)' },
  { value: 'lucky7eu', label: 'Lucky 7 (LUCKY7EU)' },
];

export function CasinoCommissionData() {
  const { getAdminCasinoCommissions } = useCasinoApi();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterGame, setFilterGame] = useState('all');

  const { data: resData, isLoading: loading } = useQuery({
    queryKey: [
      'adminCasinoCommissions',
      page,
      rowsPerPage,
      filterStartDate,
      filterEndDate,
      filterGame,
    ],
    queryFn: () =>
      getAdminCasinoCommissions(
        page + 1,
        rowsPerPage,
        filterStartDate,
        filterEndDate,
        filterGame
      ),
    staleTime: 10000,
  });

  const data = resData?.data || [];
  const totalCount = resData?.pagination?.total || 0;

  const handleApplyFilter = () => {
    setPage(0);
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);
    setFilterGame(selectedGame);
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectedGame('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterGame('all');
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalLena = data.reduce(
    (acc: number, row: any) => acc + (row.lena_h?.t_com || row.lena_h?.m_com || 0),
    0
  );
  const totalDena = data.reduce(
    (acc: number, row: any) => acc + (row.dena_h?.t_com || row.dena_h?.m_com || 0),
    0
  );
  const totalNet = totalLena - totalDena;

  return (
    <Box>
      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            type="date"
            label="From Date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            type="date"
            label="To Date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <Select
            size="small"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {GAME_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          <Button variant="contained" color="primary" onClick={handleApplyFilter}>
            Filter
          </Button>
          {(startDate || endDate || selectedGame !== 'all') && (
            <Button variant="outlined" color="inherit" onClick={handleResetFilter}>
              Reset
            </Button>
          )}
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <Typography variant="body1" color="textSecondary">
            No casino commission settlements found for the selected filter.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f4f6f8' }}>
                <TableCell><strong>Date & Time</strong></TableCell>
                <TableCell><strong>Game & Round</strong></TableCell>
                <TableCell><strong>Client / User</strong></TableCell>
                <TableCell align="right"><strong>User Loss (P&L)</strong></TableCell>
                <TableCell align="right"><strong>Mila Hai (Lena)</strong></TableCell>
                <TableCell align="right"><strong>Dena Hai</strong></TableCell>
                <TableCell align="right"><strong>Net Commission</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row: any, i: number) => {
                const lena = row.lena_h?.t_com || row.lena_h?.m_com || 0;
                const dena = row.dena_h?.t_com || row.dena_h?.m_com || 0;
                const net = lena - dena;
                const userLoss = row.calculations?.net_pl !== undefined ? Math.abs(row.calculations.net_pl) : 0;
                const gameName = (row.game_code || '').toUpperCase();

                return (
                  <TableRow key={row._id || i} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatUTCDateTime12H(row.settled_at || row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {gameName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {row.round_id || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {row.user_id?.user_name || 'User'}
                      </Typography>
                      {row.user_id?.name && (
                        <Typography variant="caption" color="textSecondary">
                          {row.user_id.name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'red', fontWeight: 'bold' }}>
                      -₹{userLoss.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'green', fontWeight: 'bold' }}>
                      +₹{lena.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: dena > 0 ? 'red' : 'inherit', fontWeight: 'bold' }}>
                      {dena > 0 ? `-₹${dena.toFixed(2)}` : '₹0.00'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: net >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {net >= 0 ? `+₹${net.toFixed(2)}` : `-₹${Math.abs(net).toFixed(2)}`}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Summary Row */}
              <TableRow sx={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e0e0e0' }}>
                <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                  Total Page Summary:
                </TableCell>
                <TableCell align="right" sx={{ color: 'green', fontWeight: 'bold' }}>
                  +₹{totalLena.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ color: totalDena > 0 ? 'red' : 'inherit', fontWeight: 'bold' }}>
                  {totalDena > 0 ? `-₹${totalDena.toFixed(2)}` : '₹0.00'}
                </TableCell>
                <TableCell align="right" sx={{ color: totalNet >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                  {totalNet >= 0 ? `+₹${totalNet.toFixed(2)}` : `-₹${Math.abs(totalNet).toFixed(2)}`}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}
    </Box>
  );
}

export default CasinoCommissionData;
