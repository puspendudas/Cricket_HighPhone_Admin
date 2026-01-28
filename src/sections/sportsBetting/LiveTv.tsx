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

                {/* Team Info Section (Only Score Iframe) */}
                <Box sx={{ backgroundColor: '#1e1e1e', px: 2, py: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#000',
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: 350,
                        }}
                    >
                        <iframe
                            src="https://apis.professorji.in/api/scorecard?eventId=34154017&sport=cricket"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                            allowFullScreen
                            loading="lazy"
                            title="Live Scoreboard"
                        />
                    </Box>
                </Box>

                {/* Live TV Expanded Content */}
                <Collapse in={isLiveTvExpanded}>
                    <Box
                        sx={{
                            backgroundColor: '#000',
                            height: 400,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderTop: '1px solid #333',
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                            overflow: 'hidden',
                        }}
                    >
                        <iframe
                            src="https://apis.professorji.in/api/tv?eventId=34154017&sport=cricket"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                            allowFullScreen
                            loading="lazy"
                            title="Live TV Stream"
                        />
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