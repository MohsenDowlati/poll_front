const AUTH_COOKIE_KEY = "authToken";

type StoreOptions = {
  /** Cookie lifetime in days */
  maxAgeDays?: number;
};

const isBrowser = () => typeof window !== "undefined";

export const extractToken = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const candidate = payload as Record<string, unknown>;
  const directMatch = ["token", "accessToken", "access_token"].find((key) => {
    const value = candidate[key];
    return typeof value === "string" && value.length > 0;
  });

  if (directMatch) {
    return candidate[directMatch] as string;
  }

  if (typeof candidate.data === "object" && candidate.data !== null) {
    return extractToken(candidate.data);
  }

  return undefined;
};

export const setAuthTokenCookie = (token: string, options: StoreOptions = {}) => {
  if (!isBrowser()) {
    return;
  }

  const { maxAgeDays = 7 } = options;
  const maxAgeSeconds = Math.floor(maxAgeDays * 24 * 60 * 60);

  const secureFlag = window.location.protocol === "https:" ? " Secure;" : "";
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax;${secureFlag}`;
};

export const getAuthTokenFromCookie = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  const value = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_KEY}=`));

  if (!value) {
    return null;
  }

  const [, encodedToken] = value.split("=");
  try {
    return decodeURIComponent(encodedToken);
  } catch (error) {
    console.warn("Failed to decode auth token cookie", error);
    return encodedToken;
  }
};

export const clearAuthTokenCookie = () => {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax;`;
};