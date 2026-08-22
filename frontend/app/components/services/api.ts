import axios from 'axios';

// Gunakan 127.0.0.1 secara eksplisit untuk mencegah kendala DNS/IPv6 di browser
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor Request: Menyertakan JWT Token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token') || localStorage.getItem('access_token');
            if (token && config.headers) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor Response: Logging error ringkas
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error('[Axios Network Error]: Gagal terhubung ke backend FastAPI di http://127.0.0.1:8000. Pastikan server Uvicorn menyala.');
        } else if (error.response.status === 401) {
            console.warn('[Unauthorized]: Token kedaluwarsa atau tidak valid.');
        }
        return Promise.reject(error);
    }
);

export default api;