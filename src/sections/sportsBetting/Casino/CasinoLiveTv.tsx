import React from 'react';

import { Box } from '@mui/material';

type CasinoLiveTvProps = {
    gtype: string;
};

const CasinoLiveTv: React.FC<CasinoLiveTvProps> = ({ gtype }) => (
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
            <iframe
                src={`https://stream-s-43.uhdmovies.online/casino-stream?id=${gtype.toLowerCase()}`}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
                referrerPolicy="no-referrer"
                allowFullScreen
                loading="lazy"
                title="Live TV Stream"
            />
        </Box>
    );

export default CasinoLiveTv;
