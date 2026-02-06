
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SuperAgentTableData } from './superAgentTableData';

// ----------------------------------------------------------------------

export function SuperAgentview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Super Agent"
        links={[
          { name: 'Dashboard', href: paths.dashboard.master.masters },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SuperAgentTableData/>
    </DashboardContent>
  );
}
