import React, { useState } from 'react';

import { Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import Match from './Match';
import Session from './Session';

const UnDeclaredMatch = () => {
  const [buttonType, setButtonType] = useState<'Match' | 'Session'>('Match');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="UnDeclared Match"
        links={[{ name: '' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Toggle Buttons */}
      <Grid container justifyContent={{ xs: 'center', sm: 'flex-start' }} mb={2}>
        <ToggleButtonGroup
          value={buttonType}
          exclusive
          onChange={(_, newValue) => newValue && setButtonType(newValue)}
          sx={{
            borderRadius: '30px',
            overflow: 'hidden',
            '& .MuiToggleButton-root': {
              px: 3,
              py: 1.2,
              textTransform: 'none',
              border: '1px solid gray',
              '&.Mui-selected': {
                backgroundColor: 'black',
                color: 'white',
                boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
              },
              '&:hover': {
                backgroundColor: 'gray',
                color: 'white',
              },
            },
          }}
        >
          <ToggleButton value="Match">Match</ToggleButton>
          <ToggleButton value="Session">Session</ToggleButton>
        </ToggleButtonGroup>
      </Grid>

      {/* Content */}
      <Grid>{buttonType === 'Match' ? <Match /> : <Session />}</Grid>
    </DashboardContent>
  );
};

export default UnDeclaredMatch;
