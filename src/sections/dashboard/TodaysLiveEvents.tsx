import type { Match } from 'src/Interface/dashboard.interface';

import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Card,
  Chip,
  Stack,
  Typography,
  CardContent,
} from '@mui/material';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

const TodaysLiveEvents: React.FC = () => {
  const { fetchAllMatch } = useMatchApi();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchAllMatch();
        const today = new Date();

        const filteredMatches =
          response?.matches?.filter((match: Match) => {
            const matchDate = new Date(match.eventTime);

            // ✅ condition:
            // 1. declared = false (undeclared)
            // 2. match date <= today (past ya today)
            return match.declared === false && matchDate <= today;
          }) || [];

        setLiveMatches(filteredMatches);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        borderRadius: 2,
        p: 4,
        mt: 3,
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h5" fontWeight="bold">
          Live Events
        </Typography>
      </Box>

      {/* Grid */}
      <Grid container spacing={2}>
        {liveMatches.length > 0 ? (
          <Grid container spacing={2}>
            {liveMatches.map((match) => (
              <Grid item xs={12} sm={6} md={4} key={match._id}>
                <Card
                  sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => navigate(`/cricket-live-match-data/${match.gameId}`)}
                >
                  {/* Gradient Header */}
                  <Box
                    sx={{
                      background: 'linear-gradient(to right, #2979FF, #00C6FF)',
                      p: 1.5,
                    }}
                  >
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: '#fff', textAlign: 'center' }}
                    >
                      {match.eventName}
                    </Typography>
                  </Box>

                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'green' }} />
                      <Typography variant="caption" color="text.secondary">
                        CRICKET
                      </Typography>
                    </Stack>

                    <Typography variant="body2" fontWeight={600} mb={1}>
                      {new Date(match.eventTime).toLocaleString()}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Chip
                        label={
                          <Typography variant="caption">
                            Undeclared
                          </Typography>
                        }
                        sx={{
                          marginTop: '-40px',
                          bgcolor: '#FFEBEE',
                          color: '#D32F2F',
                          fontWeight: 500,
                          borderRadius: '8px',
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px" width="100%">
            <Typography variant="body1" color="text.secondary">
              No Data Found
            </Typography>
          </Box>
        )}
      </Grid>
    </Box>
  );
};

export default TodaysLiveEvents;
