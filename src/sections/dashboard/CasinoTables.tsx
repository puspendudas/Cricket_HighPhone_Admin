import React from 'react';

import { Box, Card, Stack, CardMedia, Typography } from '@mui/material';

import Oneday from '../../../public/assets/dashbordimg/Image Group.png';
import Lucky from '../../../public/assets/dashbordimg/9b0a5d8814f62081f3c1fb5988b917dc7215162a.png';
// Images
import Teenpati from '../../../public/assets/dashbordimg/e3eeab773e72493a01a305157f04b0f219fd5d82.png';
import Dregantiger from '../../../public/assets/dashbordimg/f72cf6e55fef786a25aea7bbe5ff629f884e5b99.png';

// Card Data
const casinoGames = [
  { name: 'Teen Patti', image: Teenpati },
  { name: 'Dragon Tiger', image: Dregantiger },
  { name: 'One Day Teen Patti', image: Oneday },
  { name: 'Lucky 7', image: Lucky },
];

const CasinoTables: React.FC = () => 
    <Box
      sx={{
        borderRadius: 2,
        p: 2,
        mt: 3,
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Casino Tables
      </Typography>

      <Stack direction="row" spacing={8} overflow="auto">
        {casinoGames.map((game, index) => (
          <Card
            key={index}
            sx={{
              minWidth: 200,
              maxWidth: 250,
              height: 120,
              borderRadius: 2,
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <CardMedia component="img" image={game.image} alt={game.name} height="120" />
          </Card>
        ))}
      </Stack>
    </Box>


export default CasinoTables;
