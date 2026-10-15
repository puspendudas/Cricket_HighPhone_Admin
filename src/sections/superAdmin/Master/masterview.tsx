
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MasterTableData } from './masterTableData';

// ----------------------------------------------------------------------

export function Masterview() {
  return (
    <DashboardContent>
      <MasterTableData/>
    </DashboardContent>
  );
}
