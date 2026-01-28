

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MyLedgerTableData } from './MyLedgerTableData';

// ----------------------------------------------------------------------

export function MyLedgerview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="My Ledger "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <MyLedgerTableData/>
    </DashboardContent>
  );
}
