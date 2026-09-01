import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { PowerUserview } from 'src/sections/superAdmin/PowerUser/view';

// ----------------------------------------------------------------------

const metadata = { title: `Power User | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PowerUserview />
    </>
  );
}
