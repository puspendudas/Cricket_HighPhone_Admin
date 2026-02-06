import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminReportView } from 'src/sections/allSuperAdminReport/AdminReportView';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AdminReportView />
    </>
  );
}
