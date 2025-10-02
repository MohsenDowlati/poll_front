'use client';

import React, { useState} from 'react'


interface choiceType {
    id: string;
    title: string;
    options: string[];
    onChangeSelection?: (index: number) => void;
}

export default function Single({id,title, options, onChangeSelection}:choiceType) {

    const [vote, setVote] = useState<number>(-1)


    return (
        <div className="flex flex-col rounded-[18px] px-[24px] py-[26px] bg-[#85bbf1] drop-shadow-lg my-4 mx-[5%] min-h-[300px]">
          <h1 className="leading-tight text-base font-semibold md:text-lg lg:text-2xl my-2">{title}</h1>
            <div className="my-[8px] mx-[2px] flex flex-col gap-2 lg:mx-[18px]">
                {
                    options.map((choice,index) =>(
                        <div key={`${id}-${index}`} className="flex items-center gap-3 rounded-md bg-white/70 hover:bg-white/90 px-1 py-2 md:py-3 select-none md:px-3" onClick={()=>{ setVote(index); onChangeSelection?.(index); }}>
                            <input type="checkbox" className="opacity-80 w-[20px] h-[20px] md:w-[32px] md:h-[32px]" checked={index===vote}/>
                            <p className="w-[90%] font-normal text-xs m-0 md:text-base">{choice}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}