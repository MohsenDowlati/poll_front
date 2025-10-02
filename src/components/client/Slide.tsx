'use client';

import React, {JSX, useEffect, useMemo, useState} from "react";
import { Reorder, useDragControls } from "framer-motion";


function HamburgerSvg({className}: {className: string}) {
    return (
        <svg
            height="32px"
            width="32px"
            viewBox="0 0 32 32"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z
               M28,14H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z
               M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,22,28,22z"/>
        </svg>
    )
}

type ChoiceItem = { id: string; label: string };
interface choiceType {
    id: string;
    title: string;
    options: string[];
    onChangeOrder?: (orderIndices: number[]) => void;
}

export default function Slide({ id, title, options, onChangeOrder }: choiceType):JSX.Element {
    // build stable ids for options (even if labels repeat)
    const initialItems = useMemo<ChoiceItem[]>(
        () => options.map((label, idx) => ({ id: `${id}-${idx}-${label}`, label })),
        [options, id]
    );

    const [items, setItems] = useState<ChoiceItem[]>(initialItems);

    // keep local list in sync if `options` prop changes
    useEffect(() => setItems(initialItems), [initialItems]);

    return (
        <div className="flex flex-col rounded-[18px] px-[24px] py-[26px] bg-[#85bbf1] drop-shadow-lg my-4 mx-[5%] min-h-[300px]">
            <h1 className="leading-tight text-base font-semibold md:text-lg lg:text-2xl my-2">
                {title}
            </h1>

            <Reorder.Group
                axis="y"
                values={items}
                onReorder={(next) => {
                    setItems(next);
                    const orderIndices = next.map((it) => Number(it.id.split('-')[1]));
                    onChangeOrder?.(orderIndices);
                }}
                className="my-[8px] mx-[2px] flex flex-col gap-2 lg:mx-[18px]"
            >
                {items.map((item) => (
                    <DraggableRow key={item.id} item={item} />
                ))}
            </Reorder.Group>

            {/* If you need the final order somewhere: items.map(i => i.label) */}
        </div>
    );
}

function DraggableRow({ item }: { item: ChoiceItem }) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={controls}
            layout
            transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
            whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px rgba(0,0,0,0.18)" }}
            className="flex items-center gap-3 rounded-xl bg-white/70 hover:bg-white/90 px-1 py-2 md:py-3 select-none md:px-3"
        >
            <button
                type="button"
                onPointerDown={(e) => {
                    // start drag with left mouse / touch / pen
                    if (e.button === 0 || e.pointerType !== "mouse") {
                        controls.start(e);
                    }
                }}
                className="p-1 md:p-2 cursor-grab active:cursor-grabbing rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                aria-label="Drag to reorder"
            >
                <HamburgerSvg className="opacity-80 w-[20px] h-[20px] lg:w-[32px] lg:h-[32px]" />
            </button>

            <p className="w-[90%] font-normal text-xs m-0 md:text-base">{item.label}</p>
        </Reorder.Item>
    );
}
