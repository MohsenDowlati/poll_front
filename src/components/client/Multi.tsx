'use client';

import React, { useEffect, useState } from 'react';

interface ChoiceProps {
    id: string;
    title: string;
    options: string[];
    onChangeSelection?: (indices: number[]) => void;
}

export default function Multi({ id, title, options, onChangeSelection }: ChoiceProps) {
    const [voteState, setVoteState] = useState<boolean[]>(() => Array(options.length).fill(false));

    useEffect(() => {
        setVoteState(Array(options.length).fill(false));
    }, [options.length]);

    const handleToggle = (index: number) => {
        const next = voteState.map((selected, idx) => (idx === index ? !selected : selected));
        setVoteState(next);

        if (!onChangeSelection) {
            return;
        }

        const selected = next.reduce<number[]>((acc, isSelected, idx) => {
            if (isSelected) {
                acc.push(idx);
            }
            return acc;
        }, []);

        onChangeSelection(selected);
    };

    return (
        <div className="flex flex-col rounded-[18px] px-[24px] py-[26px] bg-[#85bbf1] drop-shadow-lg my-4 mx-[5%] min-h-[300px]">
            <h1 className="leading-tight text-base font-semibold md:text-lg lg:text-2xl my-2">{title}</h1>
            <div className="my-[8px] mx-[2px] flex flex-col gap-2 lg:mx-[18px]">
                {options.map((choice, index) => (
                    <div
                        key={`${id}-${index}`}
                        className="flex items-center gap-3 rounded-md bg-white/70 hover:bg-white/90 px-1 py-2 md:py-3 select-none md:px-3"
                        onClick={() => handleToggle(index)}
                    >
                        <input
                            type="checkbox"
                            className="opacity-80 w-[20px] h-[20px] md:w-[32px] md:h-[32px]"
                            checked={voteState[index]}
                            readOnly
                        />
                        <p className="w-[90%] font-normal text-xs m-0 md:text-base">{choice}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
