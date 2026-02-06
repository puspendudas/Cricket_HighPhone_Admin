// useActionApi.ts
import type { CreateAnnouncementData, UpdateAnnouncementData } from 'src/Interface/announcement';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const UseAnnouncementApi = () => {
  const { patch, get, post, deleted } = useApi();

  const fetchClientAnnouncementData = async () => {
    try {
      const url = `${Endpoints.Announcement}/get`;
      const response = await get(url);
      return response; 
    } catch (error) {
      console.error('Error in fetching announcement data', error);
      throw error;
    }
  };

  const updateClientAnnouncementData = async (id: string, data: UpdateAnnouncementData) => {
    try {
      const url = `${Endpoints.Announcement}/toggle`;
      const response = await patch(url, { id, data });
      toast.success('Announcement updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error in updating announcement data', error);
      toast.error('Failed to update announcement data');
      throw error;
    }
  };

  const createClientAnnouncementData = async (data: CreateAnnouncementData) => {
    try {
      const url = `${Endpoints.Announcement}/create`;

      // Send the data directly as it comes from form
      const response = await post(url, data);
      toast.success('Announcement created successfully');
      return response.data;
    } catch (error) {
      console.error('Error in creating announcement data', error);
      toast.error('Failed to create announcement data');
      throw error;
    }
  };

  const deleteClientAnnouncementData = async (id: string) => {
    try {
      const url = `${Endpoints.Announcement}/delete/${id}`;
      const response = await deleted(url);
      toast.success('Deleted announcement successfully');
      return response.data;
    } catch (error) {
      console.error('Error in deleting announcement data', error);
      toast.error('Failed to delete announcement data');
      throw error;
    }
  };


  return {
    fetchClientAnnouncementData,
    updateClientAnnouncementData,
    createClientAnnouncementData,
    deleteClientAnnouncementData,
  };
};

export default UseAnnouncementApi;