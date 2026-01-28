

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MatchManagementTableData } from './MatchManagementTableData';

// ----------------------------------------------------------------------

export function MatchManagementView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Match Management "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <MatchManagementTableData/>
    </DashboardContent>
  );
}
