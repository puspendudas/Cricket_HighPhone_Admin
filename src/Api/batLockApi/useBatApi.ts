import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useBatApi = () => {
  const { post, get } = useApi();

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

  // Casino Lock
  const CasinoLock = async (adminId: string, gameCode: string, locked: boolean) => {
    try {
      const url = `${Endpoints.BetLock}/casinolock`;
      const payload = { adminId, gameCode, locked };
      const response = await post(url, payload);

      if (response?.status === "success") {
        toast.success(response.message || 'Casino lock updated successfully');
      } else {
        toast.error(response?.message || "Something went wrong");
      }

      return response;
    } catch (error: any) {
      console.error("Error in Casino Lock", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to update Casino Lock"
      );
      throw error;
    }
  };

  // Casino Lock All
  const CasinoLockAll = async (adminId: string, locked: boolean) => {
    try {
      const url = `${Endpoints.BetLock}/casinolockall`;
      const payload = { adminId, locked };
      const response = await post(url, payload);

      if (response?.status === "success") {
        toast.success(response.message || 'All Casino locks updated successfully');
      } else {
        toast.error(response?.message || "Something went wrong");
      }

      return response;
    } catch (error: any) {
      console.error("Error in All Casino Lock", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to update All Casino Lock"
      );
      throw error;
    }
  };

  // Casino Limits (Min & Max Bet)
  const UpdateCasinoLimits = async (adminId: string, minBet: number, maxBet: number) => {
    try {
      const url = `${Endpoints.BetLock}/casino-limits`;
      const payload = { adminId, min_bet: minBet, max_bet: maxBet };
      const response = await post(url, payload);

      if (response?.status === "success") {
        toast.success(response.message || 'Casino limits updated successfully');
      } else {
        toast.error(response?.message || "Something went wrong");
      }

      return response;
    } catch (error: any) {
      console.error("Error in Update Casino Limits", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to update Casino Limits"
      );
      throw error;
    }
  };

  // Casino Rate Difference
  const UpdateCasinoRateDiff = async (adminId: string, rateDiff: number) => {
    try {
      const url = `${Endpoints.BetLock}/casino-rate-diff`;
      const payload = { adminId, rate_diff: rateDiff };
      const response = await post(url, payload);

      if (response?.status === "success") {
        toast.success(response.message || 'Casino rate difference updated successfully');
      } else {
        toast.error(response?.message || "Something went wrong");
      }

      return response;
    } catch (error: any) {
      console.error("Error in Update Casino Rate Diff", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to update Casino Rate Difference"
      );
      throw error;
    }
  };

  // Casino Management Settings (Global Limits & Per-Casino Rate Differences)
  const GetCasinoManagementSettings = async () => {
    try {
      const url = `${Endpoints.BetLock}/casino-management-settings`;
      const response = await get(url);
      return response?.data || response;
    } catch (error: any) {
      console.error("Error in GetCasinoManagementSettings", error);
      throw error;
    }
  };

  const UpdateCasinoManagementSettings = async (payload: any) => {
    try {
      const url = `${Endpoints.BetLock}/casino-management-settings`;
      const response = await post(url, payload);

      if (response?.status === "success") {
        toast.success(response.message || 'Casino management settings updated successfully');
      } else {
        toast.error(response?.message || "Something went wrong");
      }

      return response;
    } catch (error: any) {
      console.error("Error in UpdateCasinoManagementSettings", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to update Casino Management Settings"
      );
      throw error;
    }
  };

  return {
    MatchOddsLock,
    FancyLock,
    MatchOddsBetLock,
    FancyBetLock,
    CasinoLock,
    CasinoLockAll,
    UpdateCasinoLimits,
    UpdateCasinoRateDiff,
    GetCasinoManagementSettings,
    UpdateCasinoManagementSettings,
  };
};

export default useBatApi;
