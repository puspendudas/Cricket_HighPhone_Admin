import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PowerUserTableData } from './PowerUserTableData';

// ----------------------------------------------------------------------

export function PowerUserview() {
  return (
    <DashboardContent>
      <PowerUserTableData />
    </DashboardContent>
  );
}
