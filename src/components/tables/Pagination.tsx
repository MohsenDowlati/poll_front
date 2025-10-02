"use client";

import { FC, useEffect, useMemo, useState } from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const SMALL_SCREEN_QUERY = "(max-width: 640px)";

const Pagination: FC<PaginationProps> = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(SMALL_SCREEN_QUERY);

    const updateScreenSize = (event?: MediaQueryListEvent) => {
      setIsSmallScreen(event ? event.matches : mediaQuery.matches);
    };

    updateScreenSize();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateScreenSize);
      return () => mediaQuery.removeEventListener("change", updateScreenSize);
    }

    mediaQuery.addListener(updateScreenSize);
    return () => mediaQuery.removeListener(updateScreenSize);
  }, []);

  const pageWindowSize = Math.min(isSmallScreen ? 1 : 3, totalPages);

  const startPage = useMemo(() => {
    if (pageWindowSize === 0) {
      return 1;
    }

    const halfWindow = Math.floor(pageWindowSize / 2);
    const maxStart = Math.max(totalPages - pageWindowSize + 1, 1);
    const tentativeStart = currentPage - halfWindow;

    return Math.min(Math.max(tentativeStart, 1), maxStart);
  }, [currentPage, pageWindowSize, totalPages]);

  const pagesAroundCurrent = useMemo(() => {
    if (pageWindowSize === 0) {
      return [] as number[];
    }

    return Array.from({ length: pageWindowSize }, (_, idx) => startPage + idx);
  }, [pageWindowSize, startPage]);

  const firstVisiblePage = pagesAroundCurrent[0] ?? 0;
  const lastVisiblePage = pagesAroundCurrent[pagesAroundCurrent.length - 1] ?? 0;
  const showLeadingEllipsis = firstVisiblePage > 2;
  const showTrailingEllipsis = lastVisiblePage < totalPages - 1;

  return (
    <div className="flex items-center w-full mt-2.5 lg:w-fit">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-sm"
      >
        Previous
      </button>
      <div className="flex items-center gap-2">
        {showLeadingEllipsis && <span className="px-2">...</span>}
        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded ${
              currentPage === page
                ? "bg-brand-500 text-white"
                : "text-gray-700 dark:text-gray-400"
            } flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}
          >
            {page}
          </button>
        ))}
        {showTrailingEllipsis && <span className="px-2">...</span>}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
