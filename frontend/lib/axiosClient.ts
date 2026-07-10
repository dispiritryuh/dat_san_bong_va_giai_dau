// lib/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Lính gác ở cổng ra. Tự móc token nhét vào balo trước khi gửi lên Backend
axiosClient.interceptors.request.use(
  (config) => {
    // Next.js chạy cả SSR nên phải check window tránh lỗi
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;