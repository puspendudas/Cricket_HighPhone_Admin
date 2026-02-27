import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useBatApi = () => {
  const { post } = useApi();

  // Match Odds Lock
  const MatchOddsLock = async (adminId: string, checked: boolean,) => {
    try {
      const url = `${Endpoints.BetLock}/bmlockall`;
      const payload = { adminId };
      const response = await post(url, payload);
      toast.success('Match Odds Lock updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error in Match Odds Lock', error);
      toast.error('Failed to update Match Odds Lock');
      throw error;
    }
  };

  // Fancy Lock
  const FancyLock = async (adminId: string, checked: boolean,) => {
    try {
      const url = `${Endpoints.BetLock}/fancylockall`;
      const payload = { adminId };
      const response = await post(url, payload);
      toast.success('Fancy Lock updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error in Fancy Lock', error);
      toast.error('Failed to update Fancy Lock');
      throw error;
    }
  };
  const MatchOddsBetLock = async (adminId: string, marketId: string) => {
    try {
      const url = `${Endpoints.BetLock}/bmlock`;
      const payload = { adminId, marketId };

      const response = await post(url, payload);

      console.log("API RESPONSE:", response);

      if (response?.status === "success") {
        toast.success(response.message);  
      } else {
        toast.error(response?.message || "Something went wrong");
      }

      return response;

    } catch (error: any) {
      console.error("Error in Match Odds Lock", error);

      toast.error(
        error?.response?.data?.message ||
        "Failed to update Match Odds Lock"
      );

      throw error;
    }
  };

  // Fancy Lock
  const FancyBetLock = async (adminId: string, marketId: string) => {
    try {
      const url = `${Endpoints.BetLock}/fancylock`;
      const payload = { adminId, marketId };

      const response = await post(url, payload);

      console.log("Fancy Lock Response:", response);

      if (response?.status === "success") {
        toast.success(response.message);
      } else {
        toast.error(response?.message || "Something went wrong");
      }

      return response;  

    } catch (error: any) {
      console.error("Error in Fancy Lock", error);

      toast.error(
        error?.response?.data?.message ||
        "Failed to update Fancy Lock"
      );

      throw error;
    }
  };

  return { MatchOddsLock, FancyLock, MatchOddsBetLock, FancyBetLock };
};

export default useBatApi;
