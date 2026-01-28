

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ChildTableData } from './ChildTableData';

// ----------------------------------------------------------------------

export function SuperAdminView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Child Ledger "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ChildTableData/>
    </DashboardContent>
  );
}
