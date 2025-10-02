'use client';

import React, { useState } from "react";

interface opinionType {
    id: string;
    title: string;
    options?: string[];
    onChangeOpinion?: (value: string) => void;
}

export default function Text({ id, title, onChangeOpinion }: opinionType) {
    const [opinion, setOpinion] = useState("");

    return (
        <div className="flex flex-col rounded-[18px] px-[24px] py-[26px] bg-[#85bbf1] drop-shadow-lg my-4 mx-[5%] min-h-[300px]">
            <h1 className="leading-tight text-base font-semibold md:text-lg lg:text-2xl my-2">{title}</h1>
            <div className="my-[8px] mx-[2px] flex justify-center gap-2 lg:mx-[18px]">
        <textarea
            value={opinion}
            onChange={(e) => { const v = e.target.value; setOpinion(v); onChangeOpinion?.(v); }}
            className="w-full min-h-[300px] bg-[#f5f5f5]/70 rounded-[15px] p-3 outline-none resize-none text-left font-normal text-base m-0 md:text-lg lg:w-[90%]"
            placeholder="Type your opinion..."
            rows={8}
            wrap="soft"
            dir="auto"
        />
            </div>
        </div>
    );
}
