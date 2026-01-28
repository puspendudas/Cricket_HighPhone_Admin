// src/Api/me/useUpdatePassApi.ts

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

interface PasswordPayload {
  old_password: string;
  new_password: string;
}

const useUpdatePassApi = () => {
  const { patch } = useApi();

  const updatepassword = useCallback(
    async (id: string, data: PasswordPayload) => {
      try {
        const response = await patch(`${Endpoints.superadmin}/change`, {
          id,
          ...data,
        });

        toast.success('Password changed successfully!');
        return response;
      } catch (error) {
        toast.error('Failed to change password.');
        console.error('Error Password:', error);
        throw error;
      }
    },
    [patch]
  );

  return { updatepassword };
};

export default useUpdatePassApi;
