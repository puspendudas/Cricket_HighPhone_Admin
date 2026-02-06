import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useDashboardApi = () => {
  const { get } = useApi();

  const fetchDashboardData = async () => {
    try {
      const response = await get(`${Endpoints.Dashboard}`);
      return response;
    } catch (error) {
      console.error('Error Dashboard', error);
      toast.error('Failed to fetch Dashboard Data');
      throw error;
    }
  };

  return {
    fetchDashboardData,
  };
};

export default useDashboardApi;