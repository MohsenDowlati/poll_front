import { Metadata } from "next";
import React from "react";
import Error from "@/components/error/Error"

export const metadata: Metadata = {
  title: "Not Found",
  description:
    "This is Next.js Error 404 page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function Error404() {
  return (
   <div>
       <Error />
   </div>
  );
}
