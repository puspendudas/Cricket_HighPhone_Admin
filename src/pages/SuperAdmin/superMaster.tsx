import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { SuperMasterview } from 'src/sections/superAdmin/SuperMaster/SuperMasterview';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <SuperMasterview />
    </>
  );
}
