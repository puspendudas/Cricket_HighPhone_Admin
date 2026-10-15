
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AgentTableData } from './AgentTableData';

// ----------------------------------------------------------------------

export function Agentview() {
  return (
    <DashboardContent>
      <AgentTableData/>
    </DashboardContent>
  );
}
