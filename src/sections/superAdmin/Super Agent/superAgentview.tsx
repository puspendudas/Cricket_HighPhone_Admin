
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SuperAgentTableData } from './superAgentTableData';

// ----------------------------------------------------------------------

export function SuperAgentview() {
  return (
    <DashboardContent>
      <SuperAgentTableData/>
    </DashboardContent>
  );
}
