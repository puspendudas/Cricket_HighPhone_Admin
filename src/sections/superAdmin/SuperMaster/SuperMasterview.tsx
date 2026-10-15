
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SuperMasterTable } from './superMasterTable';

// ----------------------------------------------------------------------

export function SuperMasterview() {
  return (
    <DashboardContent>
      <SuperMasterTable/>
    </DashboardContent>
  );
}
