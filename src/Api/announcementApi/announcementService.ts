// src/Api/announcementApi/announcementService.ts
import axiosInstance from 'src/server/axios/axiosInstance';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

export const fetchClientAnnouncementData = async () => {
  const url = `${Endpoints.Announcement}/get`;
  const response = await axiosInstance.get(url);
  return response.data;
};

