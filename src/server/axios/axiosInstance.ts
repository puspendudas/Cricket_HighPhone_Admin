// src/server/axios/axiosInstance.ts
import axios from 'axios';

import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

import { BASE_URL } from '../BaseURL/BaseURL';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Access-Control-Allow-Origin': import.meta.env.VITE_CURRENT_URL,
    'Access-Control-Allow-Methods': 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'X-Requested-With': '*',
  },
});

// Request interceptor for dynamic token injection
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem(STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization; // token nahi hua to header hata do
      console.warn("Authentication token missing - request sent without token");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
