import React from "react";
import { useLocale } from "@/hooks/useLocale";
import SingleChart from "@/components/charts/circular/SingleChart";
import BarChartOne from "@/components/charts/bar/BarChartOne";

interface ComponentCardProps {
    title: string;
    options: string[];
    votes: number[];
    category: string[];
    className?: string;
    type: string;
    participants: number;
}

const PollResult: React.FC<ComponentCardProps> = ({
                                                    title,
                                                    options,
                                                    category,
                                                    className = "",
                                                    type,
    participants,
    votes
                                                }) => {
    const { t } = useLocale();
    const normalizedType = type.toLowerCase();
    const isTextType = normalizedType === "text" || normalizedType === "opinion";
    const isSingleType = normalizedType === "single" || normalizedType === "single_choice";
    const isMultiType = normalizedType === "multiple" || normalizedType === "multi_choice";
    const isSlideType = normalizedType === "slide" || normalizedType === "slider";
    const translateCategory = (rawValue: unknown) => {
        const value = typeof rawValue === "string" ? rawValue : String(rawValue ?? "");
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
            return value;
        }
        if (normalized === "uncategorized") {
            return t("sheet.poll.uncategorized");
        }
        return t(`sheet.poll.categories.${normalized}`, { defaultValue: value });
    };
    const categoriesLabel = category.length > 0 ? category.map((item) => translateCategory(item)).join(", ") : undefined;




    return (
        <div className={`my-2 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
            <div className="px-6 py-5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-medium text-gray-800 dark:text-white/90 lg:text-2xl">{title}</h3>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm text-gray-500 dark:text-gray-400">
                    {categoriesLabel ? (
                        <span className="uppercase tracking-wide text-xs text-gray-400 dark:text-gray-500">
                            {categoriesLabel}
                        </span>
                    ) : null}
                    <span>{t("sheet.poll.totalVotes", { count: participants })}</span>
                </div>
            </div>
            <div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
                    {!isTextType && options.length > 0 ? (
                        <div className="space-y-6">
                            {options.map((option, index) => (
                                <div key={index} className="flex flex-row gap-2 items-center">
                                    <div className="h-3 w-3 rounded-full bg-blue-950" />
                                    <p className="text-gray-700 dark:text-gray-400 text-sm lg:text-lg">{option}</p>
                                    <p>{t("sheet.poll.voteCount", { count: votes[index] ?? 0 })}</p>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
                <div>
                    {options.length > 0 && (
                        <>
                            {isSingleType && <SingleChart option={options} votes={votes}/>}
                            {(isMultiType || isSlideType) && <BarChartOne option={options} votes={votes} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PollResult;
