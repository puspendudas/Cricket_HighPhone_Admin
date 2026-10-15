
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ClientTableData } from './ClientTableData';

// ----------------------------------------------------------------------

export function ClienView() {
  return (
    <DashboardContent>
      <ClientTableData/>
    </DashboardContent>
  );
}
