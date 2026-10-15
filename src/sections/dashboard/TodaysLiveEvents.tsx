import type { Match } from 'src/Interface/dashboard.interface';

import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { Box, Grid, Card, Chip, Stack, Typography, CardContent } from '@mui/material';

import { formatUTCDateTime12H } from 'src/utils/date';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

import { Iconify } from 'src/components/iconify';

const TodaysLiveEvents: React.FC = () => {
  const { fetchAllMatch } = useMatchApi();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchAllMatch();
        const now = new Date();

        const filteredMatches =
          response?.matches?.filter((match: Match) => {
            const matchDateTime = new Date(match.eventTime);

            // condition: undeclared & past or current
            return !match.declared && matchDateTime <= now;
          }) || [];

        // Sort: Nearest event come first (closest to now first)
        filteredMatches.sort((a: Match, b: Match) => {
          const timeA = new Date(a.eventTime).getTime();
          const timeB = new Date(b.eventTime).getTime();
          return Math.abs(timeA - now.getTime()) - Math.abs(timeB - now.getTime());
        });

        setLiveMatches(filteredMatches);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchAllMatch, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        borderRadius: 2,
        p: { xs: 1.25, sm: 1.75 },
        mt: { xs: 1.5, sm: 2 },
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.05)',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 1, sm: 1.25 }}>
        <Box display="flex" alignItems="center" gap={0.75}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'error.main',
              boxShadow: '0 0 0 3px rgba(255, 86, 48, 0.2)',
              animation: 'pulse 1.8s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(0.95)', opacity: 0.8 },
                '50%': { transform: 'scale(1.2)', opacity: 1 },
                '100%': { transform: 'scale(0.95)', opacity: 0.8 },
              },
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.95rem', sm: '1.15rem' },
              color: 'text.primary',
            }}
          >
            Live Events
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${liveMatches.length} Active`}
          color={liveMatches.length > 0 ? 'error' : 'default'}
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
        />
      </Box>

      {/* Compact Grid */}
      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        {liveMatches.length > 0 ? (
          liveMatches.map((match: Match) => (
            <Grid item xs={12} sm={6} md={4} key={match._id}>
              <Card
                sx={{
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 4px 16px rgba(0, 167, 111, 0.2)',
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => navigate(`/cricket-live-match-data/${match.gameId}`)}
              >
                {/* Theme Gradient Header */}
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #00A76F 0%, #007867 100%)',
                    px: 1.25,
                    py: 0.75,
                    minHeight: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{
                      color: '#fff',
                      textAlign: 'center',
                      lineHeight: 1.25,
                      fontSize: { xs: '0.78rem', sm: '0.84rem' },
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                    noWrap
                  >
                    {match.eventName}
                  </Typography>
                </Box>

                <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify icon="fluent:sport-cricket-24-filled" width={14} sx={{ color: 'primary.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                        CRICKET
                      </Typography>
                    </Stack>
                    <Chip
                      size="small"
                      label="LIVE"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: 'error.lighter',
                        color: 'error.darker',
                        borderRadius: 0.5,
                      }}
                    />
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={0.5} mb={0.75}>
                    <Iconify icon="eva:clock-outline" width={13} sx={{ color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.72rem' }}>
                      {formatUTCDateTime12H(match.eventTime)}
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pt: 0.75,
                      borderTop: '1px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25,
                        fontSize: '0.72rem',
                      }}
                    >
                      Odds
                      <Iconify icon="eva:arrow-forward-outline" width={13} />
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                      ID: {match.gameId}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              py={2.5}
              width="100%"
            >
              <Iconify icon="solar:cup-broken" width={36} sx={{ color: 'text.disabled', mb: 0.75, opacity: 0.5 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                No Live Events at this moment
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TodaysLiveEvents;
