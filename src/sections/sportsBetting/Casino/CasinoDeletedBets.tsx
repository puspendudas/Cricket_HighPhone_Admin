import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  TableRow,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CardContent,
  useMediaQuery,
  TableContainer,
  TablePagination,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';
import { Iconify } from 'src/components/iconify';
import { formatUTCDateTime12H } from 'src/utils/date';
import { getCasinoGameTitle } from 'src/utils/casino';

interface CasinoDeletedBetRow {
  _id: string;
  client?: string;
  userName?: string;
  userFullName?: string;
  amount: number;
  rate: number;
  selection: string;
  round_id?: string;
  mode?: string;
  createdAt: string;
  status?: string;
  result?: string;
  pnl?: number;
}

export default function CasinoDeletedBets() {
  const { gameId, gameCode } = useParams<{ gameId?: string; gameCode?: string }>();
  const gtype = (gameCode || gameId || 'teen20').toLowerCase();
  const gameTitle = getCasinoGameTitle(gtype);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { fetchMe } = useMeApi();
  const { getAdminGameBets } = useCasinoApi();

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;

  // Fetch admin game bets
  const {
    data: gameBetsData,
    isLoading: isBetsLoading,
    isError,
  } = useQuery({
    queryKey: ['adminGameBets', userId, gtype],
    queryFn: () => getAdminGameBets(gtype),
    enabled: !!userId && !!gtype,
  });

  // Filter only DELETED casino bets
  const deletedBetsList: CasinoDeletedBetRow[] = useMemo(() => {
    const rawBets = gameBetsData?.bets || [];
    return rawBets.filter(
      (b: any) => (b.status || '').toUpperCase() === 'DELETED' || (b.status || '').toUpperCase() === 'CANCELLED'
    );
  }, [gameBetsData]);

  const paginatedBets = useMemo(() => {
    const start = page * rowsPerPage;
    return deletedBetsList.slice(start, start + rowsPerPage);
  }, [deletedBetsList, page, rowsPerPage]);

  const renderTable = () => (
    <>
      <TableContainer sx={{ maxHeight: 520, overflowX: 'auto' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Round ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Selection / Rate</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isBetsLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Loading deleted bets...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'error.main' }}>
                  Failed to load deleted bets
                </TableCell>
              </TableRow>
            ) : paginatedBets.length > 0 ? (
              paginatedBets.map((row, index) => (
                <TableRow key={row._id || `${row.client}-${index}`} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {row.client || row.userName || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {row.round_id || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.4,
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor:
                          row.mode === 'K' || row.selection?.toLowerCase().includes('lay')
                            ? '#fda4b4'
                            : '#83c2fc',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          mr: 0.8,
                          color: '#000',
                        }}
                      >
                        {row.selection || '-'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          background: '#fff',
                          borderRadius: '20px',
                          color: '#000',
                          padding: '1px 8px',
                          fontSize: '0.8rem',
                        }}
                      >
                        {Number(row.rate || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>₹{Number(row.amount || 0).toLocaleString()}</TableCell>
                  <TableCell>{row.createdAt ? formatUTCDateTime12H(row.createdAt) : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label="DELETED"
                      size="small"
                      color="error"
                      variant="filled"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No deleted bets found for {gameTitle}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!isBetsLoading && !isError && deletedBetsList.length > 0 && (
        <TablePagination
          component="div"
          count={deletedBetsList.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}
    </>
  );

  return (
    <Box p={isMobile ? 1 : 2}>
      {/* Header Card */}
      <Card sx={{ mb: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
        <CardContent
          sx={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #26B8A4 0%, #1a7c6d 100%)',
            height: '110px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {gameTitle}
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Deleted Bets History
          </Typography>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)' }}>
            <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="material-symbols:delete-outline" width={24} />
                  Deleted Bets ({deletedBetsList.length})
                </Typography>
              </Box>
              {renderTable()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
