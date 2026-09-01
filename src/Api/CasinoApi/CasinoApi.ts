import { useCallback } from 'react';
import { toast } from 'sonner';
import axiosInstance, { endpoints } from 'src/utils/axios';

const useCasinoApi = () => {
  const getAdminCasinoReports = useCallback(async (gameCode = '', fromDate = '', toDate = '') => {
    try {
      let url = `${endpoints.casino.reports}?`;
      if (gameCode) url += `game_code=${gameCode}&`;
      if (fromDate) url += `fromDate=${fromDate}&`;
      if (toDate) url += `toDate=${toDate}&`;

      const response = await axiosInstance.get(url);
      if (response && response.data?.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching admin casino reports:', error);
      toast.error('Failed to fetch casino reports');
      return [];
    }
  }, []);

  const getAdminCasinoCommissions = useCallback(
    async (
      page = 1,
      limit = 20,
      startDate = '',
      endDate = '',
      gameCode = '',
      userId = ''
    ) => {
      try {
        let url = `${endpoints.casino.commissions}?page=${page}&limit=${limit}`;
        if (startDate) url += `&startDate=${startDate}&from_date=${startDate}`;
        if (endDate) url += `&endDate=${endDate}&to_date=${endDate}`;
        if (gameCode && gameCode !== 'all') url += `&gameCode=${gameCode}`;
        if (userId && userId !== 'all') url += `&userId=${userId}`;

        const response = await axiosInstance.get(url);
        if (response && response.data?.status === 'success') {
          return response.data.data;
        }
        return null;
      } catch (error) {
        console.error('Error fetching admin casino commissions:', error);
        toast.error('Failed to fetch casino commissions');
        return null;
      }
    },
    []
  );

  const declareCasinoResult = useCallback(
    async (gameCode: string, roundId: string, winningSelection: string) => {
      try {
        const response = await axiosInstance.post(endpoints.casino.declareResult, {
          game_code: gameCode,
          round_id: roundId,
          winning_selection: winningSelection,
        });
        if (response && response.data?.status === 'success') {
          toast.success('Result declared successfully');
          return response.data;
        }

        toast.error(response?.data?.message || 'Failed to declare result');
      } catch (error) {
        console.error('Error declaring casino result:', error);
        toast.error('Failed to declare result');
      }
      return null;
    },
    []
  );

  const getAdminGameBets = useCallback(async (gameCode = '', dateStr = '') => {
    try {
      let url = `${endpoints.casino.gameBets}?`;
      if (gameCode) url += `game_code=${gameCode}&`;
      if (dateStr) url += `date=${dateStr}&`;

      const response = await axiosInstance.get(url);
      if (response && response.data?.status === 'success') {
        return response.data.data;
      }
      return { bets: [], exposure: {}, summary: [] };
    } catch (error) {
      console.error('Error fetching admin game bets:', error);
      toast.error('Failed to fetch game bets');
      return { bets: [], exposure: {}, summary: [] };
    }
  }, []);

  const fetchCasinoTotalData = useCallback(async (_id: string) => {
    try {
      const response = await axiosInstance.get(`${endpoints.casino.allTotal}/${_id}`);
      if (response && response.data?.status === 'success') {
        return response.data;
      }
      return { matches: [] };
    } catch (error) {
      console.error('Error fetching Casino Total Data:', error);
      return { matches: [] };
    }
  }, []);

  const deleteCasinoBet = useCallback(async (betId: string) => {
    try {
      const response = await axiosInstance.delete(`${endpoints.casino.deleteBet}/${betId}`);
      if (response && response.data?.status === 'success') {
        return response.data;
      }
      throw new Error(response?.data?.message || 'Failed to delete bet');
    } catch (error: any) {
      console.error('Error deleting casino bet:', error);
      throw error;
    }
  }, []);

  const deleteMultipleCasinoBets = useCallback(async (betIds: string[]) => {
    try {
      const response = await axiosInstance.post(endpoints.casino.deleteBets, { betIds });
      if (response && response.data?.status === 'success') {
        return response.data;
      }
      throw new Error(response?.data?.message || 'Failed to delete bets');
    } catch (error: any) {
      console.error('Error deleting multiple casino bets:', error);
      throw error;
    }
  }, []);

  return {
    getAdminCasinoReports,
    getAdminCasinoCommissions,
    declareCasinoResult,
    getAdminGameBets,
    fetchCasinoTotalData,
    deleteCasinoBet,
    deleteMultipleCasinoBets,
  };
};

export default useCasinoApi;
