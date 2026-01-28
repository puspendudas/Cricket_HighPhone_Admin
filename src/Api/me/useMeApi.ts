// useEmployeeApi.ts


import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

const useMeApi = () => {
  const { get } = useApi();

  const fetchMe = async () => {
    try {
      const response = await get(Endpoints.me);
      return response; 
    } catch (error) {
      console.error('Error fetchAdminList', error);
      throw error;
    }
  };

  return {fetchMe};
};

export default useMeApi;
