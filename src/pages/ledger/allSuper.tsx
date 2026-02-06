import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AllSuperView } from 'src/sections/Ledger/AllSuperAdminLedger/AllSuperView';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AllSuperView />
    </>
  );
}
