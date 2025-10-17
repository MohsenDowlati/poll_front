import {Metadata} from "next";
import React from "react";
import PollMaker from "@/components/client/PollMaker";

export const metadata: Metadata = {
    title: " Poll ",
    description: "This is Next.js Client page",
};

export default async function Client({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <article>
            <PollMaker id={id}/>
        </article>
    );
}
