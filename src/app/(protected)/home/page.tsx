import type { Metadata } from "next";
import React from "react";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import Button from "@/components/ui/button/Button";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "survey | Dashboard",
  description: "This is Next.js Home for Survey",
};

export default function Ecommerce() {

    
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <RecentOrders />
      </div>
        <Link href={"/add-sheet"} >
            <Button children={<p>New Sheet</p>} variant="primary" startIcon={<div>+</div>} className="w-52"/>
        </Link>

    </div>
  );
}
