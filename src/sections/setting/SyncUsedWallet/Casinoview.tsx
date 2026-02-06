

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CasinoTableData } from './CasinoTableData';

// ----------------------------------------------------------------------

export function Casinoview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Casino "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CasinoTableData/>
    </DashboardContent>
  );
}
