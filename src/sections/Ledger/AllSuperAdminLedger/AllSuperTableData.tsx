import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Grid,
  Paper,
  Table,
  Button,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  IconButton
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { Iconify } from 'src/components/iconify';

import SettlementModal from './SettlementModal';

// Interfaces define karo
interface Bet {
  _id?: string;
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
}

interface MatchSummary {
  _id: string;
  eventName: string;
  matchBets: Bet[];
}

interface SettlementData {
  _id: string;
  adminIdTo: {
    _id: string;
    user_name: string;
    name: string;
  };
  adminIdFrom: {
    _id: string;
    user_name: string;
  };
  ammount: number;
  type: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ViewStackItem {
  adminId: string;
  clientName: string;
  level: number;
}

// ChildTableData ka final balance get karne wala hook - MULTIPLE ADMINS SUPPORT
const useChildTableFinalBalance = (targetUserId?: string) => {
  const { fetchTotalData, fetchSettlement } = useMatchApi();
  const { fetchMe } = useMeApi();

  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchMe,
  });

  // Use targetUserId if provided, otherwise use current user's ID
  const userId = targetUserId || userData?.data?._id;

  // Fetch table data directly
  const { data: tableData } = useQuery({
    queryKey: ['ledgerTableData', userId],
    queryFn: () =>
      userId
        ? fetchTotalData(userId)
        : Promise.reject(new Error('Missing user ID')),
    enabled: !!userId,
  });

  // Fetch settlement data using userId
  const { data: settlementData } = useQuery({
    queryKey: ['childSettlementData', userId],
    queryFn: () =>
      userId
        ? fetchSettlement(userId)
        : Promise.reject(new Error('Missing user ID')),
    enabled: !!userId,
    refetchInterval: 3000,
  });

  // Calculate total settled amount for EACH admin
  const calculateSettledAmountByAdmin = (settlements: SettlementData[]): Record<string, number> => {
    if (!settlements || settlements.length === 0) return {};

    const settledByAdmin: Record<string, number> = {};

    settlements.forEach((settlement) => {
      const adminId = settlement.adminIdTo?._id;
      if (!adminId) return;

      if (!settledByAdmin[adminId]) {
        settledByAdmin[adminId] = 0;
      }

      if (settlement.type === 'debit') {
        settledByAdmin[adminId] -= Math.abs(settlement.ammount);
      } else if (settlement.type === 'credit') {
        settledByAdmin[adminId] += Math.abs(settlement.ammount);
      }
    });

    return settledByAdmin;
  };

  const settledAmountByAdmin = settlementData?.data
    ? calculateSettledAmountByAdmin(settlementData.data)
    : {};

  // Get ALL unique immediate_child_admins from table data
  const getAllImmediateChildAdmins = () => {
    if (!tableData?.matches || tableData.matches.length === 0) return [];

    const allAdmins: Record<string, any> = {};

    tableData.matches.forEach((match: MatchSummary) => {
      match.matchBets?.forEach((bet: Bet) => {
        const immediate = bet.immediate_child_admin;
        if (immediate && immediate._id) {
          if (!allAdmins[immediate._id]) {
            allAdmins[immediate._id] = {
              ...immediate,
              user_name: immediate.user_name || 'S1(SUPERADMIN)',
              name: immediate.name || immediate.user_name
            };
          }
        }
      });
    });

    return Object.values(allAdmins);
  };

  const allImmediateChildAdmins = getAllImmediateChildAdmins();

  // Process ledger data and get final balance for EACH admin
  const getFinalBalanceByAdmin = (matches: MatchSummary[]) => {
    if (!matches || matches.length === 0) return {};

    const balanceByAdmin: Record<string, number> = {};

    matches.forEach((match: MatchSummary) => {
      const betsByAdmin: Record<string, Bet[]> = {};

      match.matchBets.forEach((bet: Bet) => {
        const adminId = bet.immediate_child_admin?._id || 'unknown';
        if (!betsByAdmin[adminId]) betsByAdmin[adminId] = [];
        betsByAdmin[adminId].push(bet);
      });

      Object.entries(betsByAdmin).forEach(([adminId, adminBets]) => {
        if (!balanceByAdmin[adminId]) {
          balanceByAdmin[adminId] = 0;
        }

        const firstBet = adminBets[0];

        const bookmakerBets = adminBets.filter((b) => b.bet_type === 'BOOKMAKER');
        const fancyBets = adminBets.filter((b) => b.bet_type === 'FANCY');

        const matchPL = bookmakerBets.reduce((acc: number, bet: Bet) => {
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

        const sessionPL = fancyBets.reduce((acc: number, bet: Bet) => {
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
          (acc: number, bet: Bet) => acc + (parseFloat(bet.stake_amount as string) || 0),
          0
        );

        // const userBookmakerLosses = bookmakerBets.reduce((acc: number, bet: Bet) => {
        //   const stake = parseFloat(bet.stake_amount as string) || 0;
        //   const potential = parseFloat(bet.potential_winnings as string) || 0;
        //   let loss = 0;
        //   if (bet.status === 'LOST') {
        //     if (bet.selection === 'Back') loss = stake;
        //     if (bet.selection === 'Lay') loss = potential;
        //   }
        //   return acc + loss;
        // }, 0);

        const immediate = firstBet?.immediate_child_admin;
        const matchCommissionRate = immediate?.match_commission || 0;
        const sessionCommissionRate = immediate?.session_commission || 0;
        // ---------------- MATCH COMMISSION (FROM client_summary) ----------------
        let matchCommission = 0;

        const clientSummaries = (match as any).client_summary || [];

        clientSummaries.forEach((c: any) => {
          // 🔑 ye client isi admin ka hona chahiye
          const belongsToThisAdmin = match.matchBets.some(
            (b: any) =>
              b.user_id === c.client_id &&
              b.immediate_child_admin?._id === adminId
          );

          if (!belongsToThisAdmin) return;

          const clientMatchPL = c.client_net_match_pl || 0;

          // ✅ sirf LOSS pe commission
          if (clientMatchPL < 0) {
            matchCommission +=
              Math.abs(clientMatchPL) * (matchCommissionRate / 100);
          }
        });
        const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
        const totalCommission = matchCommission + sessionCommission;

        const netAmount = invertedMatchPL + invertedSessionPL - totalCommission;
        const share = immediate?.share ?? 0;
        const shareAmount = netAmount * (share / 100);
        const grandTotal = netAmount - shareAmount;

        balanceByAdmin[adminId] += grandTotal;
      });
    });

    return balanceByAdmin;
  };

  const finalBalanceByAdmin = tableData?.matches
    ? getFinalBalanceByAdmin(tableData.matches)
    : {};

  // Combine all data for each admin
  const getAllAdminData = () => allImmediateChildAdmins.map(admin => ({
    adminId: admin._id,
    clientUserName: admin.user_name,
    clientName: admin.name,
    finalBalance: finalBalanceByAdmin[admin._id] || 0,
    settledAmount: settledAmountByAdmin[admin._id] || 0,
    immediateChildAdmin: admin
  }));

  const allAdminData = getAllAdminData();

  return {
    allAdminData, // This will contain data for ALL admins
    currentUserId: userId, // Current user ID being used
    isViewingClient: !!targetUserId, // Flag to indicate if viewing a client
    userType: userData?.data?.type || ''
  };
};

export function AllSuperTableData() {
  const [openModal, setOpenModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [viewStack, setViewStack] = useState<ViewStackItem[]>([]);

  // Current view - stack ke last item se
  const currentView = viewStack.length > 0 ? viewStack[viewStack.length - 1] : null;

  // Multiple admins ka data le rahe hain - ab target userId pass kar sakte hain
  const { allAdminData, userType } = useChildTableFinalBalance(currentView?.adminId);

  // Calculate final amount based on debit/credit for each admin
  const calculateFinalAmount = (amount: number, settled: number) => amount - settled;



  // Prepare receiving and paid data for ALL admins
  const receivingData = allAdminData
    .filter(admin => admin.finalBalance > 0 && admin.settledAmount >= 0)
    .map(admin => ({
      client: admin.clientUserName,
      clientName: admin.clientName,
      amount: admin.finalBalance,
      settled: admin.settledAmount,
      final: calculateFinalAmount(admin.finalBalance, admin.settledAmount),
      immediate_child_admin: admin.immediateChildAdmin,
      adminId: admin.adminId
    }));

  // PAYMENT PAID TO (DENA HAI)
  const paidData = allAdminData
    .filter(admin => admin.finalBalance < 0 || admin.settledAmount < 0)
    .map(admin => ({
      client: admin.clientUserName,
      clientName: admin.clientName,
      amount: admin.finalBalance,
      settled: admin.settledAmount,
      final: calculateFinalAmount(admin.finalBalance, admin.settledAmount),
      immediate_child_admin: admin.immediateChildAdmin,
      adminId: admin.adminId
    }));

  const getTotal = (data: any[], key: 'amount' | 'settled' | 'final') =>
    data.reduce((sum, row) => sum + row[key], 0);

  const formatValue = (value: number, isCurrency = false) => {
    if (value === 0) return isCurrency ? '₹0.00' : '0.00';

    const absValue = Math.abs(value);
    const fixedValue = absValue.toFixed(2);

    const formatted = isCurrency
      ? `₹${Number(fixedValue).toLocaleString()}`
      : fixedValue;

    return value < 0 ? `-${formatted}` : formatted;
  };


  const handleSettlementClick = (client: any, type: 'PAYMENT_RECEIVING_FROM' | 'PAYMENT_PAID_TO') => {
    setSelectedClient({ ...client, type });
    setOpenModal(true);
  };

  const handleClientClick = (client: any) => {
    const newView: ViewStackItem = {
      adminId: client.adminId,
      clientName: client.clientName || client.client,
      level: viewStack.length
    };
    setViewStack(prev => [...prev, newView]);
  };

  const handleBackClick = () => {
    if (viewStack.length > 0) {
      setViewStack(prev => prev.slice(0, -1));
    }
  };




  const handleClose = () => {
    setOpenModal(false);
    setSelectedClient(null);
  };

  const renderTable = (title: string, data: any[], isPositive?: boolean) => (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 3,
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        width: '100%',
        overflowX: { xs: 'auto', sm: 'hidden' },
      }}
    >
      <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
        {title}
      </Typography>

      <Box sx={{ width: '100%', minWidth: { xs: '700px', sm: '100%' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Client</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Amount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Settled</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Final</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={`${row.adminId}-${i}`}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
                onClick={() => {
                  if (userType !== 'agent') {
                    handleClientClick(row);
                  }
                }}

              >
                <TableCell
                  sx={{
                    color: 'primary.main',
                    fontWeight: 500,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {row.clientName || row.client}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.client}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ color: row.amount < 0 ? 'red' : 'green', fontWeight: 500 }}
                >
                  {formatValue(row.amount, true)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: row.settled < 0 ? 'red' : 'green',
                    fontWeight: 500
                  }}
                >
                  {formatValue(row.settled, true)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: row.final < 0 ? 'red' : 'green', fontWeight: 500 }}
                >
                  {formatValue(row.final, true)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    color='primary'
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click event
                      handleSettlementClick(
                        row,
                        title === 'PAYMENT RECEIVING FROM ( LENA HAI )'
                          ? 'PAYMENT_RECEIVING_FROM'
                          : 'PAYMENT_PAID_TO'
                      );
                    }}
                  >
                    Settlement
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {data.length > 0 && (
              <TableRow>
                <TableCell
                  sx={{
                    backgroundColor: '#ffc107',
                    fontWeight: 'bold',
                    borderBottom: 'none',
                    borderBottomLeftRadius: '12px'
                  }}
                >
                  TOTAL
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    backgroundColor: '#ffc107',
                    fontWeight: 'bold',
                    color: getTotal(data, 'amount') < 0 ? 'red' : 'green',
                    borderBottom: 'none',
                  }}
                >
                  {formatValue(getTotal(data, 'amount'), true)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    backgroundColor: '#ffc107',
                    fontWeight: 'bold',
                    color: getTotal(data, 'settled') < 0 ? 'red' : 'black',
                    borderBottom: 'none',
                  }}
                >
                  {formatValue(getTotal(data, 'settled'), true)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    backgroundColor: '#ffc107',
                    fontWeight: 'bold',
                    color: getTotal(data, 'final') < 0 ? 'red' : 'green',
                    borderBottom: 'none',
                  }}
                >
                  {formatValue(getTotal(data, 'final'), true)}
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: '#ffc107',
                    borderBottom: 'none',
                    borderBottomRightRadius: '12px'
                  }}
                />
              </TableRow>
            )}

            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );

  const renderHeader = () => (
    <Box sx={{ mb: 3 }}>



      {/* Main Title and Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {viewStack.length > 0 && (
          < IconButton
            onClick={handleBackClick}
            color="primary"
            sx={{ border: '1px solid', borderColor: 'primary.main' }}
          >
            <Iconify icon="mdi:arrow-left" width={14} />

          </IconButton>
        )}

      </Box>


    </Box >
  );

  return (
    <>
      {renderHeader()}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderTable('PAYMENT RECEIVING FROM ( LENA HAI )', receivingData, true)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderTable('PAYMENT PAID TO ( DENA HAI )', paidData, false)}
        </Grid>
      </Grid>

      <SettlementModal
        open={openModal}
        onClose={handleClose}
        client={selectedClient}
        adminIdFrom={currentView?.adminId}
      />
    </>
  );
}