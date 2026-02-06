import axios from "axios";

const API_BASE_URL = "https://terminal.apiserver.digital/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});



export const sessionFatchData = async (id: string) => {
  try {
    const response = await api.get(`cricket/odds?gameId=${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Session data:", error);
    throw error;
  }
};

