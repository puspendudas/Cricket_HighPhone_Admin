// import React, { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';

// import {
//   Grid,
//   Paper,
//   Table,
//   Button,
//   TableRow,
//   TableHead,
//   TableCell,
//   TableBody,
//   Typography
// } from '@mui/material';

// import useMeApi from 'src/Api/me/useMeApi';
// import useMatchApi from 'src/Api/matchApi/useMatchApi';

// import SettlementModal from './SettlementModal';

// // Interfaces define karo
// interface Bet {
//   _id?: string;
//   user_id: string;
//   bet_type: string;
//   stake_amount: string | number;
//   potential_winnings: string | number;
//   status: string;
//   selection: string;
//   immediate_child_admin?: {
//     _id: string;
//     user_name: string;
//     name: string;
//     match_commission: number;
//     session_commission: number;
//     share: number;
//   };
//   createdAt: string;
// }

// interface MatchSummary {
//   _id: string;
//   eventName: string;
//   matchBets: Bet[];
// }

// interface SettlementData {
//   _id: string;
//   adminIdTo: string;
//   adminIdFrom: string;
//   ammount: number;
//   type: string;
//   remark: string;
//   createdAt: string;
//   updatedAt: string;
//   __v: number;
// }

// // ChildTableData ka final balance get karne wala hook - SIMPLIFIED
// const useChildTableFinalBalance = () => {
//   const { fetchTotalData, fetchSettlement } = useMatchApi();
//   const { fetchMe } = useMeApi();

//   const { data: userData } = useQuery({
//     queryKey: ['userData'],
//     queryFn: fetchMe,
//   });

//   const userId = userData?.data?._id;

//   // Fetch table data directly
//   const { data: tableData } = useQuery({
//     queryKey: ['ledgerTableData', userId],
//     queryFn: () =>
//       userId
//         ? fetchTotalData(userId)
//         : Promise.reject(new Error('Missing user ID')),
//     enabled: !!userId,
//   });

//   // Fetch settlement data using userId
//   const { data: settlementData } = useQuery({
//     queryKey: ['childSettlementData', userId],
//     queryFn: () =>
//       userId
//         ? fetchSettlement(userId)
//         : Promise.reject(new Error('Missing user ID')),
//     enabled: !!userId,
//     refetchInterval: 3000,

//   });

//   // Calculate total settled amount with proper sign
//   const calculateSettledAmount = (settlements: SettlementData[]): number => {
//     if (!settlements || settlements.length === 0) return 0;

//     return settlements.reduce((total, settlement) => {
//       if (settlement.type === 'debit') {
//         return total - Math.abs(settlement.ammount); // Negative for debit
//       } if (settlement.type === 'credit') {
//         return total + Math.abs(settlement.ammount); // Positive for credit
//       }
//       return total;
//     }, 0);
//   };

//   const settledAmount = settlementData?.data ? calculateSettledAmount(settlementData.data) : 0;

//   // Get immediate_child_admin from table data
//   const getImmediateChildAdmin = () => {
//     if (!tableData?.matches || tableData.matches.length === 0) return null;

//     const firstMatchWithBets = tableData.matches.find((match: { matchBets: string | any[]; }) =>
//       match.matchBets && match.matchBets.length > 0
//     );

//     if (firstMatchWithBets?.matchBets?.[0]?.immediate_child_admin) {
//       return firstMatchWithBets.matchBets[0].immediate_child_admin;
//     }

//     return null;
//   };

//   const immediateChildAdmin = getImmediateChildAdmin();

//   // Get immediate_child_admin user_name
//   const getImmediateChildAdminUserName = (): string => immediateChildAdmin?.user_name || 'S1(SUPERADMIN)';

//   // Process ledger data and get final balance - SIMPLIFIED VERSION
//   const getFinalBalance = (matches: MatchSummary[]) => {
//     if (!matches || matches.length === 0) return 0;

//     let runningBalance = 0;

//     matches.forEach((match: MatchSummary) => {
//       const betsByAdmin: Record<string, Bet[]> = {};
//       match.matchBets.forEach((bet: Bet) => {
//         const adminId = bet.immediate_child_admin?._id || 'unknown';
//         if (!betsByAdmin[adminId]) betsByAdmin[adminId] = [];
//         betsByAdmin[adminId].push(bet);
//       });

//       Object.values(betsByAdmin).forEach((adminBets: Bet[]) => {
//         const firstBet = adminBets[0];

//         const bookmakerBets = adminBets.filter((b) => b.bet_type === 'BOOKMAKER');
//         const fancyBets = adminBets.filter((b) => b.bet_type === 'FANCY');

