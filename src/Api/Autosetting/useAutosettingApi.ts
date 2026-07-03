// useAutosettingApi.ts

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useAutosettingApi = () => {
  const { post, get, put } = useApi();

  const AutoDeclareSessionstart = useCallback(
    async (payload: any = {}) => {
      try {
        const response = await post(`${Endpoints.AutoDeclare}/start`, payload);

        toast.success(response?.status || "Auto Declare Started Successfully");

        return response;
      } catch (error: any) {
        console.error('Error Auto Declare:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to Auto Declare';

        toast.error(errorMessage);

        throw error;
      }
    },
    [post]
  );
  const AutoDeclareSessionstop = useCallback(
    async (payload: any = {}) => {
      try {
        const response = await post(`${Endpoints.AutoDeclare}/stop`, payload);

        toast.success(response?.status || "Auto Declare Stop Success");

        return response;
      } catch (error: any) {
        console.error('Error Auto Declare:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to Auto Declare';

        toast.error(errorMessage);

        throw error;
      }
    },
    [post]
  );

  const getSettings = useCallback(
    async () => {
      try {
        const response = await get(Endpoints.SettingGet);
        return response;
      } catch (error: any) {
        console.error('Error get settings:', error);
        throw error;
      }
    },
    [get]
  );

  const updateSettings = useCallback(
    async (payload: any) => {
      try {
        const response = await put(Endpoints.SettingUpdate, payload);
        toast.success(response?.message || "Settings updated successfully");
        return response;
      } catch (error: any) {
        console.error('Error update settings:', error);
        const errorMessage =
          error?.response?.data?.message || 'Failed to update settings';
        toast.error(errorMessage);
        throw error;
      }
    },
    [put]
  );

  return {

    AutoDeclareSessionstart,
    AutoDeclareSessionstop,
    getSettings,
    updateSettings
  };
};

export default useAutosettingApi;
