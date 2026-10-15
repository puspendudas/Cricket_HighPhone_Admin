import React from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Grid,
  Modal,
  Table,
  Paper,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { formatUTCDateTime12H } from 'src/utils/date';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { Iconify } from 'src/components/iconify';

import type { ReportRow } from './AdminReportTableData';

interface AdminReportModalProps {
  open: boolean;
  onClose: () => void;
  rowData: ReportRow | null;
  startDate?: string;
  endDate?: string;
}

export function AdminReportModal({
  open,
  onClose,
  rowData,
  startDate,
  endDate,
}: AdminReportModalProps) {
  const { fetchAdminSuperReport } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const userId = userData?.data?._id;
  const childAdminId = rowData?.adminId;

  // Authoritative server-side super report child drill-down query
  const { data: modalResponse, isLoading } = useQuery({
    queryKey: ['adminSuperReportModal', userId, childAdminId, startDate, endDate],
    queryFn: () =>
      userId && childAdminId
        ? fetchAdminSuperReport(userId, childAdminId, startDate, endDate)
        : Promise.reject(new Error('Missing params')),
    enabled: !!userId && !!childAdminId && open,
  });

  const ledgerData: any[] = modalResponse?.data?.entries || [];

  if (!rowData) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          minWidth: '92%',
          maxWidth: '96%',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Child Match & Game Report for {rowData.superAdmin}</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Box>

        {/* Top Summary Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Match PL
              </Typography>
              <Typography variant="body2" sx={{ color: rowData.match >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.match >= 0 ? '+' : '-'}₹{Math.abs(rowData.match).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Session PL
              </Typography>
              <Typography variant="body2" sx={{ color: rowData.session >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.session >= 0 ? '+' : '-'}₹{Math.abs(rowData.session).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Casino PL
              </Typography>
              <Typography variant="body2" sx={{ color: (rowData.casino || 0) >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {(rowData.casino || 0) >= 0 ? '+' : '-'}₹{Math.abs(rowData.casino || 0).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Toss PL
              </Typography>
              <Typography variant="body2" sx={{ color: (rowData.toss || 0) >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {(rowData.toss || 0) >= 0 ? '+' : '-'}₹{Math.abs(rowData.toss || 0).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Total Comm
              </Typography>
              <Typography variant="body2" sx={{ color: 'red', fontWeight: 'bold' }}>
                -₹{rowData.tCom.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Net Amount
              </Typography>
              <Typography variant="body2" sx={{ color: rowData.netAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.netAmount >= 0 ? '+' : '-'}₹{Math.abs(rowData.netAmount).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f9fafb' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Share Amount
              </Typography>
              <Typography variant="body2" sx={{ color: rowData.shareAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.shareAmount >= 0 ? '+' : '-'}₹{Math.abs(rowData.shareAmount).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4} md={1.5}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                Grand Total
              </Typography>
              <Typography variant="body1" sx={{ color: rowData.gTotal >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {rowData.gTotal >= 0 ? '+' : '-'}₹{Math.abs(rowData.gTotal).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          sx={{
            overflowX: 'auto',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            borderRadius: '10px',
          }}
        >
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Event / Match Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Match</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Session</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Casino</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Toss</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>M. Comm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>S. Comm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>C. Comm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>T. Comm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>NET. AMT</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SHR. AMT</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>G. Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Event Time</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={14} align="center">
                    <Box py={3} display="flex" justifyContent="center" alignItems="center" gap={1}>
                      <CircularProgress size={24} />
                      <Typography>Loading child match details...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : ledgerData.length > 0 ? (
                ledgerData.map((entry, index) => (
                  <TableRow key={`${entry.id || entry.matchId || index}-${index}`} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {entry.matchName}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: entry.matchPL >= 0 ? 'green' : 'red',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.matchPL >= 0
                        ? `+₹${entry.matchPL.toFixed(2)}`
                        : `-₹${Math.abs(entry.matchPL).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.sessionPL >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.sessionPL >= 0
                        ? `+₹${entry.sessionPL.toFixed(2)}`
                        : `-₹${Math.abs(entry.sessionPL).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: entry.casinoPL >= 0 ? 'green' : 'red',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.casinoPL >= 0
                        ? `+₹${entry.casinoPL.toFixed(2)}`
                        : `-₹${Math.abs(entry.casinoPL).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: (entry.tossPL || 0) >= 0 ? 'green' : 'red',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {(entry.tossPL || 0) >= 0
                        ? `+₹${(entry.tossPL || 0).toFixed(2)}`
                        : `-₹${Math.abs(entry.tossPL || 0).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.totalPL >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.totalPL >= 0
                        ? `+₹${entry.totalPL.toFixed(2)}`
                        : `-₹${Math.abs(entry.totalPL).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'red' }}>
                      -₹{entry.matchCommission.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'red' }}>
                      -₹{entry.sessionCommission.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'red' }}>
                      -₹{entry.casinoCommission.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'red' }}>
                      -₹{entry.totalCommission.toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.netAmount >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.netAmount >= 0
                        ? `+₹${entry.netAmount.toFixed(2)}`
                        : `-₹${Math.abs(entry.netAmount).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.shareAmount >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.shareAmount >= 0
                        ? `+₹${entry.shareAmount.toFixed(2)}`
                        : `-₹${Math.abs(entry.shareAmount).toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      sx={{ color: entry.grandTotal >= 0 ? 'green' : 'red', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      {entry.grandTotal >= 0
                        ? `+₹${entry.grandTotal.toFixed(2)}`
                        : `-₹${Math.abs(entry.grandTotal).toFixed(2)}`}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" color="textSecondary">
                        {formatUTCDateTime12H(entry.date)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={14} align="center">
                    <Typography py={2}>No child match data available for this admin</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Modal>
  );
}
