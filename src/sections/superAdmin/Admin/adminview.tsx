
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AdminTableData } from './adminTableData';

// ----------------------------------------------------------------------

export function Adminview() {
  return (
    <DashboardContent>
      <AdminTableData/>
    </DashboardContent>
  );
}
