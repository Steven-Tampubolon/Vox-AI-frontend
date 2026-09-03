import axios from "axios";


export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  timeout: 30000,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);