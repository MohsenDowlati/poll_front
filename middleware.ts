import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_KEY = "authToken";
const PUBLIC_PATHS = new Set(["/", "/signup", "/error-404"]);
const AUTHENTICATED_HOME = "/home";

const normalizePathname = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const decodeJwtPayload = (token: string) => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary =
      typeof atob === "function"
        ? atob(padded)
        : typeof Buffer !== "undefined"
        ? Buffer.from(padded, "base64").toString("binary")
        : "";
    if (!binary) {
      return null;
    }
    const json = decodeURIComponent(
      Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json) as { exp?: number } | null;
  } catch {
    return null;
  }
};

const isTokenValid = (token: string | undefined): boolean => {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  if (typeof payload.exp === "number") {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowInSeconds;
  }

  return true;
};

const isPublicPath = (pathname: string) => {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images/") ||
    pathname === "/favicon.ico"
  );
};

export function middleware(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const token = request.cookies.get(AUTH_COOKIE_KEY)?.value;
  const hasValidToken = isTokenValid(token);

  if (isPublicPath(pathname)) {
    if (hasValidToken && PUBLIC_PATHS.has(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = AUTHENTICATED_HOME;
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (!hasValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(.*)"]
};
