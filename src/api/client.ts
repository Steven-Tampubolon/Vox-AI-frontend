import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY ?? "";

if (!API_KEY) {
  console.error(
    "[VoxAI] VITE_API_KEY tidak ditemukan di .env — semua request ke BE akan gagal 401"
  );
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    "X-API-Key": API_KEY,
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);