import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PowerUserTableData } from './PowerUserTableData';

// ----------------------------------------------------------------------

export function PowerUserview() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Power User"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Power User' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PowerUserTableData />
    </DashboardContent>
  );
}
