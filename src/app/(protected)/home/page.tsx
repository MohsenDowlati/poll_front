import type { Metadata } from "next";
import React from "react";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import NewSheetCta from "@/components/ecommerce/NewSheetCta";

export const metadata: Metadata = {
  title: "survey | Dashboard",
  description: "This is Next.js Home for Survey",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <RecentOrders />
      </div>
      <div className="col-span-12 flex justify-end">
        <NewSheetCta />
      </div>
    </div>
  );
}
