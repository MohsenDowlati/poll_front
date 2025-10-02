import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import UserTable from "@/components/user-profile/UserTable";

export const metadata: Metadata = {
    title: " Survey | Admins ",
    description: "This is Next.js Admins page",
};

export default function Admins() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Admin" />
            <div className="min-h-screen w-full rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
                <div className="mx-auto w-full text-center">
                    <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
                        Admin Management
                    </h3>
                    <UserTable/>
                </div>
            </div>
        </div>
    );
}
