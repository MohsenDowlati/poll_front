import React from "react";
import {useRouter} from "next/navigation";
import { logout } from "@/services/auth/auth";

export default function LogOut() {

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      document.cookie = "session_role=; Path=/; Max-Age=0; SameSite=Lax;";
    }
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    </button>
  );
}
