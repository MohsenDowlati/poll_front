import axios, { AxiosInstance } from 'axios';
import { getAuthTokenFromCookie } from '@/utils/authToken';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  console.warn('NEXT_PUBLIC_API_BASE_URL is not set. HTTP client will use relative URLs.');
}

const http: AxiosInstance = axios.create({
  baseURL: baseURL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = getAuthTokenFromCookie();
  if (token) {
    const authValue = `Bearer ${token}`;
    if (typeof config.headers?.set === 'function') {
      if (!config.headers.get?.('Authorization')) {
        config.headers.set('Authorization', authValue);
      }
    } else {
      const headers = (config.headers ?? {}) as Record<string, unknown>;
      if (!headers['Authorization'] && !headers['authorization']) {
        config.headers = {
          ...headers,
          Authorization: authValue,
        };
      }
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const expectedErrors =
      error?.response &&
      error.response.status >= 400 &&
      error.response.status < 500;

    if (!expectedErrors) {
      console.error(error);
    }

    return Promise.reject(error);
  },
);

export default http;

