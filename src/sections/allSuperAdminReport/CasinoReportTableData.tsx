import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';

export function CasinoReportTableData() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAdminCasinoReports } = useCasinoApi();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const reports = await getAdminCasinoReports();
      setData(reports || []);
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body1">No casino reports found.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f4f6f8' }}>
            <TableCell><strong>Game</strong></TableCell>
            <TableCell align="right"><strong>Total Bets</strong></TableCell>
            <TableCell align="right"><strong>Pending Bets</strong></TableCell>
            <TableCell align="right"><strong>Total Stake</strong></TableCell>
            <TableCell align="right"><strong>Total P&L</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row._id} hover>
              <TableCell sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{row._id}</TableCell>
              <TableCell align="right">{row.total_bets}</TableCell>
              <TableCell align="right">{row.pending_bets}</TableCell>
              <TableCell align="right">{row.total_stake?.toFixed(2)}</TableCell>
              <TableCell align="right" sx={{ color: row.total_pl < 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                {row.total_pl > 0 ? '+' : ''}{row.total_pl?.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
