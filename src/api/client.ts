import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);