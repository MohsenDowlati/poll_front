import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/signup", "/error-404"]);

const normalizePathname = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
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

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // The API owns session validation. Cross-origin HttpOnly cookies may not be
  // visible to this Next.js host, so protected pages revalidate through /profile.
  return NextResponse.next();
}

export const config = {
  matcher: ["/(.*)"]
};
