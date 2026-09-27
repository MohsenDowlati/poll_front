"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProfile } from "@/services/auth/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    void fetchProfile()
      .then(() => {
        if (mounted) setIsAuthenticated(true);
      })
      .catch(() => {
        if (mounted) router.replace("/");
      })
      .finally(() => {
        if (mounted) setIsCheckingAuth(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (isCheckingAuth || !isAuthenticated) {
    return <div className="min-h-screen bg-white dark:bg-gray-900" aria-busy="true" />;
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
