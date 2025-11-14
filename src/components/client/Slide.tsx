'use client';

import React, {JSX, useEffect, useRef, useState} from "react";
import { Reorder, useDragControls } from "framer-motion";



const STAR_COUNT = 5;

type ChoiceItem = { id: string; label: string; rating: number; originalIndex: number };
interface choiceType {
    id: string;
    title: string;
    options: string[];
    onChangeVotes?: (votes: number[]) => void;
}

const mapOptionsToItems = (options: string[], pollId: string): ChoiceItem[] =>
    options.map((label, idx) => ({
        id: `${pollId}-${idx}-${label}`,
        label,
        rating: 0,
        originalIndex: idx,
    }));

const buildVotesFromItems = (items: ChoiceItem[], totalOptions: number): number[] => {
    const votes = Array.from({ length: totalOptions }, () => 0);
    for (const item of items) {
        const idx = item.originalIndex;
        if (Number.isInteger(idx) && idx >= 0 && idx < votes.length) {
            votes[idx] = item.rating;
        }
    }
    return votes;
};

export default function Slide({ id, title, options, onChangeVotes }: choiceType):JSX.Element {
    const [items, setItems] = useState<ChoiceItem[]>(() => mapOptionsToItems(options, id));
    const optionCount = options.length;
    const hasInteractedRef = useRef(false);
    const latestOnChangeRef = useRef(onChangeVotes);

    useEffect(() => {
        latestOnChangeRef.current = onChangeVotes;
    }, [onChangeVotes]);

    useEffect(() => {
        setItems((prev) => {
            const next = mapOptionsToItems(options, id);
            const isSameLength = prev.length === next.length;
            const hasSameStructure =
                isSameLength &&
                prev.every((item, index) => {
                    const candidate = next[index];
                    return (
                        candidate &&
                        candidate.label === item.label &&
                        candidate.originalIndex === item.originalIndex
                    );
                });

            if (hasSameStructure) {
                return prev;
            }

            hasInteractedRef.current = false;
            return next;
        });
    }, [id, options]);

    useEffect(() => {
        if (!hasInteractedRef.current || !latestOnChangeRef.current) {
            return;
        }
        latestOnChangeRef.current(buildVotesFromItems(items, optionCount));
    }, [items, optionCount]);

    const handleRate = (itemId: string, rating: number) => {
        const nextRating = Math.max(1, Math.min(STAR_COUNT, rating));

        setItems((prev) => {
            let changed = false;
            const updated = prev.map((it) => {
                if (it.id !== itemId) {
                    return it;
                }
                if (it.rating === nextRating) {
                    return it;
                }
                changed = true;
                return { ...it, rating: nextRating };
            });

            if (changed) {
                hasInteractedRef.current = true;
                return updated;
            }
            return prev;
        });
    };

    return (
        <div className="flex flex-col rounded-[18px] px-[24px] py-[26px] bg-[#85bbf1] drop-shadow-lg my-4 mx-[5%] min-h-[300px]">
            <h1 className="leading-tight text-base font-semibold md:text-lg lg:text-2xl my-2">
                {title}
            </h1>

            <Reorder.Group
                axis="y"
                values={items}
                onReorder={(next) => {
                    hasInteractedRef.current = true;
                    setItems(next);
                }}
                className="my-[8px] mx-[2px] flex flex-col gap-2 lg:mx-[18px]"
            >
                {items.map((item) => (
                    <DraggableRow key={item.id} item={item} onRate={handleRate} />
                ))}
            </Reorder.Group>

            {/* If you need the final order somewhere: items.map(i => i.label) */}
        </div>
    );
}

function DraggableRow({ item, onRate }: { item: ChoiceItem; onRate: (id: string, rating: number) => void }) {
    const controls = useDragControls();
    const [hoveredValue, setHoveredValue] = useState<number | null>(null);
    const displayValue = hoveredValue ?? item.rating;

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
            <p className="flex-1 font-normal text-xs m-0 md:text-base">{item.label}</p>
            <div
                className="flex items-center gap-[0.5px] pr-1 md:pr-2 md:gap-[2px]"
                onMouseLeave={() => setHoveredValue(null)}
                dir="ltr"
            >
                {Array.from({ length: STAR_COUNT }, (_, index) => {
                    const starValue = index + 1;
                    const isActive = starValue <= displayValue;

                    return (
                        <button
                            key={starValue}
                            type="button"
                            className="rounded-md p-1 transition-transform focus:outline-none focus:ring-2 focus:ring-black/20 hover:scale-105"
                            onMouseEnter={() => setHoveredValue(starValue)}
                            onFocus={() => setHoveredValue(starValue)}
                            onBlur={() => setHoveredValue(null)}
                            onClick={() => onRate(item.id, starValue)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onRate(item.id, starValue);
                                }
                            }}
                            aria-label={`Set rating to ${starValue} star${starValue > 1 ? "s" : ""}`}
                            aria-pressed={item.rating >= starValue}
                        >
                            <StarIcon filled={isActive} />
                        </button>
                    );
                })}
            </div>
        </Reorder.Item>
    );
}

function StarIcon({ filled }: { filled: boolean }) {
    const fillColor = filled ? "#facc15" : "#e5e7eb";
    const strokeColor = filled ? "#eab308" : "#94a3b8";

    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M12 2.75l2.574 5.214 5.753.837-4.163 4.06.983 5.731L12 16.994l-5.147 2.598.983-5.731-4.163-4.06 5.753-.837L12 2.75z"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="1"
            />
        </svg>
    );
}
