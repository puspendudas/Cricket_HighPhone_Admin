import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Dialog,
  Button,
  Select,
  MenuItem,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Pagination,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';
import { getCasinoGameTitle } from 'src/utils/casino';

interface CasinoResultHistoryModalProps {
  open: boolean;
  onClose: () => void;
  gameCode: string;
  onSelectRound?: (roundId: string) => void;
}

export function CasinoResultHistoryModal({
  open,
  onClose,
  gameCode,
  onSelectRound,
}: CasinoResultHistoryModalProps) {
  const { getCasinoResultHistory } = useCasinoApi();
  const todayStr = dayjs().format('YYYY-MM-DD');

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  // Generate list of the past 10 days for selection
  const past10Days = Array.from({ length: 10 }, (_, i) => {
    const d = dayjs().subtract(i, 'day');
    return {
      value: d.format('YYYY-MM-DD'),
      label: i === 0 ? `Today (${d.format('DD MMM')})` : i === 1 ? `Yesterday (${d.format('DD MMM')})` : d.format('DD MMM YYYY'),
    };
  });

  const { data, isLoading } = useQuery({
    queryKey: ['casinoResultHistory', gameCode, selectedDate, page],
    queryFn: () => getCasinoResultHistory(gameCode, selectedDate, page, limit),
    enabled: open && !!gameCode,
    refetchInterval: 15000,
  });

  const results = data?.results || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setPage(1);
  };

  const getWinnerInfo = (row: any, gt?: string) => {
    const gtype = String(gt || row.game_code || '').toLowerCase().trim();
    const raw = String(
      row.winner_name ||
      row.winner ||
      row.result_data?.win ||
      row.winning_selection ||
      row.win ||
      ''
    ).trim();

    const up = raw.toUpperCase();

    // Teenpatti (teen, teen20)
    if (gtype === 'teen' || gtype === 'teen20') {
      if (up === '1' || up === 'A' || up.includes('PLAYER A')) {
        return { label: 'Player A', color: '#EF4444' };
      }
      if (up === '2' || up === 'B' || up.includes('PLAYER B')) {
        return { label: 'Player B', color: '#10B981' };
      }
    }

    // Dragon Tiger (dt20)
    if (gtype === 'dt20') {
      if (up === '1' || up === 'D' || up.includes('DRAGON')) {
        return { label: 'Dragon', color: '#EF4444' };
      }
      if (up === '2' || up === 'T' || up.includes('TIGER')) {
        return { label: 'Tiger', color: '#F59E0B' };
      }
      if (up === '3' || up === 'TIE' || up.includes('TIE')) {
        return { label: 'Tie', color: '#10B981' };
      }
    }

    // Lucky 7 (lucky7eu, lucky7eu2)
    if (gtype === 'lucky7eu' || gtype === 'lucky7eu2') {
      if (up === '1' || up === 'L' || up.includes('LOW')) {
        return { label: 'Low (1-6)', color: '#10B981' };
      }
      if (up === '2' || up === 'H' || up.includes('HIGH')) {
        return { label: 'High (8-K)', color: '#6366F1' };
      }
      if (up === '0' || up === '3' || up === '7' || up === 'T' || up.includes('TIE')) {
        return { label: '7 (Tie)', color: '#F59E0B' };
      }
    }

    // Fallback for custom or manual names
    if (raw) {
      if (up.includes('PLAYER A') || up === 'A') return { label: raw, color: '#EF4444' };
      if (up.includes('PLAYER B') || up === 'B') return { label: raw, color: '#10B981' };
      if (up.includes('DRAGON')) return { label: raw, color: '#EF4444' };
      if (up.includes('TIGER')) return { label: raw, color: '#F59E0B' };
      if (up.includes('TIE')) return { label: raw, color: '#10B981' };
      return { label: raw, color: '#2563EB' };
    }

    return { label: 'Declared', color: '#64748B' };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" component="div">
            {getCasinoGameTitle(gameCode)} — Result History
          </Typography>
          <Typography variant="caption" color="text.secondary">
            View declared results for the last 10 days
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {/* Date Filter Bar */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Select Date (Past 10 Days):
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            {past10Days.map((d) => (
              <Chip
                key={d.value}
                label={d.label}
                color={selectedDate === d.value ? 'primary' : 'default'}
                variant={selectedDate === d.value ? 'filled' : 'outlined'}
                onClick={() => handleDateChange(d.value)}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Results Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Round ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Winner / Outcome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cards</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Declared At</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading results...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : results.length > 0 ? (
                results.map((row: any) => {
                  const winnerInfo = getWinnerInfo(row, gameCode);
                  const roundId = row.round_id || row.mid;
                  return (
                    <TableRow key={row._id || roundId} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {roundId}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={winnerInfo.label}
                          size="small"
                          sx={{
                            bgcolor: winnerInfo.color,
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '12px',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '13px' }}>
                        {row.rdesc || row.desc || '-'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {row.card || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', color: 'text.secondary' }}>
                        {row.declared_at
                          ? dayjs(row.declared_at).format('DD/MM/YYYY HH:mm:ss')
                          : row.createdAt
                          ? dayjs(row.createdAt).format('DD/MM/YYYY HH:mm:ss')
                          : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Iconify icon="eva:eye-outline" />}
                          onClick={() => {
                            if (onSelectRound && roundId) {
                              onSelectRound(String(roundId));
                            }
                          }}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No results found for {selectedDate}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default CasinoResultHistoryModal;
