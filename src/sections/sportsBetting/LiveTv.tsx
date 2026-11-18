import { useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import {
    Box,
    Grid,
    Paper,
    Button,
    Collapse,
    Typography,
    useTheme,
    useMediaQuery,
} from '@mui/material';

import useApi from 'src/server/axios/index';
import { Iconify } from 'src/components/iconify';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

const LiveTv = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [isLiveTvExpanded, setIsLiveTvExpanded] = useState(false);
    const [scorecardUrl, setScorecardUrl] = useState<string>('');
    const [streamProvider, setStreamProvider] = useState<string>('Diamond');
    const { get } = useApi();

    const targetId = gameId || '34154017';

    const defaultScoreboardHeight = isMobile ? 118 : 142;
    const [scoreboardHeight, setScoreboardHeight] = useState<number>(defaultScoreboardHeight);

    useEffect(() => {
        setScoreboardHeight(defaultScoreboardHeight);
    }, [defaultScoreboardHeight]);

    useEffect(() => {
        const handleScoreboardMessage = (event: MessageEvent) => {
            if (!event?.data) return;
            const { data } = event;
            let newHeight: number | null = null;
            if (
                data.type === 'scoreboard:resize' ||
                data.type === 'SCORECARD_RESIZE' ||
                data.type === 'scorecard_height'
            ) {
                newHeight = Number(data.height);
            } else if (data.height && !Number.isNaN(Number(data.height))) {
                newHeight = Number(data.height);
            }
            if (newHeight && newHeight >= 80 && newHeight <= 600) {
                setScoreboardHeight(newHeight);
            }
        };

        window.addEventListener('message', handleScoreboardMessage);
        return () => window.removeEventListener('message', handleScoreboardMessage);
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await get(Endpoints.SettingGet);
                if (res?.data?.stream_provider) {
                    setStreamProvider(res.data.stream_provider);
                }
            } catch (err) {
                console.error('Error fetching stream settings:', err);
            }
        };
        fetchSettings();
    }, [get]);

    useEffect(() => {
        let isMounted = true;

        if (targetId) {
            const scorecardBase =
                typeof window !== 'undefined' && window.location.hostname.includes('testingexch')
                    ? 'https://testingexch.com'
                    : 'https://highphone11.com';
            const defaultUrl = `${scorecardBase}/scorecard/?etid=4&gmid=${targetId}&v=6&theme=dark`;
            setScorecardUrl(defaultUrl);

            const fetchScorecard = async () => {
                try {
                    const res = await get(`${Endpoints.PublicScorecard}?gmid=${targetId}&etid=4`);
                    if (res?.scorecard_url && isMounted) {
                        setScorecardUrl(res.scorecard_url);
                    }
                } catch (err) {
                    console.error('Error fetching scorecard url:', err);
                }
            };

            fetchScorecard();
        }

        return () => {
            isMounted = false;
        };
    }, [targetId, get]);

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
                <Box sx={{ backgroundColor: '#09101c', p: 0 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#09101c',
                            borderRadius: { xs: 1, md: 2 },
                            overflow: 'hidden',
                            height: `${scoreboardHeight}px`,
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <iframe
                            src={scorecardUrl || `https://${typeof window !== 'undefined' && window.location.hostname.includes('testingexch') ? 'testingexch.com' : 'highphone11.com'}/scorecard/?etid=4&gmid=${targetId}&v=6&theme=dark`}
                            style={{
                                width: '100%',
                                height: `${scoreboardHeight}px`,
                                border: 'none',
                                background: 'transparent',
                                display: 'block',
                                overflow: 'hidden',
                                transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            allowFullScreen
                            loading="eager"
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
                        {(() => {
                            const targetStreamId = targetId || gameId;
                            const streamBase =
                                typeof window !== 'undefined' && window.location.hostname.includes('testingexch')
                                    ? 'https://testingexch.com'
                                    : 'https://highphone11.com';
                            const streamSrc = streamProvider === 'Diamond'
                                ? `${streamBase}/stream?id=${encodeURIComponent(targetStreamId || '')}`
                                : `https://video.proexch.in/tv/v4/stream/${encodeURIComponent(gameId || targetStreamId || '')}`;

                            return targetStreamId ? (
                                <iframe
                                    src={streamSrc}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                    }}
                                    allowFullScreen
                                    loading="lazy"
                                    title="Live TV Stream"
                                />
                            ) : (
                                <Typography sx={{ color: '#94a3b8', fontSize: '14px' }}>
                                    Stream currently unavailable for this match
                                </Typography>
                            );
                        })()}
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