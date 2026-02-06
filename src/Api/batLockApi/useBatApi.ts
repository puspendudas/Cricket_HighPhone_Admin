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
  const MatchOddsBetLock = async (adminId: string, matchId: string,) => {
    try {
      const url = `${Endpoints.BetLock}/bmlockall`;
      const payload = { adminId ,matchId};
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
  const FancyBetLock = async (adminId: string, matchId: string,) => {
    try {
      const url = `${Endpoints.BetLock}/fancylockall`;
      const payload = { adminId, matchId };
      const response = await post(url, payload);
      toast.success('Fancy Lock updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error in Fancy Lock', error);
      toast.error('Failed to update Fancy Lock');
      throw error;
    }
  };

  return { MatchOddsLock, FancyLock,MatchOddsBetLock,FancyBetLock };
};

export default useBatApi;
