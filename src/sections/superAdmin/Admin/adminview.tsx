
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AdminTableData } from './adminTableData';

// ----------------------------------------------------------------------

export function Adminview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Admin"
        links={[
          { name: 'Dashboard', href: paths.dashboard.master.admin },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AdminTableData/>
    </DashboardContent>
  );
}
