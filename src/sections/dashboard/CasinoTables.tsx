import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Card, Grid, Chip, CardMedia, Typography } from '@mui/material';

import Oneday from '../../../public/assets/dashbordimg/TEEN_ONEDAY.jpeg';
import Lucky from '../../../public/assets/dashbordimg/LUCKY_7.jpeg';
import Teenpati from '../../../public/assets/dashbordimg/TEEN_20.jpeg';
import Dregantiger from '../../../public/assets/dashbordimg/DT_20.jpeg';

// Card Data
const casinoGames = [
  { name: 'Teen Patti T-20', image: Teenpati, path: '/casino/teen20' },
  { name: 'Dragon Tiger T-20', image: Dregantiger, path: '/casino/dt20' },
  { name: 'Teen Patti One Day', image: Oneday, path: '/casino/teen' },
  { name: 'Lucky 7', image: Lucky, path: '/casino/lucky7eu' },
];

const CasinoTables: React.FC = () => {
  const navigate = useNavigate();

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '0.95rem', sm: '1.15rem' },
            color: 'text.primary',
          }}
        >
          Casino Tables
        </Typography>
        <Chip
          size="small"
          label={`${casinoGames.length} Tables`}
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'primary.lighter', color: 'primary.darker' }}
        />
      </Box>

      {/* Grid displaying all casino tables at once with NO scroll */}
      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        {casinoGames.map((game, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Card
              onClick={() => navigate(game.path)}
              sx={{
                height: { xs: 85, sm: 100, md: 110 },
                borderRadius: 1.5,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0px 4px 14px rgba(0, 167, 111, 0.25)',
                  borderColor: 'primary.main',
                },
              }}
            >
              <CardMedia
                component="img"
                image={game.image}
                alt={game.name}
                sx={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
                  p: 0.75,
                  pt: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: { xs: '0.72rem', sm: '0.8rem' },
                    display: 'block',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}
                  noWrap
                >
                  {game.name}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CasinoTables;
