import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import SheetMaker from "@/components/sheet/SheetMaker";

export const metadata: Metadata = {
    title: "Survey | New Sheet",
    description: "This is Next.js new Sheet page",
};

export default function AddPage() {

    return (
        <div>
            <PageBreadcrumb pageTitle="New Poll Sheet" />
            <div className="min-h-screen w-full rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
                <SheetMaker/>
            </div>
        </div>
    );
}
