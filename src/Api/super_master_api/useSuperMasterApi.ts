// useEmployeeApi.ts
import type { Updatepaylod, AdminApiPayload } from 'src/Interface/super_master.interface';

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar'; 

const useSuperMasterApi = () => {
  const { get, post, put } = useApi();

  const fetchSuperMasterList = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=super_master`);
      return response;
    } catch (error) {
      console.error('Error fetchSuperMasterList', error);
      toast.error('Failed to fetch super master list'); 
      throw error;
    }
  };

  const fetchAdmin = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=admin`);
      return response;
    } catch (error) {
      console.error('Error fetchAdminList', error);
      toast.error('Failed to fetch admin list'); 
      throw error;
    }
  };

  const addSuperMaster = useCallback(
    async (admin: AdminApiPayload) => {
      try {
        const response = await post(`${Endpoints.superadmin}/signup`, admin);
        toast.success('Super Master added successfully'); 
        return response.data;
      } catch (error) {
        console.error('Error adding Super Master:', error);
        toast.error('Failed to add Super Master'); 
        throw error;
      }
    },
    [post]
  );

  const GetSuperMastertid = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/getid/super_master`);
      return response;
    } catch (error) {
      console.error('Error GetSuperMastertid', error);
      toast.error('Failed to get Super Master ID'); 
      throw error;
    }
  };

  const updateSuperMaster = useCallback(
    async (id: string, Updatepaylod: Updatepaylod) => {
      try {
        const payload = {
          id,
          ...Updatepaylod,
        };
        const response = await put(`${Endpoints.superadmin}/update`, payload);
        toast.success('Super Master updated successfully'); 
        return response.data;
      } catch (error) {
        console.error('Error updating Super Master:', error);
        toast.error('Failed to update Super Master'); 
        throw error;
      }
    },
    [put]
  );

  return {
    addSuperMaster,
    fetchSuperMasterList,
    fetchAdmin,
    GetSuperMastertid,
    updateSuperMaster,
  };
};

export default useSuperMasterApi;
