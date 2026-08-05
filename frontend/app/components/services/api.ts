import axios from 'axios';

// Ambil URL Backend dari environment variable atau fallback ke localhost FastAPI
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🔑 Interceptor: Otomatis menyertakan JWT Token di Header Authorization
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            // Fallback: Cek 'token' ATAU 'access_token' agar tidak crash jika beda penamaan saat login
            const token = localStorage.getItem('token') || localStorage.getItem('access_token');

            if (token && config.headers) {
                // Mendukung Axios v1.x+ (.set) dan versi lama
                if (typeof config.headers.set === 'function') {
                    config.headers.set('Authorization', `Bearer ${token}`);
                } else {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🚨 Interceptor: Handling Error Global (401 Unauthorized / Token Expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                console.warn('Sesi login telah habis atau token tidak valid. Silakan login kembali.');

                // Opsional: Buka komentar di bawah ini jika ingin auto-redirect saat token expired:
                // localStorage.removeItem('token');
                // localStorage.removeItem('access_token');
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;