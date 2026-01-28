import React, { useState } from 'react';

import {
    Box,
    Card,
    Chip,
    Grid,
    Table,
    Paper,
    TableRow,
    Collapse,
    TableBody,
    TableCell,
    TableHead,
    Typography,
    IconButton,
    CardContent,
    TableContainer,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

// Sample image for the win trophy (replace with your actual image path)
import win from '../../../../../public/assets/win.png';

// Transaction interface and data
interface Transaction {
    id: number;
    status: 'YES' | 'NO';
    amount: string;
    date: string;
    time: string;
    clientLine1: string;
    clientLine2: string;
}

interface MatchData {
    client: string;
    amount: number;
    rate: number;
    mode: string;
    team: string;
    date: string;
}

const transactions: Transaction[] = [
    {
        id: 324,
        status: 'YES',
        amount: '₹10000',
        date: 'February 18, 2025',
        time: '06:57:52 PM',
        clientLine1: 'Meh/UU/McSx4A/',
        clientLine2: 'Meh/Ady/Demo(C11)',
    },
    {
        id: 321,
        status: 'NO',
        amount: '₹50000',
        date: 'February 18, 2025',
        time: '06:57:52 PM',
        clientLine1: 'Meh/ADU/McSx4A/',
        clientLine2: 'Meh/Ady/Demo(C11)',
    },
    {
        id: 321,
        status: 'NO',
        amount: '₹50000',
        date: 'February 18, 2025',
        time: '06:57:52 PM',
        clientLine1: 'Meh/ADU/McSx4A/',
        clientLine2: 'Meh/Ady/Demo(C11)',
    },
    {
        id: 324,
        status: 'YES',
        amount: '₹10000',
        date: 'February 18, 2025',
        time: '06:57:52 PM',
        clientLine1: 'Meh/ADU/McSx4A/',
        clientLine2: 'Meh/Ady/Demo(C11)',
    },
    {
        id: 324,
        status: 'YES',
        amount: '₹10000',
        date: 'February 18, 2025',
        time: '06:57:52 PM',
        clientLine1: 'Meh/ADU/McSx4A/',
        clientLine2: 'Meh/Ady/Demo(C11)',
    },
];

const matchData: MatchData[] = [
    {
        client: 'Me(MU4)/Me(SA4)/Me(A6)/Demo(CL11)',
        amount: 50000,
        rate: 0.71,
        mode: 'L',
        team: 'NEZE',
        date: 'February 19, 2025 05:57:52 PM',
    },
    {
        client: 'Me(MU4)/Me(SA4)/Me(A6)/Demo(CL11)',
        amount: 50000,
        rate: 0.71,
        mode: 'K',
        team: 'NEZE',
        date: 'February 19, 2025 05:57:52 PM',
    },
    {
        client: 'Me(MU4)/Me(SA4)/Me(A6)/Demo(CL11)',
        amount: 50000,
        rate: 0.71,
        mode: 'K',
        team: 'NEZE',
        date: 'February 19, 2025 05:57:52 PM',
    },
    {
        client: 'Me(MU4)/Me(SA4)/Me(A6)/Demo(CL11)',
        amount: 50000,
        rate: 0.71,
        mode: 'L',
        team: 'NEZE',
        date: 'February 19, 2025 05:57:52 PM',
    },
];

const getModeColor = (mode: string) => {
    switch (mode) {
        case 'L':
            return 'primary';
        case 'K':
            return 'error';
        default:
            return 'default';
    }
};

const DisplaySessionMatch = () => {
    const [open, setOpen] = useState(false);

    return (
        <Box p={2}>
            {/* Match Header */}
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
                        Chennai Super Kings v Sunrisers Hyderabad
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 3 }}>
                        ( April 25, 2025, 07:30:00 PM )
                    </Typography>
                    <Chip
                        avatar={
                            <img
                                src={win}
                                alt="team-logo"
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                }}
                            />
                        }
                        label="(Chennai Super Kings)"
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
                </CardContent>
            </Card>

            {/* Match Title Again */}
            <Card sx={{ mb: 2, backgroundColor: '#000' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Chennai Super Kings v Sunrisers Hyderabad
                    </Typography>
                </CardContent>
            </Card>

            {/* Team and Amount Section */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        Team
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 1.5 }}>
                                        Sunrisers Hyderabad
                                    </Typography>
                                    <Typography variant="body1">Chennai Super Kings</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        Amount
                                    </Typography>
                                    <Typography color="error" sx={{ mb: 1.5, fontWeight: 'bold' }}>
                                        -₹1383
                                    </Typography>
                                    <Typography color="success.main" sx={{ fontWeight: 'bold' }}>
                                        ₹391
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tables Section */}
            <Grid container spacing={2} mt={2}>
                {/* Left Table: Match Data */}
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" mb={2} sx={{ fontWeight: 'bold' }}>
                                Match
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Rate</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Mode/Team</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {matchData.map((row, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>{row.client}</TableCell>
                                                <TableCell>₹{row.amount.toLocaleString()}</TableCell>
                                                <TableCell>{row.rate}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`${row.mode} | ${row.team}`}
                                                        color={getModeColor(row.mode)}
                                                        sx={{ borderRadius: 1, fontWeight: 'bold' }}
                                                    />
                                                </TableCell>
                                                <TableCell>{row.date}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Table: Expandable Transactions */}
                <Grid item xs={12} md={5}>
                    <TableContainer component={Paper} sx={{ mt: { xs: 2, md: 0 } }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: '#26B8A4' }}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Typography color="#FFFFFF" variant="subtitle1" fontWeight="bold">
                                                50 over runs NZ (PAK vs NZ) adv
                                            </Typography>
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
                                                    style={{
                                                        width: '30px',
                                                        marginRight: '8px',
                                                    }}
                                                />
                                                <Typography color="#000000" variant="subtitle1" fontWeight="bold">
                                                    320
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => setOpen(!open)}
                                                sx={{ color: '#FFFFFF' }}
                                            >
                                                <Iconify
                                                    icon={open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
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
                                        <Collapse in={open} timeout="auto" unmountOnExit>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>-</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>YES/NOT</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {transactions.map((txn, index) => (
                                                        <TableRow key={index} hover>
                                                            <TableCell>
                                                                <div>{txn.clientLine1}</div>
                                                                <div>{txn.clientLine2}</div>
                                                            </TableCell>
                                                            <TableCell>{txn.id}</TableCell>
                                                            <TableCell>
                                                                <Typography
                                                                    bgcolor={txn.status === 'YES' ? 'primary.main' : 'error.main'}
                                                                    borderRadius="18px"
                                                                    textAlign="center"
                                                                    padding="4px 12px"
                                                                    color="#fff"
                                                                    display="inline-block"
                                                                >
                                                                    {txn.status}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>{txn.amount}</TableCell>
                                                            <TableCell>{txn.date}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <Box mt={2} display="flex" flexWrap="wrap" gap={1} justifyContent="center">
                                                {[800, -800, 800, -800, 0].map((value, index) => (
                                                    <Box
                                                        key={index}
                                                        px={2}
                                                        py={0.5}
                                                        borderRadius="18px"
                                                        color="#fff"
                                                        fontWeight="bold"
                                                        fontSize="14px"
                                                        sx={{
                                                            backgroundColor:
                                                                value > 0 ? '#00c853' : value < 0 ? '#d50000' : '#212121',
                                                        }}
                                                    >
                                                        {value}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                </Grid>
                <Grid item xs={12} mt={4} md={12}  >
                    <TableContainer
                        component={Paper}
                        sx={{
                            mt: { xs: 2, md: 0 },
                            width: '100%',
                            overflowX: 'auto',
                            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
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
                                <TableRow>
                                    <TableCell>SUPERADMIN [S1]</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹18380</TableCell>
                                    <TableCell sx={{ color: 'red' }}>₹64400</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹46020</TableCell>
                                    <TableCell sx={{ color: '' }}>₹0</TableCell>
                                    <TableCell sx={{ color: 'red' }}>-₹6120</TableCell>
                                    <TableCell sx={{ color: 'red' }}>-₹6120</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹39900</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹35910</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹3990</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Raju [S4]</TableCell>
                                    <TableCell sx={{ color: 'red' }}>₹74300</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹134000</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹208300</TableCell>
                                    <TableCell sx={{ color: 'red' }}>-₹2229</TableCell>
                                    <TableCell sx={{ color: 'red' }}>-₹20730</TableCell>
                                    <TableCell sx={{ color: 'red' }}>-₹22959</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹185341</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹179781</TableCell>
                                    <TableCell sx={{ color: 'green' }}>₹5560</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                <Grid container spacing={2} mt={18}>
                    <Grid item xs={12}>
                        <Box sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            width: '100%',
                            px: 2
                        }}>
                            <TableContainer
                                component={Paper}
                                sx={{
                                    mt: { xs: 2, md: 2 },
                                    width: '100%',
                                    overflowX: 'auto'
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
                                        <TableRow sx={{ backgroundColor: '#FFC107' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                            <TableCell sx={{ color: 'green' }}>₹55920</TableCell>
                                            <TableCell sx={{ color: 'green' }}>₹198400</TableCell>
                                            <TableCell sx={{ color: 'green' }}>₹254320</TableCell>
                                            <TableCell sx={{ color: 'red' }}>-₹2229</TableCell>
                                            <TableCell sx={{ color: 'red' }}>-₹26850</TableCell>
                                            <TableCell sx={{ color: 'red' }}>-₹29079</TableCell>
                                            <TableCell sx={{ color: 'green' }}>₹225241</TableCell>
                                            <TableCell sx={{ color: 'green' }}>₹215691</TableCell>
                                            <TableCell sx={{ color: 'green' }}>₹9550</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DisplaySessionMatch;