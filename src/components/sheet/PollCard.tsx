import React from "react";

interface ComponentCardProps {
  title: string;
  options: string[];
  category: string;
  className?: string; // Additional custom classes for styling
  type: string;
  onDelete?: () => void;
}

const PollCard: React.FC<ComponentCardProps> = ({
  title,
  options,
  category,
  className = "",
  type,
  onDelete,
}) => {
  const normalizedType = type.toLowerCase();
  const isTextType = normalizedType === "text" || normalizedType === "opinion";

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      <div className="px-6 py-5 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-error-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-error-500"
              aria-label="Delete poll"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h10" />
                <path d="M6 4V2.75A.75.75 0 0 1 6.75 2h2.5a.75.75 0 0 1 .75.75V4" />
                <path d="M6.5 7v4" />
                <path d="M9.5 7v4" />
                <path d="M4.5 4h7l-.55 8.25A1 1 0 0 1 9.96 13H6.04a1 1 0 0 1-.99-.75L4.5 4Z" />
              </svg>
            </button>
          ) : null}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-right">{category}</p>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        {!isTextType && options.length > 0 ? (
          <div className="space-y-6">
            {options.map((option, index) => (
              <div key={index} className="flex flex-row gap-2 items-center">
                <div className="h-3 w-3 rounded-full bg-blue-950" />
                <p className="text-gray-700 dark:text-gray-400">{option}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PollCard;
