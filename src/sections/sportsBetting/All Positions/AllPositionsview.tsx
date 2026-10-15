

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AllPositionsTableData } from './AllPositionsTableData';

// ----------------------------------------------------------------------

export function AllPositionsview() {
  return (
    <DashboardContent>
      <AllPositionsTableData/>
    </DashboardContent>
  );
}
