

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AdminReportTableData } from './AdminReportTableData';

// ----------------------------------------------------------------------

export function AdminReportView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="All Admin Report "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AdminReportTableData/>
    </DashboardContent>
  );
}
