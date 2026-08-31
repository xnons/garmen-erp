import axios from 'axios';

const getBaseURL = (): string => {
    if (typeof window !== 'undefined') {
        const customUrl = localStorage.getItem('custom_api_url');
        if (customUrl) return customUrl.replace(/\/$/, '');
    }

    // 1. Ambil dari Environment Variable Build/Runtime
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl.startsWith('http')) {
        return envUrl.replace(/\/$/, '');
    }

    // 2. Default URL backend live di Render jika dibuka di browser production
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return 'https://garmen-erp.onrender.com';
    }

    // 3. Fallback dev localhost
    return 'http://127.0.0.1:8000';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor Request: Menyertakan JWT Token & Refresh dynamic baseURL
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token') || localStorage.getItem('access_token');
            if (token && config.headers) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            if (!config.baseURL || config.baseURL === 'http://127.0.0.1:8000') {
                config.baseURL = getBaseURL();
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor Response: Tangani Token Expired (401 Unauthorized) & Auto Reset ke Login Form
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error('[Axios Network Error]: Gagal terhubung ke backend FastAPI. Pastikan server backend menyala.');
        } else if (error.response.status === 401) {
            const isLoginRequest = error.config?.url?.includes('/api/auth/login');
            
            // Jika token kedaluwarsa bukan saat proses form login pertama kali
            if (!isLoginRequest && typeof window !== 'undefined') {
                console.warn('[Unauthorized]: Token JWT kedaluwarsa atau tidak valid. Mengembalikan ke halaman login.');
                
                // Bersihkan semua data sesi pengguna dari browser
                localStorage.removeItem('token');
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                localStorage.removeItem('user_data');
                localStorage.removeItem('user_role');
                
                // Kirim event khusus ke React agar UI otomatis kembali ke form login
                const expiredMsg = error.response.data?.detail || 'Sesi login Anda telah kedaluwarsa. Silakan masukkan kembali username dan kata sandi.';
                window.dispatchEvent(new CustomEvent('auth:session_expired', {
                    detail: expiredMsg
                }));
            }
        }
        return Promise.reject(error);
    }
);

export default api;