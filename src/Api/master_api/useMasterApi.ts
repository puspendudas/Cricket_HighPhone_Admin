// useEmployeeApi.ts
import type { Updatepaylod, AdminApiPayload } from 'src/Interface/master.interface';

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar'; 

const useMasterApi = () => {
  const { get, post, put } = useApi();

  const fetchMasterList = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=master`);
      return response;
    } catch (error) {
      console.error('Error fetchMasterList', error)
      toast.error('Failed to fetch master list'); 
      throw error;
    }
  };

  const fetchSuperMaster = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=super_master`);
      return response;
    } catch (error) {
      console.error('Error fetchSuperMaster', error);
      toast.error('Failed to fetch super master'); 
      throw error;
    }
  };

  const addMaster = useCallback(
    async (admin: AdminApiPayload) => {
      try {
        const response = await post(`${Endpoints.superadmin}/signup`, admin);
        toast.success('Master added successfully'); 
        return response.data;
      } catch (error) {
        console.error('Error addMaster:', error);
        toast.error('Failed to add master'); 
        throw error;
      }
    },
    [post]
  );

  const GetMasterid = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/getid/master`);
      return response;
    } catch (error) {
      console.error('Error GetMasterid', error);
      toast.error('Failed to get master ID'); // ❌
      throw error;
    }
  };

  const updateMaster = useCallback(
    async (id: string, updatePayload: Updatepaylod) => {
      try {
        const payload = {
          id,
          ...updatePayload,
        };
        const response = await put(`${Endpoints.superadmin}/update`, payload);
        toast.success('Master updated successfully'); 
        return response.data;
      } catch (error) {
        console.error('Error updating master:', error);
        toast.error('Failed to update master'); 
        throw error;
      }
    },
    [put]
  );

  return {
    addMaster,
    fetchMasterList,
    fetchSuperMaster,
    GetMasterid,
    updateMaster,
  };
};

export default useMasterApi;
