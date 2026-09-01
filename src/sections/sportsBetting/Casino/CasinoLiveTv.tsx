import React, { useState, useEffect } from 'react';

import { Box, CircularProgress } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

type CasinoLiveTvProps = {
    gtype: string;
};

const CasinoLiveTv: React.FC<CasinoLiveTvProps> = ({ gtype }) => {
    const [streamUrl, setStreamUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const fetchStream = async () => {
            if (!gtype) return;
            const normalizedGtype = gtype.toLowerCase();
            const fallbackUrl = `https://stream-s-43.uhdmovies.online/casino-stream?id=${normalizedGtype}`;

            try {
                setLoading(true);
                const res = await axiosInstance.get(`${endpoints.casino.streamUrl}?id=${normalizedGtype}`, { timeout: 8000 });

                if (isMounted) {
                    const fetchedUrl = res?.data?.stream_url || res?.data?.data?.stream_url;
                    if (fetchedUrl) {
                        setStreamUrl(fetchedUrl);
                    } else {
                        setStreamUrl(fallbackUrl);
                    }
                }
            } catch (err) {
                console.error('[CasinoLiveTv] Error fetching stream URL, using fallback:', err);
                if (isMounted) {
                    setStreamUrl(fallbackUrl);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStream();

        return () => {
            isMounted = false;
        };
    }, [gtype]);

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1, // Behind the absolute positioned cards
            }}
        >
            {loading && !streamUrl && (
                <CircularProgress size={36} sx={{ color: '#ffb300' }} />
            )}
            {streamUrl && (
                <iframe
                    src={streamUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                    referrerPolicy="no-referrer"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen"
                    loading="lazy"
                    title="Live TV Stream"
                />
            )}
        </Box>
    );
};

export default CasinoLiveTv;

