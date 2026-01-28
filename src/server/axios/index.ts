import axios from 'axios';
import { useMemo } from 'react';

import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

import { BASE_URL } from '../BaseURL/BaseURL';

const getToken = () => sessionStorage.getItem(STORAGE_KEY);

const useApi = () => {
  const token = getToken();
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Access-Control-Allow-Origin': import.meta.env.VITE_CURRENT_URL,
        'Access-Control-Allow-Methods': 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'X-Requested-With': '*',
      },
    });

    instance.defaults.headers.common.Authorization = `Bearer ${token}`;

    return instance;
  }, [token]);

  const get = async (url: string, params = {}) => {
    console.log(`GET request to ${url} with params:`, params);

    const response = await api.get(url, { params });
    return response.data;
  };

  const post = async (url: string, data: any) => {
    const response = await api.post(url, data);
    return response.data;
  };

  const put = async (url: string, data: any) => {
    const response = await api.put(url, data);
    return response.data;
  };

  const patch = async (url: string, data: any) => {
    const response = await api.patch(url, data);
    return response.data;
  };

  const deleted = async (url: string, data: any = {}) => {
    const response = await api.delete(url, { data });
    return response.data;
  };

  return { get, post, put, patch, deleted };
};

export default useApi;
