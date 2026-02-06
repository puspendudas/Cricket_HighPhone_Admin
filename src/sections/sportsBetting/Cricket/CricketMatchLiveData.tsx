import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';

import {
    Box,
    Card,
    Chip,
    Grid,
    Table,
    Paper,
    Divider,
    TableRow,
    Collapse,
    useTheme,
    TableBody,
    TableCell,
    TableHead,
    Accordion,
    Typography,
    IconButton,
    CardContent,
    useMediaQuery,
    TableContainer,
    TablePagination,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';
import useBetHistroyApi from 'src/Api/matchApi/useBetHistroyApi';

import { Iconify } from 'src/components/iconify';

import LiveTv from './LiveTv';
import win from '../../../../public/assets/win.png';


interface BetData {
    id: string;
    user: {
        name: any;
        user_name: string;
    };
    stake_amount: number;
    odds_rate: string;
    odds_value?: string;
    selection: string;
    team_name: string;
    createdAt: string;
    bet_type: string;
    runner_name?: string;
    result?: string;
    status?: string;
    potential_winnings?: string | number;
}

// Add types for summary row and match/fancy bet
type SummaryRow = {
    userFullName: string;
    client: string;
    userName?: string;
    matchPL: number;
    sessionPL: number;
    total: number;
    matchCommission: number;
    sessionCommission: number;
    totalCommission: number;
    netAmount: number;
    shareAmount: number;
    grandTotal: number;
};

type MatchBet = {
    bet_type: string;
    stake_amount: string | number;
    potential_winnings: string | number;
    status: string;
    selection: string;
};

type FancyBet = MatchBet & {
    odds_value?: string;
    odds_rate: string;
    runner_name: string;
    createdAt: string;
    result: string;
    user: { user_name: string };
};

type MatchSummary = {
    _id: any;
    user?: { user_name?: string; match_commission?: number; session_commission?: number };
    matchBets: (MatchBet | FancyBet)[];
};

export default function CricketMatchLiveData() {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { fetchMe } = useMeApi();

    const { FatchUpdateMatchData, fetchTableData, Exposure } = useMatchApi();
    const { fetchBetHistory } = useBetHistroyApi();
    const { gameId } = useParams<{ gameId: string }>();

    const formatDateTime = (dateString: string): string => {
        const date = new Date(dateString);

        // Get day, month, year
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);

        // Get time components
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };
    // Fetch user data first
    const {
        data: userData,
    } = useQuery({
        queryKey: ['userData'],
        queryFn: fetchMe,
    });

    // Extract user ID
    const userId = userData?.data?._id;

    // Match Data
    const {
        data: matchData,
        isLoading: matchLoading,
        error: matchError,
    } = useQuery({
        queryKey: ['matchData', gameId],
        queryFn: () => (gameId ? FatchUpdateMatchData(gameId) : Promise.reject(new Error('No gameId'))),
        enabled: !!gameId,
        refetchInterval: 2000,
    });

    // Extract current match ID AFTER matchData is defined
    const currentMatchId = matchData?.match?._id;

    // Bet History
    const {
        data: betHistoryData,
        isLoading: betHistoryLoading,
    } = useQuery<{ data: BetData[] }, Error>({
        queryKey: ['betHistory', matchData?.match._id, userId],
        queryFn: () =>
            userId && currentMatchId
                ? fetchBetHistory(currentMatchId, userId)
                : Promise.reject(new Error('Missing user ID or match ID')),
        enabled: !!userId && !!currentMatchId,
        refetchInterval: 2000,
        select: (data) => ({
            ...data,
            data: data.data.filter(
                (bet: BetData) => bet.status !== 'DELETED' && bet.status !== 'CANCELLED'
            ),
        }),
    });

    // Add this query for table data
    const {
        data: tableData,
        isLoading: isTableLoading,
    } = useQuery({
        queryKey: ['tableData', userId, currentMatchId],
        queryFn: () =>
            userId && currentMatchId
                ? fetchTableData(userId, currentMatchId)
                : Promise.reject(new Error('Missing user ID or match ID')),
        enabled: !!userId && !!currentMatchId,
        refetchInterval: 2000,
    });

    // EXPOSURE DATA API CALL
    const {
        data: exposureData,
    } = useQuery({
        queryKey: ['exposureData', userId, currentMatchId],
        queryFn: () =>
            userId && currentMatchId
                ? Exposure(userId, currentMatchId)
                : Promise.reject(new Error('Missing user ID or match ID')),
        enabled: !!userId && !!currentMatchId,
        refetchInterval: 2000,
    });

    useEffect(() => {
        if (tableData && tableData.matches) {
            const processedSummary = processSummaryData(tableData.matches);
            setSummaryData(processedSummary);
        }
    }, [tableData]);

    // Calculate team-wise potential profit/loss for all admins with SIGN INVERT
    const calculateTeamWisePotentialPL = () => {
        if (!exposureData?.matches || !userShare) return {};

        const teamWisePL: Record<string, number> = {};

        exposureData.matches.forEach((admin: any) => {
            const adminShare = admin.share || 0;
            const shareDiff = userShare - adminShare; // 100 - 80 = 20%, 100 - 95 = 5%

            Object.entries(admin.potential_profitloss || {}).forEach(([teamName, teamPL]: [string, any]) => {
                if (!teamWisePL[teamName]) {
                    teamWisePL[teamName] = 0;
                }

                // Apply share percentage to each team's P/L and INVERT SIGN
                const shareAmount = (shareDiff / 100) * teamPL;
                const invertedShareAmount = shareAmount * -1; // SIGN INVERT (- becomes +, + becomes -)
                teamWisePL[teamName] += invertedShareAmount;
            });
        });

        return teamWisePL;
    };

    // VARIABLES DECLARE
    const userShare = userData?.data?.share || 100; // SUPERADMIN ka share (100)
    const teamWisePotentialPL = calculateTeamWisePotentialPL();

    const processSummaryData = (matches: MatchSummary[]): SummaryRow[] => {
        const adminGroups: Record<string, MatchSummary[]> = {};

        matches.forEach((match: MatchSummary) => {
            match.matchBets.forEach((bet: any) => {
                const admin = bet.immediate_child_admin;
                if (admin && admin._id) {
                    const adminId = admin._id;
                    if (!adminGroups[adminId]) {
                        adminGroups[adminId] = [];
                    }
                    // Sirf unique matches add karo
                    const existingMatch = adminGroups[adminId].find(m => m._id === match._id);
                    if (!existingMatch) {
                        adminGroups[adminId].push(match);
                    }
                }
            });
        });

        // Ab har admin ke liye calculate karo
        const summaryRows: SummaryRow[] = [];

        Object.entries(adminGroups).forEach(([adminId, adminMatches]) => {
            adminMatches.forEach((match: MatchSummary) => {
                const bookmakerBets = match.matchBets.filter((b: MatchBet) =>
                    b.bet_type === "BOOKMAKER" && (b as any).immediate_child_admin?._id === adminId
                );
                const fancyBets = match.matchBets.filter((b: MatchBet) =>
                    b.bet_type === "FANCY" && (b as any).immediate_child_admin?._id === adminId
                );

                if (bookmakerBets.length === 0 && fancyBets.length === 0) return;

                // Commission rates - first bet se lekar jo adminId match kare
                const firstBetWithThisAdmin = match.matchBets.find((bet: any) =>
                    bet.immediate_child_admin?._id === adminId
                ) as any;

                const immediateChildAdmin = firstBetWithThisAdmin?.immediate_child_admin;

                const matchCommissionRate = immediateChildAdmin?.match_commission || 0;
                const sessionCommissionRate = immediateChildAdmin?.session_commission || 0;

                // DYNAMIC SHARE PERCENTAGE - database se lo
                const sharePercentage = immediateChildAdmin?.share || 0; // 80% in your case
                const shareRate = sharePercentage / 100; // 0.8

                // --- MATCH P/L (BOOKMAKER) ---
                const matchPL = bookmakerBets.reduce((acc: number, bet: MatchBet) => {
                    const stake = parseFloat(bet.stake_amount as string) || 0;
                    const potential = parseFloat(bet.potential_winnings as string) || 0;
                    let value = 0;

                    if (bet.status === "WON") {
                        if (bet.selection === "Back") value = potential;
                        if (bet.selection === "Lay") value = stake;
                    } else if (bet.status === "LOST") {
                        if (bet.selection === "Back") value = -stake;
                        if (bet.selection === "Lay") value = -potential;
                    }
                    return acc + value;
                }, 0);

                // --- SESSION P/L (FANCY) ---
                const sessionPL = fancyBets.reduce((acc: number, bet: MatchBet) => {
                    const stake = parseFloat(bet.stake_amount as string) || 0;
                    const potential = parseFloat(bet.potential_winnings as string) || 0;
                    let value = 0;

                    if (bet.status === "WON") {
                        if (bet.selection === "Yes") value = potential;
                        if (bet.selection === "Not") value = stake;
                    } else if (bet.status === "LOST") {
                        if (bet.selection === "Yes") value = -stake;
                        if (bet.selection === "Not") value = -potential;
                    }
                    return acc + value;
                }, 0);

                // --- INVERT FOR DISPLAY ---
                const invertedMatchPL = matchPL * -1;
                const invertedSessionPL = sessionPL * -1;

                // --- COMMISSION CALCULATION ---
                const totalSessionStake = fancyBets.reduce(
                    (acc: number, bet: MatchBet) => acc + (parseFloat(bet.stake_amount as string) || 0),
                    0
                );
                let matchCommission = 0;

                const clientSummaries = (match as any).client_summary || [];

                clientSummaries.forEach((c: any) => {
                    // 🔑 CLIENT MUST BELONG TO THIS AGENT
                    const clientBelongsToThisAgent = match.matchBets.some(
                        (b: any) =>
                            b.user_id === c.client_id &&
                            b.immediate_child_admin?._id === adminId
                    );

                    if (!clientBelongsToThisAgent) return;

                    // ✅ Sirf LOSS par commission
                    if (c.client_net_match_pl < 0) {
                        matchCommission +=
                            Math.abs(c.client_net_match_pl) * (matchCommissionRate / 100);
                    }
                });

                // SESSION COMMISSION: Hamesha lagegi (total stake pe)
                const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
                const totalCommission = matchCommission + sessionCommission;

                // --- TOTAL (WITHOUT COMMISSION) ---
                const total = invertedMatchPL + invertedSessionPL;

                // --- NET AMOUNT (AFTER COMMISSION) ---
                const netAmount = total - totalCommission;

                // CORRECTED: SHARE AMOUNT (dynamic share percentage se)
                const shareAmount = netAmount * shareRate;

                // --- GRAND TOTAL (NET AMOUNT - SHARE AMOUNT) ---
                const grandTotal = netAmount - shareAmount;

                summaryRows.push({
                    client: immediateChildAdmin?.user_name || 'N/A',
                    userName: immediateChildAdmin?.user_name || 'N/A',
                    userFullName: immediateChildAdmin?.name || 'N/A',
                    matchPL: invertedMatchPL,
                    sessionPL: invertedSessionPL,
                    total,
                    matchCommission,
                    sessionCommission,
                    totalCommission,
                    netAmount,
                    shareAmount,
                    grandTotal
                });
            });
        });

        return summaryRows;
    };

    const renderSummaryTable = () => {
        if (isTableLoading) {
            return (
                <Box p={2}>
                    <Typography>Loading summary data...</Typography>
                </Box>
            );
        }
        return (
            <>
                {summaryData.map((row, index) => (
                    <TableRow key={index}>
                        <TableCell>
                            {row.userFullName} ({row.userName})
                        </TableCell>
                        <TableCell sx={{ color: row.matchPL >= 0 ? 'green' : 'red' }}>
                            ₹{row.matchPL.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: row.sessionPL >= 0 ? 'green' : 'red' }}>
                            ₹{row.sessionPL.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: row.total >= 0 ? 'green' : 'red' }}>
                            ₹{row.total.toFixed(2)}
                        </TableCell>
                        <TableCell>₹{row.matchCommission.toFixed(2)}</TableCell>
                        <TableCell>₹{row.sessionCommission.toFixed(2)}</TableCell>
                        <TableCell>₹{row.totalCommission.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: row.netAmount >= 0 ? 'green' : 'red' }}>
                            ₹{row.netAmount.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: row.shareAmount >= 0 ? 'green' : 'red' }}>
                            ₹{row.shareAmount.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: row.grandTotal >= 0 ? 'green' : 'red' }}>
                            ₹{row.grandTotal.toFixed(2)}
                        </TableCell>
                    </TableRow>
                ))}
            </>
        );
    };

    const calculateTotals = () => {
        const totals = summaryData.reduce(
            (acc, row) => ({
                matchPL: acc.matchPL + row.matchPL,
                sessionPL: acc.sessionPL + row.sessionPL,
                total: acc.total + row.total,
                matchCommission: acc.matchCommission + row.matchCommission,
                sessionCommission: acc.sessionCommission + row.sessionCommission,
                totalCommission: acc.totalCommission + row.totalCommission,
                netAmount: acc.netAmount + row.netAmount,
                shareAmount: acc.shareAmount + row.shareAmount,
                grandTotal: acc.grandTotal + row.grandTotal,
            }),
            {
                matchPL: 0,
                sessionPL: 0,
                total: 0,
                matchCommission: 0,
                sessionCommission: 0,
                totalCommission: 0,
                netAmount: 0,
                shareAmount: 0,
                grandTotal: 0,
            }
        );
        return totals;
    };

    const renderTotalRow = () => {
        const totals = calculateTotals();

        return (
            <TableRow sx={{ backgroundColor: '#FFC107' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ color: totals.matchPL >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.matchPL.toFixed(2)}
                </TableCell>
                <TableCell sx={{ color: totals.sessionPL >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.sessionPL.toFixed(2)}
                </TableCell>
                <TableCell sx={{ color: totals.total >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.total.toFixed(2)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>₹{totals.matchCommission.toFixed(2)}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>₹{totals.sessionCommission.toFixed(2)}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>₹{totals.totalCommission.toFixed(2)}</TableCell>
                <TableCell sx={{ color: totals.netAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.netAmount.toFixed(2)}
                </TableCell>
                <TableCell sx={{ color: totals.shareAmount >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.shareAmount.toFixed(2)}
                </TableCell>
                <TableCell sx={{ color: totals.grandTotal >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    ₹{totals.grandTotal.toFixed(2)}
                </TableCell>
            </TableRow>
        );
    };

    const toggleSection = (runnerName: string) => {
        setOpenSections((prev) => ({ ...prev, [runnerName]: !prev[runnerName] }));
    };

    if (matchLoading || betHistoryLoading) {
        return (
            <Box p={2}>
                <Typography>Loading match data...</Typography>
            </Box>
        );
    }

    if (matchError || !matchData) {
        return (
            <Box p={2}>
                <Typography>No match data available</Typography>
            </Box>
        );
    }

    const { eventName, eventTime, bookMakerOdds = [], fancyOdds = [], wonby, teams = [] } = matchData.match;

    const activeFancyOdds = Array.isArray(fancyOdds)
        ? fancyOdds.filter((item: any) =>
            item.market === 'Normal' &&
            !item.isDeclared &&
            !(item.isEnabled === false && item.isFancyEnded === true)
        )
        : [];



    const formattedDate = new Date(eventTime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Match transactions formatting - Use BetData interface
    const matchBetsRaw = (betHistoryData?.data || []).filter(
        (b: BetData) => (b?.bet_type || '').toUpperCase() !== 'FANCY'
    );
    const normalizeTeam = (name = '') =>
        name.replace(/\./g, '').trim().toLowerCase();

    const formattedBetHistory = matchBetsRaw.map((bet: BetData) => {
        let displayTeam = bet.team_name || 'N/A';

        if (bet.selection === 'Lay' && teams.length === 2) {
            const normalizedBetTeam = normalizeTeam(bet.team_name);
            const normalizedTeams = teams.map((t: string) => normalizeTeam(t));

            const oppositeIndex = normalizedTeams.findIndex(
                (t: string) => t !== normalizedBetTeam
            );

            displayTeam = teams[oppositeIndex] || bet.team_name;
        }

        return {
            client: bet.user.user_name,
            user: bet.user.name,
            amount: bet.stake_amount,
            rate: Number(bet.odds_rate).toFixed(2),
            mode: bet.selection === 'Back' ? 'L' : 'K',
            team: displayTeam,
            selection: bet.selection,
            date: formatDateTime(bet.createdAt),
        };
    });


    // Fancy bets grouping
    const fancyBets = (betHistoryData?.data || []).filter(
        (bet: any) =>
            bet.bet_type === 'FANCY' &&
            bet.status !== 'DELETED' &&
            !(bet.isEnabled === false && bet.isFancyEnded === true)
    );


    const groupedFancyBets = fancyBets.reduce(
        (acc: Record<string, BetData[]>, bet: BetData) => {
            const runnerName = bet.runner_name || 'Unknown';
            if (!acc[runnerName]) acc[runnerName] = [];
            acc[runnerName].push(bet);
            return acc;
        },
        {}
    );

    // Match table with pagination
    const renderMatchTable = () => {
        const paginated = formattedBetHistory.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );

        return (
            <>
                <TableContainer sx={{ maxHeight: 420, overflowX: 'auto' }}>
                    <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Mode/Rate</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginated.length > 0 ? (
                                paginated.map((row: any, index: any) => (
                                    <TableRow key={`${row.client}-${index}`} hover>
                                        <TableCell> {row.user} ({row.client})</TableCell>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: "20px",
                                                    fontWeight: "bold",
                                                    color: "#fff",
                                                    backgroundColor: row.selection === "Back" ? "#83c2fc" : "#fda4b4",
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: "bold", mr: 0.5, color: '#000' }}>
                                                    {row.selection}
                                                </Typography>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: "bold",
                                                    background: '#fff',
                                                    borderRadius: '20px',
                                                    color: '#000',
                                                    padding: '1px 8px'
                                                }}>
                                                    {row.rate}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>₹{row.amount.toLocaleString()}</TableCell>
                                        <TableCell>{row.team}</TableCell>
                                        <TableCell>{row.date}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No transaction data available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={formattedBetHistory.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50]}
                />
            </>
        );
    };

    const BookmakerOddsTable = (
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>
                            Bookmaker Odds
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>
                            Back
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>
                            Lay
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.isArray(bookMakerOdds) &&
                        bookMakerOdds.length > 0 &&
                        (bookMakerOdds as any)[0]?.bm1?.oddDatas?.length > 0 ? (

                        (bookMakerOdds as any)[0].bm1.oddDatas.map((row: any, index: number) => {
                            const isBackSusp = Number(row.b1) >= 100;
                            const isLaySusp = Number(row.l1) >= 100;

                            const teamName = row.rname;
                            const teamPL = teamWisePotentialPL[teamName] || 0;

                            return (
                                <TableRow key={index} sx={{ backgroundColor: '#ffc107' }}>
                                    <TableCell>
                                        <Typography fontWeight="bold">{row.rname}</Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: teamPL >= 0 ? 'green' : 'red',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ({teamPL >= 0 ? '+' : ''}{teamPL.toFixed(2)})
                                        </Typography>
                                    </TableCell>

                                    {/* BACK */}
                                    <TableCell
                                        sx={{
                                            backgroundColor: isBackSusp ? '#bdbdbd' : '#90caf9',
                                            fontWeight: 'bold',
                                            fontSize: 18,
                                        }}
                                    >
                                        {isBackSusp ? (
                                            <Typography sx={{ color: '#3b3b3b', fontSize: 10 }}>SUSPENDED</Typography>
                                        ) : (
                                            Number(row.b1).toFixed(2)
                                        )}
                                    </TableCell>

                                    {/* LAY */}
                                    <TableCell
                                        sx={{
                                            backgroundColor: isLaySusp ? '#bdbdbd' : '#f48fb1',
                                            fontWeight: 'bold',
                                            fontSize: 18,
                                        }}
                                    >
                                        {isLaySusp ? (
                                            <Typography sx={{ color: '#3b3b3b', fontSize: 10 }}>SUSPENDED</Typography>
                                        ) : (
                                            Number(row.l1).toFixed(2)
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })

                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={3}
                                align="center"
                                sx={{
                                    backgroundColor: '#bdbdbd',
                                    color: '#3b3b3b',
                                    fontWeight: 'bold',
                                    fontSize: 16,
                                    py: 2
                                }}
                            >
                                SUSPENDED
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Paper>
    );

    const FancyOddsTable = (
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>
                            Fancy Odds (Normal Market)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>
                            Not
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>
                            Yes
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {activeFancyOdds.length ? (
                        activeFancyOdds.map((row: any, idx: number) => {
                            const isSuspended =
                                Number(row.b1) === 0 &&
                                Number(row.bs1) === 0 &&
                                Number(row.l1) === 0 &&
                                Number(row.ls1) === 0;

                            return (
                                <TableRow
                                    key={row._id || idx}
                                    sx={{ backgroundColor: idx === 0 ? '#ffc107' : 'white' }}
                                >
                                    <TableCell sx={{ fontWeight: 'bold' }}>{row.rname || '--'}</TableCell>

                                    {/* NOT */}
                                    <TableCell
                                        sx={{
                                            backgroundColor: isSuspended ? '#bdbdbd' : '#f48fb1',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {isSuspended ? (
                                            <Typography sx={{ color: '#3b3b3b', fontSize: '0.7rem' }}>
                                                SUSPENDED
                                            </Typography>
                                        ) : (
                                            <>
                                                <Typography>{Number(row.l1).toFixed(0)}</Typography>
                                                <Typography fontSize={12}>{Number(row.ls1).toFixed(0)}</Typography>
                                            </>
                                        )}
                                    </TableCell>

                                    {/* YES */}
                                    <TableCell
                                        sx={{
                                            backgroundColor: isSuspended ? '#bdbdbd' : '#90caf9',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {isSuspended ? (
                                            <Typography sx={{ color: '#3b3b3b', fontSize: '0.7rem' }}>
                                                SUSPENDED
                                            </Typography>
                                        ) : (
                                            <>
                                                <Typography>{Number(row.b1).toFixed(0)}</Typography>
                                                <Typography fontSize={12}>{Number(row.bs1).toFixed(0)}</Typography>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} align="center">
                                No active Normal market fancy odds available
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Paper>
    );

    // Mobile layout
    if (isMobile) {
        return (
            <Box p={2}>
                {/* Header */}
                <Card sx={{ mb: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
                    <CardContent
                        sx={{
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #26B8A4 0%, #1a7c6d 100%)',
                            height: '100px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            color: '#fff',
                        }}
                    >
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                            {eventName}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ mb: 3 }}>
                            ({formattedDate})
                        </Typography>
                        {wonby && (
                            <Chip
                                avatar={
                                    <img
                                        src={win}
                                        alt="team-logo"
                                        style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                                    />
                                }
                                label={`(${wonby})`}
                                sx={{
                                    p: 1.5,
                                    backgroundColor: '#fff',
                                    color: '#E7001F',
                                    cursor: 'default',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    alignSelf: 'center',
                                }}
                            />
                        )}
                    </CardContent>
                    <LiveTv matchId={gameId} matchData={betHistoryData} />
                </Card>

                {/* Bookmaker Odds */}
                {BookmakerOddsTable}

                {/* Match tab */}
                <Accordion defaultExpanded>
                    <AccordionSummary
                        expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={20} height={20} />}
                    >
                        <Typography variant="subtitle1" fontWeight="bold">
                            Match
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>{renderMatchTable()}</AccordionDetails>
                </Accordion>

                {/* Fancy Odds */}
                {FancyOddsTable}

                {/* Fancy Bets tab */}
                <Accordion>
                    <AccordionSummary
                        expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={20} height={20} />}
                    >
                        <Typography variant="subtitle1" fontWeight="bold">
                            Fancy Bets
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: '0px' }}>
                        {Object.entries(groupedFancyBets).length === 0 ? (
                            <Typography>No fancy bets available</Typography>
                        ) : (
                            Object.entries(groupedFancyBets).map(([runnerName, bets]) => (
                                <Box key={runnerName} mb={1}>
                                    <Paper sx={{ backgroundColor: '#26B8A4', color: 'white' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography fontWeight="bold" color="white" p={1}>
                                                {runnerName}
                                            </Typography>

                                            {(wonby === runnerName ||
                                                bets.some((b) => b.status === 'WON' || b.result)) && (
                                                    <Box
                                                        display="flex"
                                                        alignItems="center"
                                                        padding="5px 12px"
                                                        borderRadius="20px"
                                                        bgcolor="#FFC107"
                                                    >
                                                        <img src={win} alt="win" style={{ width: 20, marginRight: 8 }} />
                                                        <Typography color="#000" fontWeight="bold" fontSize="0.8rem">
                                                            {bets.find((b) => b.result)?.result ?? wonby}
                                                        </Typography>
                                                    </Box>
                                                )}

                                            <IconButton
                                                size="small"
                                                onClick={() => toggleSection(runnerName)}
                                                sx={{ color: 'white' }}
                                            >
                                                <Iconify
                                                    icon={
                                                        openSections[runnerName]
                                                            ? 'eva:arrow-ios-upward-fill'
                                                            : 'eva:arrow-ios-downward-fill'
                                                    }
                                                    width={18}
                                                    height={18}
                                                />
                                            </IconButton>
                                        </Box>

                                        <Collapse in={!!openSections[runnerName]} timeout="auto" unmountOnExit>
                                            <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                            <Paper sx={{ mt: 1 }}>
                                                <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                                                    <Table size="small" sx={{ minWidth: 700 }}>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                    Client
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                    Run
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                    YES/NOT
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                    Amount
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                    Created
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {bets.map((bet) => (
                                                                <TableRow key={bet.id}>
                                                                    <TableCell>
                                                                        {bet.user.name} ({bet.user.user_name})
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {parseInt(bet.odds_value || bet.odds_rate, 10)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Box
                                                                            sx={{
                                                                                display: "inline-flex",
                                                                                alignItems: "center",
                                                                                px: 2,
                                                                                py: 0.5,
                                                                                borderRadius: "20px",
                                                                                fontWeight: "bold",
                                                                                color: "#fff",
                                                                                backgroundColor:
                                                                                    bet.selection === "Yes" ? "#83c2fc" : "#fda4b4",
                                                                            }}
                                                                        >
                                                                            <Typography variant="body2" sx={{ fontWeight: "bold", mr: 0.5, color: '#000' }}>
                                                                                {bet.selection}
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{
                                                                                fontWeight: "bold",
                                                                                background: '#fff',
                                                                                borderRadius: '20px',
                                                                                color: '#000',
                                                                                padding: '1px 8px'
                                                                            }}>
                                                                                {Number(bet.odds_rate).toFixed(0)}
                                                                            </Typography>
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>₹{bet.stake_amount.toLocaleString()}</TableCell>
                                                                    <TableCell>
                                                                        {formatDateTime(bet.createdAt)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Paper>
                                        </Collapse>
                                    </Paper>
                                </Box>
                            ))
                        )}
                    </AccordionDetails>
                </Accordion>

                {/* Summary/Totals Accordion */}
                <Accordion>
                    <AccordionSummary
                        expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={20} height={20} />}
                    >
                        <Typography variant="subtitle1" fontWeight="bold">
                            Summary / Totals
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TableContainer
                            component={Paper}
                            sx={{
                                mt: { xs: 2, md: 0 },
                                width: '100%',
                                overflowX: 'auto',
                                boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
                            }}
                        >
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Client</TableCell>
                                        <TableCell>Match (+/-)</TableCell>
                                        <TableCell>Session (+/-)</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>M.Com</TableCell>
                                        <TableCell>S.Com</TableCell>
                                        <TableCell>T.Com</TableCell>
                                        <TableCell>NET.AMT</TableCell>
                                        <TableCell>SHR.AMT</TableCell>
                                        <TableCell>G. Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {renderSummaryTable()}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                </Accordion>

                {/* Fixed Bottom Totals */}
                <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Client</TableCell>
                                <TableCell>Match (+/-)</TableCell>
                                <TableCell>Session (+/-)</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>M.Com</TableCell>
                                <TableCell>S.Com</TableCell>
                                <TableCell>T.Com</TableCell>
                                <TableCell>NET.AMT</TableCell>
                                <TableCell>SHR.AMT</TableCell>
                                <TableCell>G. Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {renderTotalRow()}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    }

    // Desktop layout
    return (
        <Box>
            {/* Header */}
            <Card sx={{ mb: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
                <CardContent
                    sx={{
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #26B8A4 0%, #1a7c6d 100%)',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        color: '#fff',
                    }}
                >
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                        {eventName}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 3 }}>
                        ({formattedDate})
                    </Typography>
                    {wonby && (
                        <Chip
                            avatar={
                                <img
                                    src={win}
                                    alt="team-logo"
                                    style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                                />
                            }
                            label={`(${wonby})`}
                            sx={{
                                p: 1.5,
                                backgroundColor: '#fff',
                                color: '#E7001F',
                                cursor: 'default',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                alignSelf: 'center',
                            }}
                        />
                    )}
                </CardContent>
                <LiveTv matchId={gameId} matchData={betHistoryData} />
            </Card>

            <Grid container spacing={2}>
                {/* Left: Bookmaker Odds then Match */}
                <Grid item xs={12} md={6}>
                    {BookmakerOddsTable}

                    <Card>
                        <CardContent>
                            <Typography variant="h6" mb={2} sx={{ fontWeight: 'bold' }}>
                                Match
                            </Typography>
                            {renderMatchTable()}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right: Fancy Odds then Fancy Bets */}
                <Grid item xs={12} md={6}>
                    {FancyOddsTable}

                    {Object.entries(groupedFancyBets).map(([runnerName, bets]) => (
                        <TableContainer
                            key={runnerName}
                            component={Paper}
                            sx={{ mt: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ backgroundColor: '#26B8A4' }}>
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Typography color="#FFFFFF" variant="subtitle1" fontWeight="bold">
                                                    {runnerName}
                                                </Typography>
                                                {(wonby === runnerName ||
                                                    bets.some((b) => b.status === 'WON' || b.result)) && (
                                                        <Box
                                                            display="flex"
                                                            alignItems="center"
                                                            padding="5px 18px"
                                                            borderRadius="20px"
                                                            bgcolor="#FFC107"
                                                        >
                                                            <img
                                                                src={win}
                                                                alt="win"
                                                                style={{ width: '30px', marginRight: '8px' }}
                                                            />
                                                            <Typography color="#000000" variant="subtitle1" fontWeight="bold">
                                                                {bets.find((b) => b.result)?.result ?? wonby}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleSection(runnerName)}
                                                    sx={{ color: '#FFFFFF' }}
                                                >
                                                    <Iconify
                                                        icon={
                                                            openSections[runnerName]
                                                                ? 'eva:arrow-ios-upward-fill'
                                                                : 'eva:arrow-ios-downward-fill'
                                                        }
                                                        width={20}
                                                        height={20}
                                                    />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell style={{ padding: 0 }} colSpan={6}>
                                            <Collapse in={!!openSections[runnerName]} timeout="auto" unmountOnExit>
                                                <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                                <Paper sx={{ mt: 1 }}>
                                                    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                                                        <Table size="small" sx={{ minWidth: 700 }}>
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                        Client
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                        Run
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                        YES/NOT
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                        Amount
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                        Created
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {bets.map((bet) => (
                                                                    <TableRow key={bet.id}>
                                                                        <TableCell>
                                                                            {bet.user.name} ({bet.user.user_name})
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {parseInt(bet.odds_value || bet.odds_rate, 10)}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Box
                                                                                sx={{
                                                                                    display: "inline-flex",
                                                                                    alignItems: "center",
                                                                                    px: 2,
                                                                                    py: 0.5,
                                                                                    borderRadius: "20px",
                                                                                    fontWeight: "bold",
                                                                                    color: "#fff",
                                                                                    backgroundColor:
                                                                                        bet.selection === "Yes" ? "#83c2fc" : "#fda4b4",
                                                                                }}
                                                                            >
                                                                                <Typography variant="body2" sx={{ fontWeight: "bold", mr: 0.5, color: '#000' }}>
                                                                                    {bet.selection}
                                                                                </Typography>
                                                                                <Typography variant="body2" sx={{
                                                                                    fontWeight: "bold",
                                                                                    background: '#fff',
                                                                                    borderRadius: '20px',
                                                                                    color: '#000',
                                                                                    padding: '1px 8px'
                                                                                }}>
                                                                                    {Number(bet.odds_rate).toFixed(0)}
                                                                                </Typography>
                                                                            </Box>
                                                                        </TableCell>
                                                                        <TableCell>₹{bet.stake_amount.toLocaleString()}</TableCell>
                                                                        <TableCell>
                                                                            {formatDateTime(bet.createdAt)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </Paper>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ))}
                </Grid>
            </Grid>

            {/* Bottom Tables - Match Summary */}
            <Grid item xs={12} mt={4} md={12} sx={{ mb: 20 }}>
                <TableContainer
                    component={Paper}
                    sx={{
                        mt: { xs: 2, md: 0 },
                        width: '100%',
                        overflowX: 'auto',
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Table sx={{ minWidth: 'auto' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Client</TableCell>
                                <TableCell>Match (+/-)</TableCell>
                                <TableCell>Session (+/-)</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>M.Com</TableCell>
                                <TableCell>S.Com</TableCell>
                                <TableCell>T.Com</TableCell>
                                <TableCell>NET.AMT</TableCell>
                                <TableCell>SHR.AMT</TableCell>
                                <TableCell>G. Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {renderSummaryTable()}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>

            {/* Fixed Bottom Total Table */}
            <Box sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                width: '100%',
                px: 2,
                pb: 2,
                backgroundColor: 'background.paper'
            }}>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Client</TableCell>
                                <TableCell>Match (+/-)</TableCell>
                                <TableCell>Session (+/-)</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>M.Com</TableCell>
                                <TableCell>S.Com</TableCell>
                                <TableCell>T.Com</TableCell>
                                <TableCell>NET.AMT</TableCell>
                                <TableCell>SHR.AMT</TableCell>
                                <TableCell>G. Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {renderTotalRow()}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
}