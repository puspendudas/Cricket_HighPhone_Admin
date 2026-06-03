import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

const CommissionHistoryView = ({ client, onBack }: { client: { id: string, name: string }, onBack: () => void }) => {
  const { fetchCommissionHistory } = useMatchApi();
  
  const { data: historyData } = useQuery({
    queryKey: ['commissionHistory', client.id],
    queryFn: () => fetchCommissionHistory(client.id),
    enabled: !!client.id,
  });

  const historyList = historyData?.data || [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const date = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours || 12;
    const strTime = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    return `${date} ${strTime}`;
  };

  const formatValue = (val: number) => {
    if (!val) return '0.00';
    return Math.abs(val).toFixed(2);
  };

  const renderCell = (val: number, isDena = false) => (
    <Typography variant="body2" sx={{ color: isDena ? 'red' : 'green', fontWeight: 'bold' }}>
      {formatValue(val)}
    </Typography>
  );

  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid #eee' }}>
        <Typography variant="h6">
          Commission Len Den History
        </Typography>
        <Button variant="outlined" size="small" onClick={onBack}>
          Back
        </Button>
      </Box>

      <Paper elevation={0} sx={{ overflowX: 'auto', borderRadius: 0, border: '1px solid #e0e0e0' }}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>M Comm</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>S Comm</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>C Comm</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Total Comm</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Done By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historyList.map((row: any, i: number) => {
              const mComm = row.lena_h?.m_com || 0;
              const sComm = row.lena_h?.s_com || 0;
              const tComm = row.lena_h?.t_com || 0;
              
              return (
                <TableRow key={row._id || i} hover>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                    {formatDate(row.settled_at)}
                  </TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(mComm, false)}</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(sComm, false)}</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(0, false)}</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(tComm, false)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Comm Submitted For {client.name}
                  </TableCell>
                </TableRow>
              );
            })}
            {historyList.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">No history found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

const ClientMatchCommissionView = ({ 
  agentId, 
  client, 
  startDate, 
  endDate, 
  onBack 
}: { 
  agentId: string, 
  client: { id: string, name: string }, 
  startDate: string, 
  endDate: string, 
  onBack: () => void 
}) => {
  const { fetchCommissionMatches } = useMatchApi();
  
  const { data: matchesData } = useQuery({
    queryKey: ['commissionMatches', agentId, startDate, endDate, client.id],
    queryFn: () => fetchCommissionMatches(agentId, startDate, endDate, client.id),
    enabled: !!agentId && !!client.id,
  });

  const matchList = matchesData?.data || [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
  };

  const formatValue = (val: number) => {
    if (!val) return '0.00';
    return Math.abs(val).toFixed(2);
  };

  const renderCell = (val: number, isDena = false) => (
    <Typography variant="body2" sx={{ color: isDena ? 'red' : 'green' }}>
      {formatValue(val)}
    </Typography>
  );

  const totalMila = { m: 0, s: 0, c: 0, t: 0 };
  const totalDena = { m: 0, s: 0, c: 0, t: 0 };

  matchList.forEach((row: any) => {
    totalMila.m += row.match_lena || 0;
    totalMila.s += row.session_lena || 0;
    totalMila.t += row.total_lena || 0;
    
    totalDena.m += row.match_dena || 0;
    totalDena.s += row.session_dena || 0;
    totalDena.t += row.total_dena || 0;
  });

  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid #eee' }}>
        <Typography variant="h6">
          {client.name} - Match Wise Commission
        </Typography>
        <Button variant="outlined" size="small" onClick={onBack}>
          Back
        </Button>
      </Box>

      <Paper elevation={0} sx={{ overflowX: 'auto', borderRadius: 0, border: '1px solid #e0e0e0' }}>
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>Date</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>Name</TableCell>
              <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0', bgcolor: '#3b4248', color: 'white' }}>MILA HAI</TableCell>
              <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', bgcolor: '#3b4248', color: 'white' }}>DENA HAI</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>M.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>S.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>C.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>T.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>M.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>S.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>C.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>T.Comm.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matchList.map((row: any, i: number) => (
              <TableRow key={row.match_id || i} hover>
                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{formatDate(row.event_time)}</TableCell>
                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{row.event_name}</TableCell>
                
                {/* MILA HAI */}
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.match_lena, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.session_lena, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(0, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>{renderCell(row.total_lena, false)}</TableCell>

                {/* DENA HAI */}
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.match_dena, true)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.session_dena, true)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(0, true)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{renderCell(row.total_dena, true)}</TableCell>
              </TableRow>
            ))}
            
            {matchList.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">No match commission found</Typography>
                </TableCell>
              </TableRow>
            )}

            {matchList.length > 0 && (
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0', bgcolor: '#3b4248', color: 'white' }}>Total</TableCell>
                
                {/* MILA HAI TOTALS */}
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalMila.m, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalMila.s, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalMila.c, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>{renderCell(totalMila.t, false)}</TableCell>

                {/* DENA HAI TOTALS */}
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalDena.m, true)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalDena.s, true)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalDena.c, true)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{renderCell(totalDena.t, true)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export function AllCommissionData() {
  const { fetchMe } = useMeApi();
  const { fetchCommissionClients, settleAgentCommission } = useMatchApi();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [viewingHistoryFor, setViewingHistoryFor] = useState<{ id: string, name: string } | null>(null);
  const [viewingMatchCommissionFor, setViewingMatchCommissionFor] = useState<{ id: string, name: string } | null>(null);

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  const agentId = userData?.data?._id;

  const { data: commissionData, refetch } = useQuery({
    queryKey: ['commissionClients', agentId, startDate, endDate],
    queryFn: () => fetchCommissionClients(agentId, startDate, endDate),
    enabled: !!agentId,
  });

  const handleReset = async (clientId: string) => {
    if (!agentId) return;
    try {
      await settleAgentCommission({ agentId, userId: clientId });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleHistory = (clientId: string, clientName: string) => {
    setViewingHistoryFor({ id: clientId, name: clientName });
  };

  const clients = commissionData?.data || [];
  
  // filtering if selectedClient !== 'all'
  const filteredClients = selectedClient === 'all' 
    ? clients 
    : clients.filter((c: any) => c.user_id === selectedClient);

  // Totals
  const totalMilaHai = {
    mComm: 0, sComm: 0, cComm: 0, tComm: 0
  };
  const totalDenaHai = {
    mComm: 0, sComm: 0, cComm: 0, tComm: 0
  };

  filteredClients.forEach((row: any) => {
    totalMilaHai.mComm += row.match_lena || 0;
    totalMilaHai.sComm += row.session_lena || 0;
    totalMilaHai.cComm += 0;
    totalMilaHai.tComm += row.total_lena || 0;

    totalDenaHai.mComm += row.match_dena || 0;
    totalDenaHai.sComm += row.session_dena || 0;
    totalDenaHai.cComm += 0;
    totalDenaHai.tComm += row.total_dena || 0;
  });

  const formatValue = (val: number) => {
    if (!val) return '0.00';
    return Math.abs(val).toFixed(2);
  };

  const renderCell = (val: number, isDena = false, isBold = false) => (
    <Typography variant="body2" sx={{ color: isDena ? 'red' : 'green', fontWeight: isBold ? 'bold' : 'normal' }}>
      {formatValue(val)}
    </Typography>
  );

  const renderHeader = () => (
    <Box sx={{ mb: 3 }}>
      {/* <Box sx={{ p: 2, textAlign: 'center', mb: 2 }}>
        <Typography variant="h5" color="text.primary">
          कमीशन लेन देन
        </Typography>
      </Box> */}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <Typography variant="body2" mb={0.5}>Start Date</Typography>
          <TextField
            type="date"
            fullWidth
            size="small"
            value={startDate}
            onChange={(e: any) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <Typography variant="body2" mb={0.5}>End Date</Typography>
          <TextField
            type="date"
            fullWidth
            size="small"
            value={endDate}
            onChange={(e: any) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Select
          fullWidth
          size="small"
          value={selectedClient}
          onChange={(e: any) => setSelectedClient(e.target.value)}
          sx={{ bgcolor: 'white' }}
        >
          <MenuItem value="all">All Client</MenuItem>
          {clients.map((c: any) => (
            <MenuItem key={c.user_id} value={c.user_id}>
              {c.name || c.user_name} ({c.user_name})
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );

  if (viewingHistoryFor) {
    return <CommissionHistoryView client={viewingHistoryFor} onBack={() => setViewingHistoryFor(null)} />;
  }

  if (viewingMatchCommissionFor && agentId) {
    return (
      <ClientMatchCommissionView 
        agentId={agentId}
        client={viewingMatchCommissionFor}
        startDate={startDate}
        endDate={endDate}
        onBack={() => setViewingMatchCommissionFor(null)} 
      />
    );
  }

  return (
    <>
      {renderHeader()}
      <Paper elevation={0} sx={{ overflowX: 'auto', borderRadius: 0, border: '1px solid #e0e0e0' }}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }} />
              <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', py: 1.5 }}>
                MILA HAI
              </TableCell>
              <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0', py: 1.5 }}>
                DENA HAI
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0', py: 1.5 }}>Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>M.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>S.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>C.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>T.Comm.</TableCell>
              
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>M.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>S.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>C.Comm.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>T.Comm.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.map((row: any) => (
              <TableRow key={row.user_id} hover>
                <TableCell sx={{ borderRight: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => setViewingMatchCommissionFor({ id: row.user_id, name: row.name || row.user_name })}
                  >
                    {row?.name || row?.user_name} ({row?.user_name})
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Button 
                      variant="contained" 
                      color="warning"
                      sx={{ py: 0.25, px: 1, fontSize: '0.75rem', minWidth: '60px', textTransform: 'none' }}
                      onClick={() => handleReset(row.user_id)}
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="contained" 
                      color="info" 
                      sx={{ py: 0.25, px: 1, fontSize: '0.75rem', minWidth: '60px', textTransform: 'none' }}
                      onClick={() => handleHistory(row.user_id, row.name || row.user_name)}
                    >
                      History
                    </Button>
                  </Box>
                </TableCell>
                
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.match_lena, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.session_lena, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(0, false)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.total_lena, false, true)}</TableCell>
                
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.match_dena, true)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(row.session_dena, true)}</TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(0, true)}</TableCell>
                <TableCell align="center">{renderCell(row.total_dena, true, true)}</TableCell>
              </TableRow>
            ))}
            
            <TableRow>
              <TableCell align="right" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0', py: 2 }}>Total</TableCell>
              
              <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalMilaHai.mComm, false)}</TableCell>
              <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalMilaHai.sComm, false)}</TableCell>
              <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalMilaHai.cComm, false)}</TableCell>
              <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalMilaHai.tComm, false)}</TableCell>
              
              <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalDenaHai.mComm, true)}</TableCell>
              <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalDenaHai.sComm, true)}</TableCell>
              <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>{renderCell(totalDenaHai.cComm, true)}</TableCell>
              <TableCell align="center">{renderCell(totalDenaHai.tComm, true)}</TableCell>
            </TableRow>
            
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}