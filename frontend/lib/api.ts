import axios from 'axios';

// Prod: Traefik rutea /api → backend NestJS
// Dev:  setear NEXT_PUBLIC_API_URL=http://localhost:8000
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
export { api };
