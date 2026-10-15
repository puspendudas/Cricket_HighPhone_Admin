

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CricketTableData } from './cricketTableData';

// ----------------------------------------------------------------------

export function Cricketview() {
  return (
    <DashboardContent>
      <CricketTableData/>
    </DashboardContent>
  );
}
