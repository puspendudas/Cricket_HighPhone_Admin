// useActionApi.ts
import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useActionApi = () => {
  const { patch, get } = useApi();

const deactivate = async (id: string, status: boolean) => {
  try {
    const response = await patch(`${Endpoints.Deactivate}`, { id, status });

    const message = response.message || `User ${status ? 'activated' : 'deactivated'} successfully`;
    console.log(response.data,">>>>>>>>>>>>>>>");

    toast.success(message);
    return response;
  } catch (error: any) {
    console.error('Error updating user status', error);

    const errorMessage = error?.response.message || `Failed to ${status ? 'activate' : 'deactivate'} user`;

    toast.error(errorMessage);
    throw error;
  }
};


  const LimitTransaction = async (id: string, amount: number, type: 'deposit' | 'withdrawal') => {
    try {
      const response = await patch(`${Endpoints.limits}/limit`, {
        id,
        limit: amount,
        type,
      });
      toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`);
      return response;
    } catch (error) {
      console.error(`Error in ${type}`, error);
      toast.error(`Failed to ${type}`);
      throw error;
    }
  };
  const LimitClintTransaction = async (id: string, amount: number, type: 'deposit' | 'withdrawal') => {
    try {
      const response = await patch(`${Endpoints.limits}/users/limit`, {
        id,
        limit: amount,
        type,
      });
      toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`);
      return response;
    } catch (error) {
      console.error(`Error in ${type}`, error);
      toast.error(`Failed to ${type}`);
      throw error;
    }
  };
  const FatchLimitData = async (id: string, user_type: string = 'Admin') => {
    try {
      const url = `${Endpoints.FatchLimitData}/wallethistory?id=${id}&user_type=${user_type}`;
      const response = await get(url);
      toast.success(`Fetched limit data successfully`);
      return response;
    } catch (error) {
      console.error(`Error in fetching limit data`, error);
      toast.error(`Failed to fetch limit data`);
      throw error;
    }
  };
  const FatchClintLimitData = async (id: string, user_type: string = 'User') => {
    try {
      const url = `${Endpoints.FatchLimitData}/wallethistory?id=${id}&user_type=${user_type}`;
      const response = await get(url);
      toast.success(`Fetched limit data successfully`);
      return response;
    } catch (error) {
      console.error(`Error in fetching limit data`, error);
      toast.error(`Failed to fetch limit data`);
      throw error;
    }
  };

  return { deactivate, LimitTransaction, FatchLimitData,FatchClintLimitData,LimitClintTransaction };
};

export default useActionApi;
