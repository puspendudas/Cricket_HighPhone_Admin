
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AgentTableData } from './AgentTableData';

// ----------------------------------------------------------------------

export function Agentview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Agent"
        links={[
          { name: 'Dashboard', href: paths.dashboard.master.masters },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AgentTableData/>
    </DashboardContent>
  );
}
