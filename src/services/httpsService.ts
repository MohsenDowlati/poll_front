import axios, { AxiosInstance, type AxiosRequestHeaders } from 'axios';
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
      // If headers isn't an AxiosHeaders instance, ensure we mutate or create
      // a plain header map instead of assigning a plain object to config.headers
      // which may be typed as AxiosHeaders by axios types.
      if (!config.headers) {
        // Create a plain object when no headers exist yet.
        // Cast via unknown to the AxiosRequestHeaders type to avoid `any`.
        config.headers = { Authorization: authValue } as unknown as AxiosRequestHeaders;
      } else {
        // Mutate the existing headers map to add Authorization without replacing the object.
        const headers = config.headers as Record<string, unknown>;
        if (!headers['Authorization'] && !headers['authorization']) {
          (headers as Record<string, string>)['Authorization'] = authValue;
        }
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

