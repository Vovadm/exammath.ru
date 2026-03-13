import axios from 'axios';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8000';

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api',
  timeout: 10000,
  withCredentials: true,
});

http.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !['/login', '/register', '/tasks', '/'].includes(window.location.pathname)
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default http;
