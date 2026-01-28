import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ClienView } from 'src/sections/superAdmin/Client/view';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ClienView />
    </>
  );
}