//         const matchPL = bookmakerBets.reduce((acc: number, bet: Bet) => {
//           const stake = parseFloat(bet.stake_amount as string) || 0;
//           const potential = parseFloat(bet.potential_winnings as string) || 0;
//           let value = 0;
//           if (bet.status === 'WON') {
//             if (bet.selection === 'Back') value = potential;
//             if (bet.selection === 'Lay') value = stake;
//           } else if (bet.status === 'LOST') {
//             if (bet.selection === 'Back') value = -stake;
//             if (bet.selection === 'Lay') value = -potential;
//           }
//           return acc + value;
//         }, 0);

//         const sessionPL = fancyBets.reduce((acc: number, bet: Bet) => {
//           const stake = parseFloat(bet.stake_amount as string) || 0;
//           const potential = parseFloat(bet.potential_winnings as string) || 0;
//           let value = 0;
//           if (bet.status === 'WON') {
//             if (bet.selection === 'Yes') value = potential;
//             if (bet.selection === 'Not') value = stake;
//           } else if (bet.status === 'LOST') {
//             if (bet.selection === 'Yes') value = -stake;
//             if (bet.selection === 'Not') value = -potential;
//           }
//           return acc + value;
//         }, 0);

//         const invertedMatchPL = matchPL * -1;
//         const invertedSessionPL = sessionPL * -1;

//         const totalSessionStake = fancyBets.reduce(
//           (acc: number, bet: Bet) => acc + (parseFloat(bet.stake_amount as string) || 0),
//           0
//         );

//         const userBookmakerLosses = bookmakerBets.reduce((acc: number, bet: Bet) => {
//           const stake = parseFloat(bet.stake_amount as string) || 0;
//           const potential = parseFloat(bet.potential_winnings as string) || 0;
//           let loss = 0;
//           if (bet.status === 'LOST') {
//             if (bet.selection === 'Back') loss = stake;
//             if (bet.selection === 'Lay') loss = potential;
//           }
//           return acc + loss;
//         }, 0);

//         const immediate = firstBet?.immediate_child_admin;
//         const matchCommissionRate = immediate?.match_commission || 0;
//         const sessionCommissionRate = immediate?.session_commission || 0;
//         const matchCommission = userBookmakerLosses * (matchCommissionRate / 100);
//         const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
//         const totalCommission = matchCommission + sessionCommission;

//         const netAmount = invertedMatchPL + invertedSessionPL - totalCommission;
//         const share = immediate?.share ?? 0;
//         const shareAmount = netAmount * (share / 100);
//         const grandTotal = netAmount - shareAmount;

//         const credit = grandTotal < 0 ? Math.abs(grandTotal) : 0;
//         const debit = grandTotal > 0 ? grandTotal : 0;

//         runningBalance += (debit - credit);
//       });
//     });

//     return runningBalance;
//   };

//   const finalBalance = tableData?.matches ? getFinalBalance(tableData.matches) : 0;
//   const clientUserName = getImmediateChildAdminUserName();

//   return {
//     finalBalance,
//     clientUserName,
//     settledAmount,
//     immediateChildAdmin
//   };
// };

// export function AllSuperTableData() {
//   const [openModal, setOpenModal] = useState(false);
//   const [selectedClient, setSelectedClient] = useState(null);

//   // Sirf child table data use karo - koi condition check nahi
//   const {
//     finalBalance: displayBalance,
//     clientUserName: displayClientName,
//     settledAmount: displaySettledAmount,
//     immediateChildAdmin: displayImmediateChildAdmin
//   } = useChildTableFinalBalance();

//   // Calculate final amount based on debit/credit
//   const calculateFinalAmount = (amount: number, settled: number) => {
//     // Agar amount positive hai (LENA HAI)
//     if (amount > 0) {
//       // Credit (positive settled) = amount - settled
//       // Debit (negative settled) = amount + settled (kyuki settled negative hai)
//       return amount - settled;
//     }
//     // Agar amount negative hai (DENA HAI)
//     if (amount < 0) {
//       // Credit (positive settled) = amount + settled (kyuki amount negative hai)
//       // Debit (negative settled) = amount - settled (kyuki dono negative hain)
//       return amount + settled;
//     }
//     return 0;
//   };

//   const finalAmount = calculateFinalAmount(displayBalance, displaySettledAmount);

//   const receivingData = displayBalance > 0 ? [
//     {
//       client: displayClientName,
//       amount: displayBalance,
//       settled: displaySettledAmount,
//       final: finalAmount,
//       immediate_child_admin: displayImmediateChildAdmin
//     }
//   ] : [];

//   const paidData = displayBalance < 0 ? [
//     {
//       client: displayClientName,
//       amount: displayBalance,
//       settled: displaySettledAmount,
//       final: finalAmount,
//       immediate_child_admin: displayImmediateChildAdmin
//     }
//   ] : [];

//   const getTotal = (data: any[], key: 'amount' | 'settled' | 'final') =>
//     data.reduce((sum, row) => sum + row[key], 0);

