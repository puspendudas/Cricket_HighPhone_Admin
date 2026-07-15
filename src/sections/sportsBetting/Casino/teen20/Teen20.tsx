import React from 'react';

import { Box, Button, Card, Divider, Grid, Paper, Stack, Typography, useTheme, useMediaQuery } from '@mui/material';

import CasinoLiveTv from '../CasinoLiveTv';
import { useCasinoSocket } from '../../../../hooks/useCasinoSocket';

export default function Teen20() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const gtype = 'teen20';
  const { oddsData, resultsData } = useCasinoSocket(gtype);

  const roundId = oddsData?.mid || 'Waiting...';
  const timeLeft = oddsData?.lt !== undefined ? oddsData.lt : '-';
  
  const playerRows = oddsData?.sub?.filter((item: any) => item.subtype === "Player") || [];
  const cardsArr = oddsData?.card ? oddsData.card.split(',') : ['1','1','1','1','1','1'];
  
  const title = '20-20 TEENPATTI';

  const getWinnerName = (res: any) => {
    let winner = '?';
    if (res.win === "1") winner = 'A';
    else if (res.win === "2") winner = 'B';
    return winner;
  };

  const getWinnerColor = (winner: string) => {
    if (winner === 'A') return '#FF4B4B';
    if (winner === 'B') return '#16C75A';
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
    const myCards = idx === 0 
      ? [cardsArr[0], cardsArr[2], cardsArr[4]] 
      : [cardsArr[1], cardsArr[3], cardsArr[5]];

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
        <Typography sx={{ color: '#FFF', fontWeight: 'bold', fontSize: size === 'mobile' ? '10px' : '14px', mb: 0.5 }}>
          {player.nat || player.name || `PLAYER ${idx === 0 ? 'A' : 'B'}`}
        </Typography>
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
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
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

            <Box sx={{ position: 'absolute', top: { xs: 8, md: 16 },  left: { xs: 8, md: 16 }, zIndex: 10, display: 'flex', gap: { xs: 1, md: 2 } }}>
              {playerRows.slice(0,2).map((p: any, idx: number) => (
                <Box key={idx} sx={{ bgcolor: 'rgba(0,0,0,0.6)', p: { xs: 0.5, md: 1 }, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {renderPlayerCards(p, idx, isMobile ? 'mobile' : 'desktop')}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Odds Table */}
          <Card sx={{ borderRadius: '12px', overflow: 'hidden', mb: 3 }}>
            <Box sx={{ display: 'flex', bgcolor: '#00A76F', p: 1.5 }}>
              <Box sx={{ flex: 1 }} />
              <Box sx={{ display: 'flex', gap: 1, pr: 1 }}>
                <Box sx={{ width: 60, textAlign: 'center', color: '#d4e6ffff', fontWeight: 'bold', fontSize: '14px' }}>Back</Box>
                <Box sx={{ width: 60, textAlign: 'center', color: '#d4e6ffff', fontWeight: 'bold', fontSize: '14px' }}>Lay</Box>
              </Box>
            </Box>
            {playerRows.map((player: any, idx: number) => {
              const backRate = player.b || player.b1 || player.rate || player.price || '-';
              const layRate = player.l || player.l1 || player.layRate || player.price || '-';
              
              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: '1px solid #E5E7EB' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 'bold', color: '#1F2937' }}>
                      {player.nat || player.name || `PLAYER ${idx === 0 ? 'A' : 'B'}`}
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
