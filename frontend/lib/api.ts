import axios from 'axios';

// Prod: Traefik -> /api
// Dev: podés setear NEXT_PUBLIC_API_URL=http://localhost:8000
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Agregar JWT automáticamente (solo en navegador)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('access_token') ||
      sessionStorage.getItem('token');

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
export { api };
