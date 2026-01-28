import React from 'react';

import {
    Box,
    Card,
    Chip,
    Grid,
    Table,
    Paper,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    Typography,
    CardContent,
    TableContainer,
} from '@mui/material';

import LiveTv from './LiveTv';
import win from '../../../../public/assets/win.png';

// Transaction interface and data


interface MatchData {
    client: string;
    amount: number;
    rate: number;
    mode: string;
    team: string;
    date: string;
}


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
const data = [
    {
        team: 'Sunrisers Hyderabad',
        back: 1.04,
        lay: 1.11,
    },
    {
        team: 'Chennai Super Kings',
        back: 0.90,
        lay: 0.95,
    },
];


const sessionData = [
    { session: '15 over run SL W', not: 49, yes: 50 },
    { session: '10.3 over run SL W', not: 'SUSPENDED', yes: 'SUSPENDED' },
    { session: '10.3 over run SL W', not: 'SUSPENDED', yes: 'SUSPENDED' },
    { session: '10.3 over run SL W', not: 'SUSPENDED', yes: 'SUSPENDED' },
    { session: '10.3 over run SL W', not: 'SUSPENDED', yes: 'SUSPENDED' },
    { session: '10.3 over run SL W', not: 'SUSPENDED', yes: 'SUSPENDED' },
    { session: '10.3 over run SL W', not: 'SUSPENDED', yes: 'SUSPENDED' },
    { session: '15 over run SL W', not: 'SUSPENDED', yes: 'SUSPENDED' },
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

const MatchLiveData = () => 
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
                 <LiveTv/>
            </Card>


            {/* Team and Amount Section */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>Team</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>Back</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>Lay</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((row, index) => (
                                    <TableRow
                                        key={index}
                                        sx={{ backgroundColor: '#ffc107', borderBottom: '2px solid white' }}
                                    >
                                        <TableCell>
                                            <Typography fontWeight="bold">{row.team}</Typography>
                                            <Typography variant="caption" color="error">(0)</Typography>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                backgroundColor: '#90caf9',
                                                fontWeight: 'bold',
                                                color: '#000',
                                                fontSize: 18,
                                            }}
                                        >
                                            {row.back}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                backgroundColor: '#f48fb1',
                                                fontWeight: 'bold',
                                                color: '#000',
                                                fontSize: 18,
                                            }}
                                        >
                                            {row.lay}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                    <Card sx={{ mt: '12px' }}>
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

                {/* Right Column - Session Data */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={3}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#3f51b5' }}>
                                    <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>Session</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>Not</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', background: '#078DEE', color: '#fff' }}>Yes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sessionData.map((row, index) => {
                                    const isActive = index === 0;
                                    const isSuspended = row.not === 'SUSPENDED';

                                    return (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                backgroundColor: isActive ? '#ffc107' : 'white',
                                                borderBottom: '2px solid #e0e0e0',
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: isActive ? 'bold' : 'normal' }}>
                                                {row.session}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    backgroundColor: isSuspended ? '#f48fb1' : '#f48fb1',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    color: isSuspended ? '#3b3b3b' : '#000',
                                                    fontSize: 16,
                                                }}
                                            >
                                                {isSuspended ? (
                                                    <Typography sx={{ backgroundColor: '#3b3b3b', color: '#ffc107', borderRadius: 1 }}>
                                                        SUSPENDED
                                                    </Typography>
                                                ) : (
                                                    <>
                                                        <Typography fontWeight="bold">{row.not}</Typography>
                                                        <Typography fontSize={12}>100</Typography>
                                                    </>
                                                )}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    backgroundColor: isSuspended ? '#90caf9' : '#90caf9',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    color: isSuspended ? '#3b3b3b' : '#000',
                                                    fontSize: 16,
                                                }}
                                            >
                                                {isSuspended ? (
                                                    <Typography sx={{ backgroundColor: '#3b3b3b', color: '#ffc107', borderRadius: 1 }}>
                                                        SUSPENDED
                                                    </Typography>
                                                ) : (
                                                    <>
                                                        <Typography fontWeight="bold">{row.yes}</Typography>
                                                        <Typography fontSize={12}>100</Typography>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>
            </Grid>
            <Grid container spacing={2} mt={2}>


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

export default MatchLiveData;