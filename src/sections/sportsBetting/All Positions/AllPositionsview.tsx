

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AllPositionsTableData } from './AllPositionsTableData';

// ----------------------------------------------------------------------

export function AllPositionsview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="All Positions "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AllPositionsTableData/>
    </DashboardContent>
  );
}
