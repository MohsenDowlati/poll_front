const SESSION_ROLE_COOKIE_KEY = "session_role";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const getAccessToken = (): string | null =>
  typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null =>
  typeof window === "undefined" ? null : window.localStorage.getItem(REFRESH_TOKEN_KEY);

export const storeAuthTokens = (accessToken?: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;
  if (accessToken) window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuthTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getSessionRole = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const value = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_ROLE_COOKIE_KEY}=`));

  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value.slice(SESSION_ROLE_COOKIE_KEY.length + 1));
  } catch {
    return null;
  }
};
