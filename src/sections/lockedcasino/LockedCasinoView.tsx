

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LockedcasinoTableData } from './LockedcasinoTableData';

// ----------------------------------------------------------------------

export function LockedCasinoView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Locked Casino"
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <LockedcasinoTableData/>
    </DashboardContent>
  );
}
