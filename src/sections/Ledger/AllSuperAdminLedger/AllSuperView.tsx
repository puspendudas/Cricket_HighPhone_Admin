

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AllSuperTableData } from './AllSuperTableData';

// ----------------------------------------------------------------------

export function AllSuperView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Settlement "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AllSuperTableData/>
    </DashboardContent>
  );
}
