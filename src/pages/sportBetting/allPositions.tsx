import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AllPositionsview } from 'src/sections/sportsBetting/All Positions/AllPositionsview';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AllPositionsview />
    </>
  );
}
