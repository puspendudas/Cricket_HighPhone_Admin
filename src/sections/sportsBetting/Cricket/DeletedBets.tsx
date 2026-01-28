import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

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

import win from '../../../../public/assets/win.png';

interface FancyBetData {
    id: string;
    user: {
        user_name: string;
        name: string;
    };
    stake_amount: number;
    odds_rate: string;
    odds_value?: string;
    selection: string;
    runner_name: string;
    createdAt: string;
    result: string;
    bet_type: string;
    status?: string;
}

export default function DeletedBets() {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { fetchMe } = useMeApi();
    const { FatchUpdateMatchData } = useMatchApi();
    const { fetchBetHistory } = useBetHistroyApi();
    const { gameId } = useParams<{ gameId: string }>();

    // Fetch user data
    const { data: userData } = useQuery({
        queryKey: ['userData'],
        queryFn: fetchMe,
    });

    const userId = userData?.data?._id;
    const normalizeTeam = (name = '') =>
        name.replace(/\./g, '').trim().toLowerCase();

    // Match Data
    const {
        data: matchData,
        isLoading: matchLoading,
        error: matchError,
    } = useQuery({
        queryKey: ['matchData', gameId],
        queryFn: () =>
            gameId
                ? FatchUpdateMatchData(gameId)
                : Promise.reject(new Error('No gameId')),
        enabled: !!gameId,
        refetchInterval: 1000,
    });

    // Bet History
    const {
        data: betHistoryData,
        isLoading: betHistoryLoading,
    } = useQuery({
        queryKey: ['betHistory', matchData?.match._id, userId],
        queryFn: () =>
            matchData?.match._id && userId
                ? fetchBetHistory(matchData.match._id, userId)
                : Promise.reject(new Error('No match id or user id')),
        enabled: !!matchData?.match._id && !!userId,
        refetchInterval: 1000,
    });

    const toggleSection = (runnerName: string) => {
        setOpenSections((prev) => ({
            ...prev,
            [runnerName]: !prev[runnerName],
        }));
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

    const { eventName, eventTime, wonby, teams = [] as string[] } = matchData.match;

    const formattedDate = new Date(eventTime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Match transactions formatting
    const matchBetsRaw = (betHistoryData?.data || []).filter(
        (b: any) => (b?.bet_type || '').toUpperCase() !== 'FANCY' && b.status === 'DELETED'
    );

    const formattedBetHistory = matchBetsRaw.map((bet: any) => {
        let displayTeam = bet.team_name || 'N/A';

        if (bet.selection === 'Lay' && teams.length === 2) {
            const betTeam = normalizeTeam(bet.team_name);
            const t0 = normalizeTeam(teams[0]);
            const t1 = normalizeTeam(teams[1]);

            if (betTeam === t0) displayTeam = teams[1];
            else if (betTeam === t1) displayTeam = teams[0];
        }

        const d = new Date(bet.createdAt);
        const date = `${String(d.getDate()).padStart(2, '0')}/${String(
            d.getMonth() + 1
        ).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)} ${String(
            d.getHours()
        ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
            d.getSeconds()
        ).padStart(2, '0')}`;

        return {
            client: bet.user.user_name,
            userName: bet.user.name || bet.user.user_name,
            amount: bet.stake_amount,
            rate: (Number(bet.odds_rate) / 100).toFixed(2),
            selection: bet.selection,
            team: displayTeam,
            date,
        };
    });

    // Fancy bets (only DELETED)
    const fancyBets = (betHistoryData?.data || []).filter(
        (bet: any) => bet.bet_type === 'FANCY' && bet.status === 'DELETED'
    ) as FancyBetData[];

    const groupedFancyBets = fancyBets.reduce(
        (acc: Record<string, FancyBetData[]>, bet: FancyBetData) => {
            const runnerName = bet.runner_name || 'Unknown';
            if (!acc[runnerName]) acc[runnerName] = [];
            acc[runnerName].push(bet);
            return acc;
        },
        {}
    );

    // Match table
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
                                        <TableCell>
                                            {row.userName} ({row.client})
                                        </TableCell>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: '20px',
                                                    fontWeight: 'bold',
                                                    color: '#fff',
                                                    backgroundColor:
                                                        row.selection === 'Back' ? '#83c2fc' : '#fda4b4',
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        mr: 0.5,
                                                        color: '#000',
                                                    }}
                                                >
                                                    {row.selection}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        background: '#fff',
                                                        borderRadius: '20px',
                                                        color: '#000',
                                                        padding: '1px 8px',
                                                    }}
                                                >
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

    // Mobile Layout
    if (isMobile) {
        return (
            <Box p={2}>
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
                </Card>

                {/* Match */}
                <Accordion defaultExpanded>
                    <AccordionSummary
                        expandIcon={
                            <Iconify icon="eva:arrow-ios-downward-fill" width={20} height={20} />
                        }
                    >
                        <Typography variant="subtitle1" fontWeight="bold">
                            Match
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>{renderMatchTable()}</AccordionDetails>
                </Accordion>

                {/* Fancy Bets */}
                <Accordion>
                    <AccordionSummary
                        expandIcon={
                            <Iconify icon="eva:arrow-ios-downward-fill" width={20} height={20} />
                        }
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
                                        <Box
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="center"
                                        >
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
                                                        <img
                                                            src={win}
                                                            alt="win"
                                                            style={{ width: 20, marginRight: 8 }}
                                                        />
                                                        <Typography
                                                            color="#000"
                                                            fontWeight="bold"
                                                            fontSize="0.8rem"
                                                        >
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

                                        <Collapse
                                            in={!!openSections[runnerName]}
                                            timeout="auto"
                                            unmountOnExit
                                        >
                                            <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                            <Paper sx={{ mt: 1 }}>
                                                <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                                                    <Table size="small" sx={{ minWidth: 700 }}>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Run</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>YES/NOT</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
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
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                px: 2,
                                                                                py: 0.5,
                                                                                borderRadius: '20px',
                                                                                fontWeight: 'bold',
                                                                                color: '#fff',
                                                                                backgroundColor:
                                                                                    bet.selection === 'Yes'
                                                                                        ? '#83c2fc'
                                                                                        : '#fda4b4',
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    fontWeight: 'bold',
                                                                                    mr: 0.5,
                                                                                    color: '#000',
                                                                                }}
                                                                            >
                                                                                {bet.selection}
                                                                            </Typography>
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    fontWeight: 'bold',
                                                                                    background: '#fff',
                                                                                    borderRadius: '20px',
                                                                                    color: '#000',
                                                                                    padding: '1px 8px',
                                                                                }}
                                                                            >
                                                                                {Number(bet.odds_rate).toFixed(0)}
                                                                            </Typography>
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>₹{bet.stake_amount.toLocaleString()}</TableCell>
                                                                    <TableCell>
                                                                        {(() => {
                                                                            const date = new Date(bet.createdAt);
                                                                            const day = String(date.getDate()).padStart(2, '0');
                                                                            const month = String(date.getMonth() + 1).padStart(
                                                                                2,
                                                                                '0'
                                                                            );
                                                                            const year = String(date.getFullYear()).slice(-2);
                                                                            const hours = String(date.getHours()).padStart(2, '0');
                                                                            const minutes = String(date.getMinutes()).padStart(
                                                                                2,
                                                                                '0'
                                                                            );
                                                                            const seconds = String(date.getSeconds()).padStart(2, '0');
                                                                            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                                                                        })()}
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
            </Box>
        );
    }

    // Desktop Layout
    return (
        <Box>
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
            </Card>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" mb={2} sx={{ fontWeight: 'bold' }}>
                                Match
                            </Typography>
                            {renderMatchTable()}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
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
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="space-between"
                                            >
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
                                                            <Typography
                                                                color="#000000"
                                                                variant="subtitle1"
                                                                fontWeight="bold"
                                                            >
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
                                        <TableCell sx={{ p: 0 }}>
                                            <Collapse
                                                in={openSections[runnerName]}
                                                timeout="auto"
                                                unmountOnExit
                                            >
                                                <Box p={1}>
                                                    <TableContainer>
                                                        <Table size="small" sx={{ minWidth: 600 }}>
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>Run</TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                                        YES/NOT
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>
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
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    px: 2,
                                                                                    py: 0.5,
                                                                                    borderRadius: '20px',
                                                                                    fontWeight: 'bold',
                                                                                    color: '#fff',
                                                                                    backgroundColor:
                                                                                        bet.selection === 'Yes'
                                                                                            ? '#83c2fc'
                                                                                            : '#fda4b4',
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        fontWeight: 'bold',
                                                                                        mr: 0.5,
                                                                                        color: '#000',
                                                                                    }}
                                                                                >
                                                                                    {bet.selection}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        fontWeight: 'bold',
                                                                                        background: '#fff',
                                                                                        borderRadius: '20px',
                                                                                        color: '#000',
                                                                                        padding: '1px 8px',
                                                                                    }}
                                                                                >
                                                                                    {Number(bet.odds_rate).toFixed(0)}
                                                                                </Typography>
                                                                            </Box>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            ₹{bet.stake_amount.toLocaleString()}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {(() => {
                                                                                const date = new Date(bet.createdAt);
                                                                                const day = String(date.getDate()).padStart(2, '0');
                                                                                const month = String(
                                                                                    date.getMonth() + 1
                                                                                ).padStart(2, '0');
                                                                                const year = String(
                                                                                    date.getFullYear()
                                                                                ).slice(-2);
                                                                                const hours = String(
                                                                                    date.getHours()
                                                                                ).padStart(2, '0');
                                                                                const minutes = String(
                                                                                    date.getMinutes()
                                                                                ).padStart(2, '0');
                                                                                const seconds = String(date.getSeconds()).padStart(2, '0');
                                                                                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                                                                            })()}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ))}
                </Grid>
            </Grid>
        </Box>
    );
}