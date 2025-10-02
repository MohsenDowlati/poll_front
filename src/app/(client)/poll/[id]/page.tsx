import {Metadata} from "next";
import React from "react";
import PollMaker from "@/components/client/PollMaker";

export const metadata: Metadata = {
    title: " Poll ",
    description: "This is Next.js Client page",
};

export default function Client({ params }:any) {
    const { id } = params;

    return (
        <article>
            <PollMaker id={id}/>
        </article>
    );
}