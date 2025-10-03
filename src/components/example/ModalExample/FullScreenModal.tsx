"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useModal } from "@/hooks/useModal";

import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import PollResult from "@/components/sheet/PollResult";
import {
  AdminPollSummary,
  extractAdminPolls,
  extractPollPaginationMeta,
  fetchAdminPolls,
} from "@/services/poll/poll";

interface FullScreenModalProps {
  sheetId?: string | number;
  sheetTitle?: string;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

export default function FullScreenModal({
  sheetId,
  sheetTitle,
  pageSize = DEFAULT_PAGE_SIZE,
}: FullScreenModalProps) {
  const normalizedSheetId = sheetId !== undefined && sheetId !== null ? String(sheetId).trim() : "";
  const hasSheetId = normalizedSheetId.length > 0;
  const resolvedPageSize = pageSize && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;

  const {
    isOpen: isFullscreenModalOpen,
    openModal: openFullscreenModal,
    closeModal: closeFullscreenModal,
  } = useModal();

  const [page, setPage] = useState(1);
  const [polls, setPolls] = useState<AdminPollSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPolls = useCallback(
    async (pageToLoad: number) => {
      if (!hasSheetId) {
        setPolls([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { status, data } = await fetchAdminPolls({
          id: normalizedSheetId,
          page: pageToLoad,
          page_size: resolvedPageSize,
        });

        if (status >= 200 && status < 300) {
          const fetchedPolls = extractAdminPolls(data);
          setPolls(fetchedPolls);

          const meta = extractPollPaginationMeta(data);
          const effectivePageSize = meta.pageSize && meta.pageSize > 0 ? meta.pageSize : resolvedPageSize;
          const effectivePage = meta.page && meta.page > 0 ? meta.page : pageToLoad;

          let resolvedTotalPages = meta.totalPages;
          if (
            (resolvedTotalPages === undefined || resolvedTotalPages <= 0) &&
            meta.totalItems !== undefined &&
            effectivePageSize > 0
          ) {
            resolvedTotalPages = Math.ceil(meta.totalItems / effectivePageSize);
          }

          if (resolvedTotalPages === undefined) {
            const isLastPage = fetchedPolls.length < effectivePageSize;
            resolvedTotalPages = isLastPage ? Math.max(effectivePage, 1) : Math.max(effectivePage + 1, 1);
          }

          setTotalPages(Math.max(resolvedTotalPages, 1));

          setPage((current) => (current === effectivePage ? current : effectivePage));
        } else {
          setPolls([]);
          setError(`Unable to retrieve poll results (status ${status}).`);
        }
      } catch (fetchError) {
        console.error("Failed to load admin polls", fetchError);
        setPolls([]);
        setError("Failed to load poll results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [hasSheetId, normalizedSheetId, resolvedPageSize],
  );

  useEffect(() => {
    setPage(1);
    setPolls([]);
    setTotalPages(1);
    setError(null);
    setIsLoading(false);
  }, [normalizedSheetId]);

  useEffect(() => {
    if (!isFullscreenModalOpen) {
      setPolls([]);
      setError(null);
      setIsLoading(false);
      setTotalPages(1);
      setPage(1);
      return;
    }

    void loadPolls(page);
  }, [isFullscreenModalOpen, page, loadPolls]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    polls.forEach((poll) => {
      if (poll.category) {
        set.add(poll.category);
      }
    });
    return Array.from(set);
  }, [polls]);

  const totalParticipants = useMemo(
    () => polls.reduce((acc, poll) => acc + poll.participants, 0),
    [polls],
  );

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const handlePrev = () => {
    if (canGoPrev) {
      setPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setPage((prev) => Math.min(prev + 1, totalPages));
    }
  };

  const handleOpen = () => {
    if (!hasSheetId) {
      return;
    }
    openFullscreenModal();
  };

  const handleSave = () => {
    console.log("Saving changes...");
    closeFullscreenModal();
  };

  const headerTitle = sheetTitle ?? (hasSheetId ? `Sheet ${normalizedSheetId}` : "Select a sheet");

  return (
    <div>
      <Button size="sm" onClick={handleOpen} disabled={!hasSheetId}>
        Analyze
      </Button>
      <Modal
        isOpen={isFullscreenModalOpen}
        onClose={closeFullscreenModal}
        isFullscreen={true}
        showCloseButton={true}
      >
        <div className="fixed top-0 left-0 flex flex-col justify-between w-full h-screen p-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 lg:p-10">
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 text-title-sm dark:text-white/90">
              Poll Results
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{headerTitle}</p>

            {uniqueCategories.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-600 dark:text-gray-300">
                {uniqueCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-wide dark:border-gray-700"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            {hasSheetId ? (
              <div className="space-y-6">
                {isLoading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading poll results...</p>
                )}

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                {!isLoading && !error && polls.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No poll results available for this sheet yet.</p>
                )}

                {polls.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total participants across polls: {totalParticipants}
                  </p>
                )}

                {polls.map((poll) => (
                  <PollResult
                    key={poll.id}
                    title={poll.title}
                    options={poll.options}
                    votes={poll.votes}
                    category={poll.category}
                    type={poll.type}
                    participants={poll.participants}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a sheet to analyze poll results.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {totalPages > 1 && (
              <div className="flex flex-col justify-between gap-3 text-sm text-gray-600 dark:text-gray-300 md:flex-row md:items-center">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handlePrev} disabled={!canGoPrev || isLoading}>
                    Previous
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleNext} disabled={!canGoNext || isLoading}>
                    Next
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end w-full gap-3">
              <Button size="sm" variant="outline" onClick={closeFullscreenModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save as PDF
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save as CSV
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
