import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { CasinoManagementView } from 'src/sections/casinoManagement/CasinoManagementView';

// ----------------------------------------------------------------------

const metadata = { title: `Casino Management | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <CasinoManagementView />
    </>
  );
}
