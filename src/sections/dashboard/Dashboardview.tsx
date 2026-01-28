import { useState, useEffect } from 'react';

import useMeApi from 'src/Api/me/useMeApi';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import CasinoTables from './CasinoTables';
import TodaysLiveEvents from './TodaysLiveEvents';
import DashboardContant from './DashboardContant';
import UpcomingLiveEvents from './UpcomingLiveEvents';
// ----------------------------------------------------------------------

type Props = {
  title?: string;
};

export function BlankView({ title = 'Blank' }: Props) {
  const [userName, setUserName] = useState<string>('Robert');
  const { fetchMe } = useMeApi();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userResponse = await fetchMe();
        setUserName(userResponse.data.name || 'Robert');
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Hello ${userName} 👋🏻`}
        links={[
          {  },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DashboardContant />
      <CasinoTables />
      <TodaysLiveEvents />
      <UpcomingLiveEvents/>
    </DashboardContent>
  );
}