import { DashboardContent } from 'src/layouts/dashboard';
import { Box, Typography } from '@mui/material';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AllCommissionData } from './AllCommissionData';
import { CasinoCommissionData } from './CasinoCommissionData';

// ----------------------------------------------------------------------

export function CommissionView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="कमीशन लेन देन"
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AllCommissionData/>

      {/* <Box sx={{ mt: 5 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Casino Commissions</Typography>
        <CasinoCommissionData />
      </Box> */}
    </DashboardContent>
  );
}