//   const formatValue = (value: number, isCurrency = false) => {
//     if (value === 0) return '0';
//     const absValue = Math.abs(value);
//     const formatted = isCurrency ? `₹${absValue.toLocaleString()}` : absValue.toLocaleString();
//     return value < 0 ? `-${formatted}` : formatted;
//   };

//   const handleSettlementClick = (client: any) => {
//     setSelectedClient(client);
//     setOpenModal(true);
//   };

//   const renderTable = (title: string, data: any[], isPositive?: boolean) => (
//     <Paper elevation={3} sx={{
//       p: 2,
//       borderRadius: 3,
//       boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
//       width: '100%',
//       overflowX: 'hidden'
//     }}>
//       <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
//         {title}
//       </Typography>

//       <Table sx={{ minWidth: '100%' }}>
//         <TableHead>
//           <TableRow>
//             <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Client</TableCell>
//             <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Amount</TableCell>
//             <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Settled</TableCell>
//             <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Final</TableCell>
//             <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Action</TableCell>
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {data.map((row, i) => (
//             <TableRow key={i}>
//               <TableCell sx={{ color: '#2196f3', fontWeight: 500 }}>
//                 {row.client}
//               </TableCell>
//               <TableCell
//                 align="right"
//                 sx={{ color: row.amount < 0 ? 'red' : 'green', fontWeight: 500 }}
//               >
//                 {formatValue(row.amount, true)}
//               </TableCell>
//               <TableCell
//                 align="right"
//                 sx={{
//                   color: row.settled < 0 ? 'red' : 'green',
//                   fontWeight: 500
//                 }}
//               >
//                 {formatValue(row.settled, true)}
//               </TableCell>
//               <TableCell
//                 align="right"
//                 sx={{ color: row.final < 0 ? 'red' : 'green', fontWeight: 500 }}
//               >
//                 {formatValue(row.final, true)}
//               </TableCell>
//               <TableCell>
//                 <Button
//                   variant="contained"
//                   size="small"
//                   onClick={() => handleSettlementClick(row)}
//                   sx={{
//                     bgcolor: '#00c49f',
//                     color: '#fff',
//                     fontWeight: 'bold',
//                     textTransform: 'none',
//                     boxShadow: 'none',
//                     '&:hover': { bgcolor: '#00a98f' }
//                   }}
//                 >
//                   Settlement
//                 </Button>
//               </TableCell>
//             </TableRow>
//           ))}

//           {/* Total Row - Only show if data exists */}
//           {data.length > 0 && (
//             <TableRow>
//               <TableCell
//                 sx={{
//                   backgroundColor: '#ffc107',
//                   fontWeight: 'bold',
//                   borderBottom: 'none',
//                   borderBottomLeftRadius: '12px'
//                 }}
//               >
//                 TOTAL
//               </TableCell>
//               <TableCell
//                 align="right"
//                 sx={{
//                   backgroundColor: '#ffc107',
//                   fontWeight: 'bold',
//                   color: getTotal(data, 'amount') < 0 ? 'red' : 'green',
//                   borderBottom: 'none',
//                 }}
//               >
//                 {formatValue(getTotal(data, 'amount'), true)}
//               </TableCell>
//               <TableCell
//                 align="right"
//                 sx={{
//                   backgroundColor: '#ffc107',
//                   fontWeight: 'bold',
//                   color: getTotal(data, 'settled') < 0 ? 'red' : 'black',
//                   borderBottom: 'none',
//                 }}
//               >
//                 {formatValue(getTotal(data, 'settled'), true)}
//               </TableCell>
//               <TableCell
//                 align="right"
//                 sx={{
//                   backgroundColor: '#ffc107',
//                   fontWeight: 'bold',
//                   color: getTotal(data, 'final') < 0 ? 'red' : 'green',
//                   borderBottom: 'none',
//                 }}
//               >
//                 {formatValue(getTotal(data, 'final'), true)}
//               </TableCell>
//               <TableCell
//                 sx={{
//                   backgroundColor: '#ffc107',
//                   borderBottom: 'none',
//                   borderBottomRightRadius: '12px'
//                 }}
//               />
//             </TableRow>
//           )}

//           {/* Empty state */}
//           {data.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
//                 <Typography variant="body2" color="textSecondary">
//                   No data available
//                 </Typography>
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </Paper>
//   );

//   const handleClose = () => {
//     setOpenModal(false);
//     setSelectedClient(null);
//   };

//   return (
//     <>
//       <Grid container spacing={3}>
//         <Grid item xs={12} md={6}>
//           {renderTable('PAYMENT RECEIVING FROM ( LENA HAI )', receivingData, true)}
//         </Grid>
//         <Grid item xs={12} md={6}>
//           {renderTable('PAYMENT PAID TO ( DENA HAI )', paidData, false)}
//         </Grid>
//       </Grid>

//       <SettlementModal
//         open={openModal}
//         onClose={handleClose}
//         client={selectedClient}
//       />
//     </>
//   );
// }