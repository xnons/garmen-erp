import axios from 'axios';

// Gunakan 127.0.0.1 secara eksplisit untuk mencegah kendala DNS/IPv6 di browser lokal, atau URL Cloud di Render
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