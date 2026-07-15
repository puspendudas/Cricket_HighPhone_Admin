import React, { useState } from 'react';

import { Box, Button, Card, Divider, Grid, Paper, Stack, Typography, useTheme, useMediaQuery, Collapse } from '@mui/material';

import CasinoLiveTv from '../CasinoLiveTv';
import { useCasinoSocket } from '../../../../hooks/useCasinoSocket';

export default function Lucky7eu() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const gtype = 'lucky7eu';
  const { oddsData, resultsData } = useCasinoSocket(gtype);
  const [oddsOpen, setOddsOpen] = useState(true);

  const roundId = oddsData?.mid || 'Waiting...';
  const timeLeft = oddsData?.lt !== undefined ? oddsData.lt : '-';

  const playerRows = oddsData?.sub?.filter((item: any) =>
    item.subtype === "Player" ||
    (item.subtype === gtype && !item.nat?.toLowerCase().includes("tie")) ||
    (item.subtype === "lucky7eu" && !item.nat?.toLowerCase().includes("tie"))
  ) || [];

  const cardsArr = oddsData?.card ? oddsData.card.split(',') : ['1', '1'];

  const title = 'LUCKY 7 - B';

  const getWinnerName = (res: any) => {
    const w = String(res.win ?? res.result ?? '').trim().toUpperCase();
    if (w === '1' || w === 'L') return 'L';
    if (w === '2' || w === 'H') return 'H';
    if (w === '0' || w === 'T') return 'T';
    return w || '?';
  };

  const getWinnerColor = (winner: string) => {
    if (winner === 'L') return '#FF4B4B'; // Red for Low
    if (winner === 'H') return '#5B3DF5'; // Blue/Primary for High
    if (winner === 'T') return '#bb9a2cff';
    return '#757575';
  };

  const getTimerColor = (time: string | number) => {
    if (time === '-' || time === 'Waiting') return '#16C75A';
    const val = typeof time === 'string' ? parseInt(time, 10) : time;
    if (Number.isNaN(val)) return '#16C75A';
    if (val > 10) return '#16C75A';
    if (val >= 6) return '#FF9F43';
    return '#FF4B4B';
  };

  const renderLastResults = () => {
    if (!resultsData || !Array.isArray(resultsData)) return null;
    return (
      <Stack direction="row" spacing={0.5} sx={{ minWidth: 'max-content' }}>
        {resultsData.slice(0, 10).map((res, idx) => {
          const winner = getWinnerName(res);
          return (
            <Box
              key={idx}
              sx={{
                width: { xs: 28, md: 55 },
                height: { xs: 28, md: 55 },
                borderRadius: '50%',
                bgcolor: getWinnerColor(winner),
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {winner}
            </Box>
          );
        })}
      </Stack>
    );
  };

  const renderTimerPill = () => (
    <Box
      sx={{
        bgcolor: getTimerColor(timeLeft),
        color: '#FFF',
        width: { xs: 28, md: 55 },
        height: { xs: 28, md: 55 },
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
      }}
    >
      <Typography sx={{ fontSize: { xs: '14px', md: '24px' }, fontWeight: 'bold', color: "#fff", lineHeight: 1 }}>
        {timeLeft}
      </Typography>
    </Box>
  );

  const renderPlayerCards = (player: any, idx: number, size: string) => {
    const myCards = [cardsArr[idx]];

    let width = 16;
    let height = 24;
    if (size === 'desktop') {
      width = 48;
      height = 68;
    } else if (size === 'tablet') {
      width = 42;
      height = 60;
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box display="flex">
          {myCards.map((cardVal, cIdx) => (
            <Box
              key={cIdx}
              component="img"
              src={`https://g1ver.sprintstaticdata.com/v105/static/front/img/cards/${cardVal || 1}.jpg`}
              sx={{
                width,
                height,
                borderRadius: '2px',
                ml: cIdx > 0 ? '2px' : 0,
                position: 'relative',
                zIndex: cIdx,
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={{ xs: 1.5, md: 3 }}>
        {/* LEFT 70% */}
        <Grid item xs={12} md={8}>

          {/* Header */}
          <Paper sx={{ px: { xs: 1.5, md: 3 }, borderRadius: '6px', bgcolor: '#00A76F', mb: { xs: 1.5, md: 3 }, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontSize: { xs: '14px', md: '18px' }, fontWeight: 'bold', color: '#ebebebff' }}>
                {title}
              </Typography>
              <Typography sx={{ fontSize: { xs: '10px', md: '14px' }, color: '#ebebebff', mt: 0.5 }}>
                Round ID: {roundId}
              </Typography>
            </Box>
            <Button
              variant="text"
              sx={{ color: '#ebebebff', textTransform: 'none', fontWeight: 'bold', fontSize: '14px' }}
            >
              Rules
            </Button>
          </Paper>

          {/* Video */}
          <Box
            sx={{
              position: 'relative',
              bgcolor: '#000',
              borderRadius: { xs: '8px', md: '12px' },
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              mb: { xs: 1.5, md: 3 },
              paddingTop: '56.25%', // 16:9 Aspect Ratio
            }}
          >
            <CasinoLiveTv gtype={gtype} />

            {/* Overlays for all screen sizes */}
            <Box sx={{ position: 'absolute', bottom: { xs: 8, md: 16 }, right: { xs: 8, md: 16 }, zIndex: 10 }}>
              {renderTimerPill()}
            </Box>

            <Box sx={{ position: 'absolute', top: { xs: 8, md: 16 }, left: { xs: 8, md: 16 }, zIndex: 10, display: 'flex', gap: { xs: 1, md: 2 } }}>
              {playerRows.slice(0, 2).map((p: any, idx: number) => (
                <Box key={idx} sx={{ bgcolor: 'rgba(0,0,0,0.6)', p: { xs: 0.5, md: 1 }, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {renderPlayerCards(p, idx, isMobile ? 'mobile' : 'desktop')}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Odds Table */}
          <Card sx={{ borderRadius: '12px', overflow: 'hidden', mb: 3 }}>
            <Box 
              sx={{ display: 'flex', bgcolor: '#00A76F', p: 1.5, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setOddsOpen(!oddsOpen)}
            >
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ color: '#d4e6ffff', fontSize: '14px', ml: 1 }}>{oddsOpen ? '▼' : '▲'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, pr: 1 }}>
                <Box sx={{ width: 60, textAlign: 'center', color: '#d4e6ffff', fontWeight: 'bold', fontSize: '14px' }}>Back</Box>
                <Box sx={{ width: 60, textAlign: 'center', color: '#d4e6ffff', fontWeight: 'bold', fontSize: '14px' }}>Lay</Box>
              </Box>
            </Box>
            <Collapse in={oddsOpen}>
            {playerRows.slice(0, 6).map((player: any, idx: number) => {
              const backRate = player.b || player.b1 || player.rate || player.price || '-';
              const layRate = player.l || player.l1 || player.layRate || player.price || '-';

              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: '1px solid #E5E7EB' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 'bold', color: '#1F2937' }}>
                      {player.nat || player.name || `PLAYER ${idx === 0 ? 'L' : 'H'}`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      sx={{
                        width: 60, height: 40,
                        bgcolor: '#72BBEF', color: '#000',
                        fontWeight: 'bold', fontSize: '16px',
                        '&:hover': { bgcolor: '#5aa9e6' }
                      }}
                    >
                      {backRate}
                    </Button>
                    <Button
                      variant="contained"
                      sx={{
                        width: 60, height: 40,
                        bgcolor: '#FAA9BA', color: '#000',
                        fontWeight: 'bold', fontSize: '16px',
                        '&:hover': { bgcolor: '#f893a6' }
                      }}
                    >
                      {layRate}
                    </Button>
                  </Box>
                </Box>
              );
            })}
            </Collapse>
          </Card>

          {/* Last Results */}
          <Box sx={{ mb: 3, overflowX: 'auto' }}>
            {renderLastResults()}
          </Box>
        </Grid>

        {/* RIGHT 30% */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
              My Bets
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <Typography sx={{ color: '#1f2937', fontSize: '14px' }}>
                No Active Bets
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
