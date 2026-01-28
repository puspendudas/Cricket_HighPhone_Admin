
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SuperMasterTable } from './superMasterTable';

// ----------------------------------------------------------------------

export function SuperMasterview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Super Master"
        links={[
          { name: 'Dashboard', href: paths.dashboard.master.miniadmin },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SuperMasterTable/>
    </DashboardContent>
  );
}
