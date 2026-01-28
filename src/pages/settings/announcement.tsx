import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AnnouncementView } from 'src/sections/setting/Announcement/AnnouncementView';

// ----------------------------------------------------------------------

const metadata = { title: `User profile | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AnnouncementView />
    </>
  );
}
