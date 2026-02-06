import React, { useState } from 'react';

import {
    Box,
    Grid,
    Paper,
    Button,
    Collapse,
    Typography,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

const LiveTv = () => {
    const [isLiveTvExpanded, setIsLiveTvExpanded] = useState(false);

    const toggleLiveTv = () => {
        setIsLiveTvExpanded(!isLiveTvExpanded);
    };

    return (
        <Box sx={{ p: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
            {/* Header Buttons */}
            <Grid container justifyContent="flex-end" spacing={2}>
                <Grid item>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#F32D2D',
                            borderRadius: '20px',
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            px: 2,
                            '&:hover': {
                                backgroundColor: '#d42b2b',
                            },
                        }}
                    >
                        Bet Locked
                    </Button>
                </Grid>
                <Grid item>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#1C1C1C',
                            borderRadius: '20px',
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            px: 2,
                        }}
                    >
                        Fancy Lock
                    </Button>
                </Grid>
            </Grid>

            {/* Score Card */}
            <Paper elevation={3} sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
                <Box
                    sx={{
                        backgroundColor: '#3b75ff',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                    }}
                >
                    <Box display="flex" alignItems="center">
                        <Button onClick={toggleLiveTv}>
                            <Iconify
                                icon="mdi:television"
                                width={20}
                                height={20}
                                color='#FF3333'
                                sx={{
                                    mr: 1,
                                    animation: 'pulse 1.5s infinite',
                                    '@keyframes pulse': {
                                        '0%': { opacity: 1 },
                                        '50%': { opacity: 0.6 },
                                        '100%': { opacity: 1 },
                                    }
                                }}
                            />
                            Live TV
                        </Button>
                    </Box>
                </Box>

                {/* Team Info */}
                <Box sx={{ backgroundColor: '#1e1e1e', px: 2, py: 2 }}>
                    <Grid container alignItems="center">
                        <Grid item xs={5} textAlign="left">
                            <Typography sx={{ color: '#FFD700', fontSize: 12 }}>SL W</Typography>
                            <Typography sx={{ color: '#FFD700', fontWeight: 'bold' }}>Sunrisers Hyderabad</Typography>
                            <Grid item xs={12} mt={1}>
                                <Typography sx={{ color: '#FFD700', fontSize: 12 }}>CRR 4.70</Typography>
                            </Grid>
                        </Grid>
                        <Grid item xs={5} textAlign="left">
                            <Typography sx={{ color: '#FFD700', fontSize: 12 }}>SA W</Typography>
                            <Typography sx={{ color: '#FFD700', fontWeight: 'bold' }}>Chennai Super Kings</Typography>
                        </Grid>

                        {/* Score Bubbles */}
                        <Grid item xs={12} mt={2} display="flex" justifyContent="center" gap={1}>
                            {[2, 3, 4, 1, 6, 0].map((score, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        backgroundColor: '#D32F2F',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                    }}
                                >
                                    {score}
                                </Box>
                            ))}
                        </Grid>
                    </Grid>
                </Box>

                {/* Live TV Expanded Content */}
                <Collapse in={isLiveTvExpanded}>
                    <Box sx={{ 
                        backgroundColor: '#000', 
                        height: '300px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderTop: '1px solid #333'
                    }}>
                        <Typography sx={{ color: '#fff' }}>
                            Live TV Stream Will Appear Here
                        </Typography>
                    </Box>
                </Collapse>

                {/* Bottom Message */}
                <Box
                    sx={{
                        backgroundColor: '#f8bcbc',
                        textAlign: 'center',
                        py: 1,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                    }}
                >
                    <Typography sx={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>
                        SL W NEEDED 189 RUNS FROM 240 BALLS
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default LiveTv;