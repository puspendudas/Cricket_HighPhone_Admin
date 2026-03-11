import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { CommissionView } from 'src/sections/Ledger/Commission/CommissionView';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <CommissionView />
    </>
  );
}
