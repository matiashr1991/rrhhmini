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

// Inyectar token JWT en cada request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Si el backend responde 401 → sesión expirada → limpiar y redirigir al login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            typeof window !== 'undefined' &&
            !window.location.pathname.includes('/login')
        ) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
export { api };
