

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CasinoTableData } from './CasinoTableData';

// ----------------------------------------------------------------------

export function Casinoview() {
  return (
    <DashboardContent>
      <CasinoTableData/>
    </DashboardContent>
  );
}
