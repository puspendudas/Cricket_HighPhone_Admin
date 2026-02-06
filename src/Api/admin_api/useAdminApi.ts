// useEmployeeApi.ts

import type { Updatepaylod, AdminApiPayload } from 'src/Interface/admin.interface';

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar'; 

const useAdminApi = () => {
  const { get, post, put } = useApi();

  const fetchAdminList = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=admin`);
      return response;
    } catch (error) {
      console.error('Error fetchAdminList', error);
      toast.error('Failed to fetch admin list');
      throw error;
    }
  };

  const fetchAdmin = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=super_admin`);
      return response;
    } catch (error) {
      console.error('Error fetchAdmin', error);
      toast.error('Failed to fetch super admin');
      throw error;
    }
  };

  const addadmin = useCallback(
    async (admin: AdminApiPayload) => {
      try {
        const response = await post(`${Endpoints.superadmin}/signup`, admin);
        toast.success('Admin added successfully');
        return response.data;
      } catch (error) {
        console.error('Error adding admin:', error);
        toast.error('Failed to add admin'); 
        throw error;
      }
    },
    [post]
  );

  const GetAdminid = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/getid/admin`);
      return response;
    } catch (error) {
      console.error('Error GetAdminid', error);
      toast.error('Failed to get admin ID');
      throw error;
    }
  };

  const updateAdmin = useCallback(
    async (id: string, updatePayload: Updatepaylod) => {
      try {
        const payload = { id, ...updatePayload };
        const response = await put(`${Endpoints.superadmin}/update`, payload);
        toast.success('Admin updated successfully'); 
        return response.data;
      } catch (error) {
        console.error('Error updating admin:', error);
        toast.error('Failed to update admin'); 
        throw error;
      }
    },
    [put]
  );

  return { addadmin, fetchAdminList, fetchAdmin, GetAdminid, updateAdmin };
};

export default useAdminApi;
