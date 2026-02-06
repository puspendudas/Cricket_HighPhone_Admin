
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MasterTableData } from './masterTableData';

// ----------------------------------------------------------------------

export function Masterview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Master"
        links={[
          { name: 'Dashboard', href: paths.dashboard.master.masters },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <MasterTableData/>
    </DashboardContent>
  );
}
