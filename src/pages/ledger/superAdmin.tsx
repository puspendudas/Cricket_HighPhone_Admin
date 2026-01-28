import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { SuperAdminView } from 'src/sections/Ledger/SuperAdminLedger/SuperAdminView';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <SuperAdminView />
    </>
  );
}
