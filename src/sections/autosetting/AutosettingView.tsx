

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AutosettingData } from './AutosettingData';

// ----------------------------------------------------------------------

export function AutosettingView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Auto Setting"
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AutosettingData/>
    </DashboardContent>
  );
}
