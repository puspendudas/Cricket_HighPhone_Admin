

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CricketTableData } from './cricketTableData';

// ----------------------------------------------------------------------

export function Cricketview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Cricket "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CricketTableData/>
    </DashboardContent>
  );
}
