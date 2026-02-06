import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { Masterview } from 'src/sections/superAdmin/Master/view';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <Masterview />
    </>
  );
}
