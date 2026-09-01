import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CasinoManagementContent } from './CasinoManagementContent';

// ----------------------------------------------------------------------

export function CasinoManagementView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Casino Management"
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'Casino Management' },
        ]}
        sx={{ mb: { xs: 2.5, md: 4 } }}
      />

      <CasinoManagementContent />
    </DashboardContent>
  );
}
