
import type { Updatepaylod, AdminApiPayload } from 'src/Interface/agent.interface';

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar'; 

const useAgnetApi = () => {
  const { get, post, put } = useApi();

  const fetchAagentList = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=agent`);
      return response;
    } catch (error) {
      console.error('Error fetchAagentList', error);
      toast.error('Failed to fetch agent list'); 
      throw error;
    }
  };

  const fetchsuperAdmin = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/get?type=super_agent`);
      return response;
    } catch (error) {
      console.error('Error fetchsuperAdmin', error);
      toast.error('Failed to fetch super agent'); 
      throw error;
    }
  };

  const addAgent = useCallback(
    async (admin: AdminApiPayload) => {
      try {
        const response = await post(`${Endpoints.superadmin}/signup`, admin);
        toast.success('Agent added successfully'); 
        return response.data;
      } catch (error) {
        console.error('Error addAgent:', error);
        toast.error('Failed to add agent');
        throw error;
      }
    },
    [post]
  );

  const GetAgentid = async () => {
    try {
      const response = await get(`${Endpoints.superadmin}/getid/agent`);
      return response;
    } catch (error) {
      console.error('Error GetAgentid', error);
      toast.error('Failed to get agent ID'); 
      throw error;
    }
  };

  const updateAgent = useCallback(
    async (id: string, updatePayload: Updatepaylod) => {
      try {
        const payload = { id, ...updatePayload };
        const response = await put(`${Endpoints.superadmin}/update`, payload);
        toast.success('Agent updated successfully');
        return response.data;
      } catch (error) {
        console.error('Error updating agent:', error);
        toast.error('Failed to update agent');  
        throw error;
      }
    },
    [put]
  );

  return {
    addAgent,
    fetchAagentList,
    fetchsuperAdmin,
    GetAgentid,
    updateAgent,
  };
};

export default useAgnetApi;
