

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TotalProfitTableData } from './TotalProfitTableData';

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

      <TotalProfitTableData/>
    </DashboardContent>
  );
}
