import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
    Box,
    Button,
    Collapse,
    Grid,
    Paper,
    Tooltip,
    // Typography,
    useTheme,
    useMediaQuery,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useBatApi from 'src/Api/batLockApi/useBatApi';
import useApi from 'src/server/axios/index';
import useAutosettingApi from 'src/Api/Autosetting/useAutosettingApi';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

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
    const { get } = useApi();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const toggleLiveTv = () => {
        setIsLiveTvExpanded(!isLiveTvExpanded);
    };
    const marketId = matchData?.match?.marketId;
    const gameid = matchData?.match?.gameId;
    const gmId = matchData?.match?.gmid || matchData?.gmid || matchData?.match?.gameId || matchData?.gameId || matchId;

    const [scoreboardProvider, setScoreboardProvider] = useState<string>('BetFair');
    const [streamProvider, setStreamProvider] = useState<string>('BetFair');
    const [diamondScorecardUrl, setDiamondScorecardUrl] = useState<string>('');
    const { getSettings } = useAutosettingApi();

    // Fetch settings once on mount
    React.useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                const settingsData = await getSettings();
                if (settingsData?.data?.scoreboard_provider) {
                    setScoreboardProvider(settingsData.data.scoreboard_provider);
                }
                if (settingsData?.data?.stream_provider) {
                    setStreamProvider(settingsData.data.stream_provider);
                }
            } catch (error) {
                console.error('Error fetching global settings:', error);
            }
        };
        fetchGlobalSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scorecard URL fetch - only when gmId or scoreboardProvider changes, NOT on every render!
    React.useEffect(() => {
        let isMounted = true;

        if (gmId) {
            const defaultUrl = `https://scorecard.daimond-api.site/?etid=4&gmid=${gmId}`;
            setDiamondScorecardUrl(defaultUrl);

            if (scoreboardProvider === 'Diamond') {
                const fetchScorecardUrl = async () => {
                    try {
                        const res = await get(`${Endpoints.PublicScorecard}?gmid=${gmId}&etid=4`);
                        if (res?.scorecard_url && isMounted) {
                            setDiamondScorecardUrl(res.scorecard_url);
                        }
                    } catch (err) {
                        console.error('Error fetching scorecard url:', err);
                    }
                };

                fetchScorecardUrl();
            }
        }

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gmId, scoreboardProvider]);

    // React Query cached admin profile (shared across pages, 0 extra network requests)
    const { data: userData } = useQuery({
        queryKey: ['userData'],
        queryFn: fetchMe,
        staleTime: 5 * 60 * 1000,
    });

    const adminId = userData?.data?._id ? String(userData.data._id) : null;
    const lockStatus = userData?.lockStatus;
    const parentAdminIds = useMemo<string[]>(
        () => (lockStatus?.parentAdminIds || []).map((pid: any) => String(pid)),
        [lockStatus?.parentAdminIds]
    );
    const isBmLockedByParentGlobal = Boolean(lockStatus?.isBmLockedByParent);
    const isFancyLockedByParentGlobal = Boolean(lockStatus?.isFancyLockedByParent);

    // Live match locks extracted from streaming matchData
    const match = matchData?.match || matchData?.data?.[0]?.match || matchData;
    const bmLocks = useMemo<string[]>(
        () => (Array.isArray(match?.bm_lock) ? match.bm_lock.map((id: any) => String(id)) : []),
        [match?.bm_lock]
    );
    const fancyLocks = useMemo<string[]>(
        () => (Array.isArray(match?.fancy_lock) ? match.fancy_lock.map((id: any) => String(id)) : []),
        [match?.fancy_lock]
    );

    const isMatchBmLockedByParent = Boolean(
        isBmLockedByParentGlobal || (parentAdminIds.length > 0 && bmLocks.some((id: string) => parentAdminIds.includes(id)))
    );
    const isMatchFancyLockedByParent = Boolean(
        isFancyLockedByParentGlobal || (parentAdminIds.length > 0 && fancyLocks.some((id: string) => parentAdminIds.includes(id)))
    );

    const isServerBmLocked = Boolean(adminId && bmLocks.includes(adminId));
    const isServerFancyLocked = Boolean(adminId && fancyLocks.includes(adminId));

    // Optimistic lock overrides: null means follow streaming server/socket feed
    const [optimisticBm, setOptimisticBm] = useState<boolean | null>(null);
    const [optimisticFancy, setOptimisticFancy] = useState<boolean | null>(null);
    const [isBmUpdating, setIsBmUpdating] = useState(false);
    const [isFancyUpdating, setIsFancyUpdating] = useState(false);

    // Sync optimistic state back to null once streaming feed reflects the change
    React.useEffect(() => {
        if (optimisticBm !== null && isServerBmLocked === optimisticBm) {
            setOptimisticBm(null);
        }
    }, [isServerBmLocked, optimisticBm]);

    React.useEffect(() => {
        if (optimisticFancy !== null && isServerFancyLocked === optimisticFancy) {
            setOptimisticFancy(null);
        }
    }, [isServerFancyLocked, optimisticFancy]);

    const isBetLockedByAdmin = optimisticBm !== null ? optimisticBm : isServerBmLocked;
    const isFancyLockedByAdmin = optimisticFancy !== null ? optimisticFancy : isServerFancyLocked;

    // Instant, zero-lag Bet Locked Button Click
    const handleBetLocked = async () => {
        if (!adminId || isBmUpdating || isMatchBmLockedByParent) return;

        const matchObj = matchData?.match || matchData?.data?.[0]?.match || matchData;
        const validMarketId = (matchObj?.marketId && String(matchObj.marketId).trim() !== '0') ? String(matchObj.marketId).trim() : '';
        const targetMarketId = validMarketId || matchObj?.eventId || matchObj?.gameId || matchId || gmId || matchObj?._id;

        if (!targetMarketId) {
            console.error('Market ID not found');
            return;
        }

        const nextLocked = !isBetLockedByAdmin;
        setOptimisticBm(nextLocked);
        setIsBmUpdating(true);

        try {
            const res = await MatchOddsBetLock(adminId, String(targetMarketId));
            if (res && res.isLocked !== undefined) {
                setOptimisticBm(Boolean(res.isLocked));
            }
        } catch (error) {
            console.error('Error in Bet Locked:', error);
            setOptimisticBm(null);
        } finally {
            setIsBmUpdating(false);
        }
    };

    // Instant, zero-lag Fancy Lock Button Click
    const handleFancyLock = async () => {
        if (!adminId || isFancyUpdating || isMatchFancyLockedByParent) return;

        const matchObj = matchData?.match || matchData?.data?.[0]?.match || matchData;
        const validMarketId = (matchObj?.marketId && String(matchObj.marketId).trim() !== '0') ? String(matchObj.marketId).trim() : '';
        const targetMarketId = validMarketId || matchObj?.eventId || matchObj?.gameId || matchId || gmId || matchObj?._id;

        if (!targetMarketId) {
            console.error('Market ID not found');
            return;
        }

        const nextLocked = !isFancyLockedByAdmin;
        setOptimisticFancy(nextLocked);
        setIsFancyUpdating(true);

        try {
            const res = await FancyBetLock(adminId, String(targetMarketId));
            if (res && res.isLocked !== undefined) {
                setOptimisticFancy(Boolean(res.isLocked));
            }
        } catch (error) {
            console.error('Error in Fancy Lock:', error);
            setOptimisticFancy(null);
        } finally {
            setIsFancyUpdating(false);
        }
    };

    // Use CSS classes for button color
    const betLockBtnClass = isBetLockedByAdmin ? 'bet-lock-active' : 'bet-lock-inactive';
    const fancyLockBtnClass = isFancyLockedByAdmin ? 'fancy-lock-active' : 'fancy-lock-inactive';

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
                    onClick={() => navigate(`/deleted-bets/${gameid}`)}
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

                <Tooltip title={isMatchBmLockedByParent ? 'BM Lock is enforced by parent hierarchy' : (isBetLockedByAdmin ? 'Click to unlock BM' : 'Click to lock BM')}>
                    <span>
                        <Button
                            variant="contained"
                            disabled={isMatchBmLockedByParent || isBmUpdating}
                            onClick={handleBetLocked}
                            className={betLockBtnClass}
                            sx={{
                                borderRadius: '20px',
                                color: '#fff',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                px: 2,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                opacity: isMatchBmLockedByParent || isBmUpdating ? 0.6 : 1,
                            }}
                        >
                            {isMatchBmLockedByParent ? 'BM Locked (Parent)' : (isBetLockedByAdmin ? 'BM Locked' : 'BM Lock')}
                        </Button>
                    </span>
                </Tooltip>

                <Tooltip title={isMatchFancyLockedByParent ? 'Fancy Lock is enforced by parent hierarchy' : (isFancyLockedByAdmin ? 'Click to unlock Fancy' : 'Click to lock Fancy')}>
                    <span>
                        <Button
                            variant="contained"
                            disabled={isMatchFancyLockedByParent || isFancyUpdating}
                            onClick={handleFancyLock}
                            className={fancyLockBtnClass}
                            sx={{
                                borderRadius: '20px',
                                color: '#fff',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                px: 2,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                opacity: isMatchFancyLockedByParent || isFancyUpdating ? 0.6 : 1,
                            }}
                        >
                            {isMatchFancyLockedByParent ? 'Fancy Locked (Parent)' : (isFancyLockedByAdmin ? 'Fancy Locked' : 'Fancy Lock')}
                        </Button>
                    </span>
                </Tooltip>
            </Grid>


            {/* Score Card */}
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box
                    sx={{
                        backgroundColor: '#00a76f',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        px: 1,
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
                            height: isMobile ? 200 : 200,
                            width: '100%'
                        }}
                    >
                        <iframe
                            src={scoreboardProvider === 'Diamond' 
                                ? (diamondScorecardUrl || `https://scorecard.daimond-api.site/?etid=4&gmid=${gmId}`)
                                : `https://diamondapi.avrkhub.in/score-card.html?id=${matchId}`}
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
                            height: isMobile ? 220 : 400,
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
                            const targetStreamId = gmId || matchId;
                            const streamSrc = streamProvider === 'Diamond'
                                ? `https://stream-s-43.uhdmovies.online/sports-stream?id=${encodeURIComponent(targetStreamId || '')}`
                                : `https://video.proexch.in/tv/v4/stream/${encodeURIComponent(matchId || targetStreamId || '')}`;

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
                                <Box sx={{ color: '#94a3b8', fontSize: '14px' }}>
                                    Stream currently unavailable for this match
                                </Box>
                            );
                        })()}
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

export default React.memo(LiveTv);