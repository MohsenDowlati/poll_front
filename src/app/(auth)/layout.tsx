import UserAuth from "@/components/announcer/UserAuth";
import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import { extractAdminType } from "@/utils/roles";
import { decodeJwtPayload } from "@/utils/jwt";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import React from "react";

const AUTH_COOKIE_KEY = "authToken";
const RESTRICTED_ADMIN_TYPES = new Set(["new_user", "canceled_user"]);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_KEY)?.value ?? null;
  const payload = decodeJwtPayload(token);
  const adminType = extractAdminType(payload)?.toLowerCase();
  const shouldShowRestriction = Boolean(
    adminType && RESTRICTED_ADMIN_TYPES.has(adminType)
  );

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs">
                <Link href="/" className="block mb-4">
                  <Image
                    width={231}
                    height={48}
                    src="./images/logo/auth-logo.svg"
                    alt="Logo"
                  />
                </Link>
                <p className="text-center text-gray-400 dark:text-white/60">
                  Create polls, collect insights, and understand what matters most.
                </p>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
        {shouldShowRestriction && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/70 px-6 py-8">
            <div className="w-full max-w-md" role="dialog" aria-modal="true" aria-label="Account access restricted">
              <UserAuth />
            </div>
          </div>
        )}
      </ThemeProvider>
    </div>
  );
}
