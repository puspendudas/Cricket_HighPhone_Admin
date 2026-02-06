// useEmployeeApi.ts

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useMatchApi = () => {
  const { get, patch, post } = useApi();

  const fetchAllMatchs = async () => {
    try {
      const response = await get(`${Endpoints.fetchAllMatch}`);
      return response;
    } catch (error) {
      console.error('Error fetch Match', error);
      toast.error('Failed to fetch Match');
      throw error;
    }
  };
  const fetchAllMatch = async () => {
    try {
      const response = await get(`${Endpoints.fetchAllMatch}/true`);
      return response;
    } catch (error) {
      console.error('Error fetch Match', error);
      toast.error('Failed to fetch Match');
      throw error;
    }
  };

  const FatchUpdateMatchData = async (id: string) => {
    try {
      const response = await get(`${Endpoints.FatchUpdateMatchData}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Data', error);
      throw error;
    }
  };
  const FatchMatchData = async (id: string) => {
    try {
      const response = await get(`${Endpoints.FatchUpdateMatchData}/${id}/all`);
      return response;
    } catch (error) {
      console.error('Error fetch Data', error);
      throw error;
    }
  };
  const updateTogalStatus = useCallback(
    async (id: string) => {
      try {
        const response = await patch(`${Endpoints.updateStatus}/${id}`, {});
        toast.success('Status updated successfully');
        return response;
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('Failed to toggle status');
        throw error;
      }
    },
    [patch]
  );



  const updateStatusSession = useCallback(
    async (id: string, sid: string) => {
      try {
        const response = await patch(`${Endpoints.updateStatusSession}/${id}/${sid}`, {});
        toast.success('Status updated successfully');
        return response;
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('Failed to toggle status');
        throw error;
      }
    },
    [patch]



  );

  const FatchUpdateMatch = async (id: string) => {
    try {
      const response = await get(`${Endpoints.FatchUpdateData}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Data', error);
      throw error;
    }
  };
  const DeclareMatch = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.DeclareMatch}/${id}`, payload);

        toast.success(response?.data?.message);

        return response;
      } catch (error: any) {
        console.error('Error declaring match:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to declare match';
        toast.error(errorMessage);

        throw error;
      }
    },
    [post]
  );
  const CancelMatch = useCallback(
    async (id: string) => {
      try {
        const response = await post(`${Endpoints.CancelMatch}/${id}`, {});

        toast.success(response?.data?.message);

        return response;
      } catch (error: any) {
        console.error('Error declaring match:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to declare match';
        toast.error(errorMessage);

        throw error;
      }
    },
    [post]
  );
  const DeclarefancyMatch = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.DeclareFancyMatch}/${id}`, payload);
        return response;
      } catch (error: any) {
        console.error('Error declaring fancy session:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to declare fancy session';
        toast.error(errorMessage);
        throw error;
      }
    },
    [post]
  );
  const CancelfancyMatch = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.CancelFancyMatch}/${id}`, payload);

        toast.success(response?.data?.message);

        return response;
      } catch (error: any) {
        console.error('Error declaring match:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to declare match';
        toast.error(errorMessage);

        throw error;
      }
    },
    [post]

  );


  const fancyRollBack = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.FancyRollBack}/${id}`, payload);
        toast.success(response?.message || 'FancyRollBack successfully');
        return response;
      } catch (error: any) {
        console.error('FancyRollBack:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to FancyRollBack';
        toast.error(errorMessage);
        throw error;
      }
    },
    [post]
  );
  const matchRollback = useCallback(
    async (id: string) => {
      try {
        const response = await post(`${Endpoints.MatchRollBack}/${id}`, {});
        toast.success(response?.message || 'MatchRollBack successfully');
        return response;
      } catch (error: any) {
        console.error('Error MatchRollBack:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to MatchRollBack';
        toast.error(errorMessage);
        throw error;
      }
    },
    [post]
  );
  const Matchdelay = useCallback(
    async (id: string, delay: number, min: number, max: number) => {
      try {
        const response = await patch(`${Endpoints.Matchdelay}`, { id, delay, min, max });
        toast.success('Status updated successfully');
        return response;
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('Failed to toggle status');
        throw error;
      }
    },
    [patch]



  );
  const FetchBetData = async (id: string) => {
    try {
      const response = await get(`${Endpoints.Matchdelay}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Data', error);
      throw error;
    }
  };
  const fetchTableData = async (_id: string, matchId: string) => {
    try {
      const response = await get(`${Endpoints.fetchTableData}/${_id}/${matchId}`);
      return response;
    } catch (error) {
      console.error('Error fetch Table Data', error);
      toast.error('Failed to fetch Table Data');
      throw error;
    }
  };
  const fetchTotalData = async (_id: string) => {
    try {
      const response = await get(`${Endpoints.fetchTotalData}/${_id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Total Data', error);
      // toast.error('Failed to fetch Total Data');
      throw error;
    }
  };
  const fetchSettlement = async (_id: string) => {
    try {
      const response = await get(`${Endpoints.Settlement}/get/${_id}`);
      return response;
    } catch (error) {
      console.error('Error fetchSettlement', error);
      throw error;
    }
  };
  const fetchMySettlement = async (_id: string) => {
    try {
      const response = await get(`${Endpoints.Settlement}/get/to/${_id}`);
      return response;
    } catch (error) {
      console.error('Error fetchSettlement', error);
      throw error;
    }
  };
  const AddSettlement = useCallback(
    async (payload: any) => {
      try {
        const response = await post(`${Endpoints.Settlement}/create`, payload);

        toast.success(response?.status);

        return response;
      } catch (error: any) {
        console.error('Error Add Settlement:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to  Add Settlement';
        toast.error(errorMessage);

        throw error;
      }
    },
    [post]
  );
  const Exposure = async (adminId: string, matchId: string) => {
    try {
      const response = await get(`${Endpoints.Exposure}/${adminId}/${matchId}`);
      return response;
    } catch (error) {
      console.error('Error fetchSettlement', error);
      throw error;
    }
  };
  const updateStatusMInMax = useCallback(
    async (payload: { id: string; min: number; max: number }) => {
      try {
        const response = await patch(`${Endpoints.updateStatusMInMax}`, payload);

        toast.success('Status updated successfully');
        return response;

      } catch (error) {
        console.error('Error updating min/max:', error);
        toast.error('Failed to update min/max');
        throw error;
      }
    },
    [patch]
  );


  return {
    updateStatusSession,
    fetchAllMatchs,
    fetchAllMatch,
    updateTogalStatus,
    FatchUpdateMatchData,
    FatchUpdateMatch,
    DeclareMatch,
    DeclarefancyMatch,
    CancelMatch,
    CancelfancyMatch,
    fancyRollBack,
    matchRollback,
    FatchMatchData,
    Matchdelay,
    FetchBetData,
    fetchTableData,
    fetchTotalData,
    fetchSettlement,
    AddSettlement,
    Exposure,
    fetchMySettlement,
    updateStatusMInMax
  };
};

export default useMatchApi;
