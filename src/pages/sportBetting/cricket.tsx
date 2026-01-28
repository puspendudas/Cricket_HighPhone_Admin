import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { Cricketview } from 'src/sections/sportsBetting/Cricket/view';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <Cricketview />
    </>
  );
}
