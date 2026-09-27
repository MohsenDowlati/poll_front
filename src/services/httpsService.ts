import axios, { AxiosInstance } from 'axios';
import endpoints from '@/services/endpoints';
import { dispatchToast } from '@/context/AlertContext';
import { getAccessToken, getRefreshToken, storeAuthTokens } from '@/utils/authToken';

declare global {
  interface Window {
    __ENV__?: Record<string, string | undefined>;
  }
}

const resolveBaseURL = (): string | undefined => {
  const value =
    typeof window !== 'undefined'
      ? window.__ENV__?.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL;

  return value?.trim() || undefined;
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const entry = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  if (!entry) {
    return null;
  }
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return null;
  }
};

let hasLoggedMissingBaseURL = false;

const http: AxiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const initialBaseURL = resolveBaseURL();

if (!initialBaseURL) {
  hasLoggedMissingBaseURL = true;
  console.warn('NEXT_PUBLIC_API_BASE_URL is not set. HTTP client will use relative URLs.');
} else {
  http.defaults.baseURL = initialBaseURL;
}

http.interceptors.request.use((config) => {
  if (!config.baseURL) {
    const runtimeBaseURL = resolveBaseURL();
    if (runtimeBaseURL) {
      config.baseURL = runtimeBaseURL;
    } else if (!hasLoggedMissingBaseURL) {
      hasLoggedMissingBaseURL = true;
      console.warn('NEXT_PUBLIC_API_BASE_URL is not set. HTTP client will use relative URLs.');
    }
  }

  const csrf = getCookieValue('csrf_token');
  const accessToken = getAccessToken();
  if (accessToken && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (csrf) {
    if (typeof config.headers?.set === 'function') {
      if (!config.headers.get?.('X-CSRF-Token')) {
        config.headers.set('X-CSRF-Token', csrf);
      }
    } else if (config.headers) {
      (config.headers as Record<string, string>)['X-CSRF-Token'] = csrf;
    }
  }

  return config;
});

let refreshPromise: Promise<unknown> | null = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error?.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error?.response?.status;
    const url = String(request?.url ?? '');
    if (
      status === 401 &&
      request &&
      !request._retry &&
      !url.includes(endpoints.auth.refresh) &&
      !url.includes(endpoints.auth.login) &&
      !url.includes(endpoints.auth.signup)
    ) {
      request._retry = true;
      const refreshToken = getRefreshToken();
      refreshPromise ??= http
        .post(endpoints.auth.refresh, refreshToken ? { refreshToken } : undefined)
        .then((response) => {
          storeAuthTokens(response.data?.accessToken, response.data?.refreshToken);
          return response;
        })
        .finally(() => {
          refreshPromise = null;
        });
      try {
        await refreshPromise;
        return http(request);
      } catch {
        refreshPromise = null;
      }
    }

    if (request && !url.includes(endpoints.auth.refresh)) {
      const serverMessage = error?.response?.data?.message;
      const message = typeof serverMessage === 'string' ? serverMessage : undefined;
      dispatchToast({
        variant: status >= 500 || !status ? 'error' : 'warning',
        title: status >= 500 || !status ? { en: 'Request failed', fa: 'درخواست ناموفق بود' } : { en: 'Please check your request', fa: 'لطفاً درخواست خود را بررسی کنید' },
        message: message
          ? { en: message, fa: message }
          : { en: 'Something went wrong. Please try again.', fa: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.' },
      });
    }

    const expectedErrors =
      error?.response &&
      error.response.status >= 400 &&
      error.response.status < 500;

    if (!expectedErrors && process.env.NODE_ENV !== 'production') {
      console.error('HTTP request failed', {
        status: error?.response?.status,
        method: request?.method,
        url: request?.url,
      });
    }

    return Promise.reject(error);
  },
);

export default http;

