import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Box,
    Grid,
    Paper,
    Button,
    Collapse,
    // Typography,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useBatApi from 'src/Api/batLockApi/useBatApi';

import { Iconify } from 'src/components/iconify';

interface LiveTvProps {
    matchId?: string;
    matchData: any
}

const LiveTv: React.FC<LiveTvProps> = ({ matchId, matchData }) => {
    const navigate = useNavigate();
    const [isLiveTvExpanded, setIsLiveTvExpanded] = useState(false);
    const { MatchOddsBetLock, FancyBetLock } = useBatApi();
    const { fetchMe } = useMeApi();

    const toggleLiveTv = () => {
        setIsLiveTvExpanded(!isLiveTvExpanded);
    };

    // Get current admin ID and check lock status
    const [adminId, setAdminId] = useState<string | null>(null);
    const [isBetLockedByAdmin, setIsBetLockedByAdmin] = useState(false);
    const [isFancyLockedByAdmin, setIsFancyLockedByAdmin] = useState(false);




    React.useEffect(() => {
        const checkAdminLockStatus = async () => {
            try {
                const userData = await fetchMe();
                const currentAdminId = userData?.data?._id;
                setAdminId(currentAdminId);

                const match = matchData?.data?.[0]?.match;

                if (currentAdminId && match) {
                    const betLocked = match.bm_lock?.includes(currentAdminId) || false;
                    const fancyLocked = match.fancy_lock?.includes(currentAdminId) || false;

                    setIsBetLockedByAdmin(betLocked);
                    setIsFancyLockedByAdmin(fancyLocked);
                }
            } catch (error) {
                console.error('Error checking admin lock status:', error);
            }
        };

        checkAdminLockStatus();
    }, [fetchMe, matchData]);



    // Handle Bet Locked Button Click
    const handleBetLocked = async () => {
        try {
            if (!adminId) {
                console.error('Admin ID not found');
                return;
            }

            if (!matchId) {
                console.error('Match ID not found');
                return;
            }

            await MatchOddsBetLock(adminId, matchId);

            // Update local state after API call
            setIsBetLockedByAdmin(!isBetLockedByAdmin);
        } catch (error) {
            console.error('Error in Bet Locked:', error);
        }
    };

    // Handle Fancy Lock Button Click
    const handleFancyLock = async () => {
        try {
            if (!adminId) {
                console.error('Admin ID not found');
                return;
            }

            if (!matchId) {
                console.error('Match ID not found');
                return;
            }

            await FancyBetLock(adminId, matchId);

            // Update local state after API call
            setIsFancyLockedByAdmin(!isFancyLockedByAdmin);
        } catch (error) {
            console.error('Error in Fancy Lock:', error);
        }
    };

    // Determine button colors based on lock status
    const betLockedColor = isBetLockedByAdmin ? '#d42b2b' : '#1C1C1C';
    const fancyLockColor = isFancyLockedByAdmin ? '#d42b2b' : '#1C1C1C';

    return (
        <Box sx={{ boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
            {/* Header Buttons */}
            <Grid
                container
                justifyContent="flex-end"
                alignItems="center"
                sx={{
                    p: 1,
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    gap: 1,
                }}
            >
                <Button
                    color="error"
                    variant="contained"
                    onClick={() => navigate(`/deleted-bets/${matchId}`)}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        px: 2,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    Delete Bet
                </Button>

                <Button
                    variant="contained"
                    onClick={handleBetLocked}
                    sx={{
                        backgroundColor: betLockedColor,
                        borderRadius: '20px',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        px: 2,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        '&:hover': { backgroundColor: '#d42b2b' },
                    }}
                >
                    Bet Locked
                </Button>

                <Button
                    variant="contained"
                    onClick={handleFancyLock}
                    sx={{
                        backgroundColor: fancyLockColor,
                        borderRadius: '20px',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        px: 2,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        '&:hover': { backgroundColor: '#d42b2b' },
                    }}
                >
                    Fancy Lock
                </Button>
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
                <Box sx={{ backgroundColor: '#1e1e1e', }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#000',
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: 220,
                        }}
                    >
                        <iframe
                            src={`https://score.proexch.in/#/score1/${matchId}`}
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
                            src={`https://apis.professorji.in/api/tv?eventId=${matchId}&sport=cricket`}
                            
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
                {/* <Box
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
                </Box> */}
            </Paper>
        </Box>
    );
};

export default LiveTv;