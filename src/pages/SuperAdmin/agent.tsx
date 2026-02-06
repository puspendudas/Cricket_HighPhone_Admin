import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { Agentview } from 'src/sections/superAdmin/Agent/view';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <Agentview />
    </>
  );
}
