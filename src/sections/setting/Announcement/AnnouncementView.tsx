

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AnnouncementTableData } from './AnnouncementTableData';

// ----------------------------------------------------------------------

export function AnnouncementView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Announcement "
        links={[
          { name: ''},
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AnnouncementTableData/>
    </DashboardContent>
  );
}
