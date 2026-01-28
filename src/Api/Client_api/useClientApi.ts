// useEmployeeApi.ts

import type { Updatepaylod, AdminApiPayload } from 'src/Interface/client.interface ';

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useClientApi = () => {
  const { get, post, patch, put } = useApi();

  const fetchClientList = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/users/all`);
      return response;
    } catch (error) {
      console.error('Error fetchClientList', error);
      toast.error('Failed to fetch client list');
      throw error;
    }
  };

  const fetchAgent = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=agent`);
      return response;
    } catch (error) {
      console.error('Error fetchAgent', error);
      toast.error('Failed to fetch agent data')
      throw error;
    }
  };

  const addClient = useCallback(
    async (admin: AdminApiPayload) => {
      try {
        const response = await post(`${Endpoints.superadmin}/users/create`, admin);
        toast.success('Client added successfully');
        return response.data;
      } catch (error) {
        console.error('Error adding Client:', error);
        toast.error('Failed to add client');
        throw error;
      }
    },
    [post]
  );

  const updateTogalStatus = useCallback(
    async (id: string, toggleType: 'betting') => {
      try {
        const response = await patch(`${Endpoints.superadmin}/users/toggle`, {
          id,
          toggle: toggleType,
        });
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
const ClintTogalStatus = useCallback(
  async (id: string) => {
    try {
      const response = await patch(`${Endpoints.superadmin}/users/toggle`, {
        id,
        toggle: 'status',
      });
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


  const updateClient = useCallback(
    async (id: string, updatedData: Updatepaylod) => {
      try {
        const payload = { id, ...updatedData };
        const response = await put(`${Endpoints.superadmin}/users/update`, payload);
        toast.success('Client updated successfully');
        return response.data;
      } catch (error) {
        console.error('Error updating client:', error);
        toast.error('Failed to update client');
        throw error;
      }
    },
    [put]
  );

  const GetClientid = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/users/getid`);
      return response;
    } catch (error) {
      console.error('Error GetClientid', error);
      toast.error('Failed to get client ID');
      throw error;
    }
  };

  return {
    addClient,
    fetchClientList,
    fetchAgent,
    updateTogalStatus,
    updateClient,
    GetClientid,
    ClintTogalStatus
  };
};

export default useClientApi;
