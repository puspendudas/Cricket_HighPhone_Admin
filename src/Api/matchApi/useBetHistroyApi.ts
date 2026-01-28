// useEmployeeApi.ts


import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useBetHistroyApi = () => {
  const { get, deleted } = useApi();

  const fetchBetUndlecarHistory = async (match_id: string) => {
    try {
      const response = await get(`${Endpoints.useBetHistroy}/${match_id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Bet History', error);
      toast.error('Failed to fetch Bet History');
      throw error;
    }
  };
  const fetchBetHistory = async (match_id: string, userId: String) => {
    try {
      const response = await get(`${Endpoints.useBetHistroy}/${match_id}/admin/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetch Bet History', error);
      toast.error('Failed to fetch Bet History');
      throw error;
    }
  };
  const deleteBetHistory = async (matchId: string) => {
    try {
      const response = await deleted(`${Endpoints.CancelSingleBetMatch}/${matchId}`);
      toast.success('Bet History deleted successfully');
      return response;
    } catch (error) {
      console.error('Error deleting Bet History', error);
      toast.error('Failed to delete Bet History');
      throw error;
    }
  };

  return {
    fetchBetHistory,
    deleteBetHistory,
    fetchBetUndlecarHistory
  };
};

export default useBetHistroyApi;


