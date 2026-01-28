// useEmployeeApi.ts
import type { Updatepaylod, AdminApiPayload } from 'src/Interface/super_agent.interface';

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useSuperAgnetApi = () => {
  const { get, post, put } = useApi();

  const fetchSuperAgentList = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=super_agent`);
      return response;
    } catch (error) {
      console.error('Error fetchSuperAgentList', error);
      toast.error('Failed to fetch super agent list');
      throw error;
    }
  };

  const fetchMaster = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=master`);
      return response;
    } catch (error) {
      console.error('Error fetchMaster', error);
      toast.error('Failed to fetch master list'); 
      throw error;
    }
  };

  const addSuperAgent = useCallback(
    async (admin: AdminApiPayload) => {
      try {
        const response = await post(`${Endpoints.superadmin}/signup`, admin);
        toast.success('Super Agent added successfully'); 
        return response.data;
      } catch (error) {
        console.error('Error addSuperAgent:', error);
        toast.error('Failed to add Super Agent'); 
        throw error;
      }
    },
    [post]
  );

  const GetSuperAgnetid = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/getid/super_agent`);
      return response;
    } catch (error) {
      console.error('Error GetSuperAgnetid', error);
      toast.error('Failed to get Super Agent ID'); 
      throw error;
    }
  };

  const updateSuperAgent = useCallback(
    async (id: string, updatePayload: Updatepaylod) => {
      try {
        const payload = {
          id,
          ...updatePayload,
        };
        const response = await put(`${Endpoints.superadmin}/update`, payload);
        toast.success('Super Agent updated successfully'); 
        return response.data;
      } catch (error) {
        console.error('Error updating Super Agent:', error);
        toast.error('Failed to update Super Agent');
        throw error;
      }
    },
    [put]
  );

  return {
    addSuperAgent,
    fetchSuperAgentList,
    fetchMaster,
    GetSuperAgnetid,
    updateSuperAgent,
  };
};

export default useSuperAgnetApi;
