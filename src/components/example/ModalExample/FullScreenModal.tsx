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
import { useLocale } from "@/hooks/useLocale";
import { getAuthTokenFromCookie } from "@/utils/authToken";
import { decodeJwtPayload } from "@/utils/jwt";
import { isSuperAdmin } from "@/utils/roles";

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

  const { t } = useLocale();

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
  const [canExportResults, setCanExportResults] = useState(false);

  const extractCategories = useCallback((raw: unknown): string[] => {
    if (Array.isArray(raw)) {
      return raw
        .map((value) =>
          typeof value === "string" ? value.trim() : String(value ?? "").trim(),
        )
        .filter((value) => value.length > 0);
    }

    if (typeof raw === "string") {
      return raw
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    }

    return [];
  }, []);

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
          setError(t("analyze.error"));
        }
      } catch (fetchError) {
        console.error("Failed to load admin polls", fetchError);
        setPolls([]);
        setError(t("analyze.error"));
      } finally {
        setIsLoading(false);
      }
    },
    [hasSheetId, normalizedSheetId, resolvedPageSize, t],
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

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setCanExportResults(false);
      return;
    }

    const payload = decodeJwtPayload(token);
    setCanExportResults(isSuperAdmin(payload));
  }, []);

  const categoryLabelMap = useMemo(() => {
    const labelMap = new Map<string, string>();

    polls.forEach((poll) => {
      const categories = extractCategories(poll.category);
      if (categories.length === 0) {
        return;
      }

      categories.forEach((category) => {
        const normalized = category.toLowerCase();
        if (!labelMap.has(normalized)) {
          labelMap.set(normalized, category);
        }
      });
    });

    return labelMap;
  }, [extractCategories, polls]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    polls.forEach((poll) => {
      const categories = extractCategories(poll.category);
      if (categories.length === 0) {
        set.add("uncategorized");
        return;
      }

      categories.forEach((category) => set.add(category.toLowerCase()));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [extractCategories, polls]);

  const translateCategory = useCallback(
    (value: string) => {
      const normalized = value.toLowerCase();
      if (normalized === "uncategorized") {
        return t("sheet.poll.uncategorized");
      }
      const translationKey = `sheet.poll.categories.${normalized}`;
      const translated = t(translationKey);
      if (translated !== translationKey) {
        return translated;
      }
      return categoryLabelMap.get(normalized) ?? value;
    },
    [categoryLabelMap, t],
  );

  const pollsByCategory = useMemo(() => {
    const map = new Map<string, AdminPollSummary[]>();

    polls.forEach((poll) => {
      const categories = extractCategories(poll.category);
      const normalizedCategories =
        categories.length > 0 ? categories.map((category) => category.toLowerCase()) : ["uncategorized"];

      normalizedCategories.forEach((category) => {
        const existing = map.get(category) ?? [];
        existing.push(poll);
        map.set(category, existing);
      });
    });

    return map;
  }, [extractCategories, polls]);

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

  const handleSave = (format: "pdf" | "csv") => {
    console.log(`Saving changes as ${format.toUpperCase()}...`);
    closeFullscreenModal();
  };

  const headerTitle = sheetTitle ?? (hasSheetId ? normalizedSheetId : "");



  return (
    <div>
      <Button size="sm" onClick={handleOpen} disabled={!hasSheetId}>
        {t('tables.headers.analyze')}
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
              {t('analyze.header')}
            </h4>
            {headerTitle ? (
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{headerTitle}</p>
            ) : null}

            {uniqueCategories.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-600 dark:text-gray-300">
                {uniqueCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-wide dark:border-gray-700"
                  >
                    {translateCategory(category)}
                  </span>
                ))}
              </div>
            )}

            {hasSheetId ? (
              <div className="space-y-6">
                {isLoading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("analyze.loading")}</p>
                )}

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                {!isLoading && !error && polls.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("analyze.empty")}</p>
                )}

                {polls.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("analyze.totalParticipants", { count: totalParticipants })}
                  </p>
                )}

                {uniqueCategories.map((category) => {
                  const categoryPolls = pollsByCategory.get(category) ?? [];
                  if (categoryPolls.length === 0) {
                    return null;
                  }

                  return (
                    <section key={category} className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <header className="flex items-center justify-between gap-2">
                        <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">{translateCategory(category)}</h5>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t("analyze.category.pollCount", { count: categoryPolls.length })}
                        </span>
                      </header>
                      <div className="space-y-4">
                        {categoryPolls.map((poll) => (
                          <PollResult
                            key={`${category}-${poll.id}`}
                            title={poll.title}
                            options={poll.options}
                            votes={poll.votes}
                            category={extractCategories(poll.category)}
                            type={poll.type}
                            participants={poll.participants}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("analyze.prompt.selectSheet")}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {totalPages > 1 && (
              <div className="flex flex-col justify-between gap-3 text-sm text-gray-600 dark:text-gray-300 md:flex-row md:items-center">
                <span>
                  {t("analyze.pagination.label", { page, total: totalPages })}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handlePrev} disabled={!canGoPrev || isLoading}>
                    {t("actions.previous")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleNext} disabled={!canGoNext || isLoading}>
                    {t("actions.next")}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end w-full gap-3">
              <Button size="sm" variant="outline" onClick={closeFullscreenModal}>
                {t("actions.close")}
              </Button>
              {canExportResults && (
                <>
                  <Button size="sm" onClick={() => handleSave("pdf")}>
                    {t("actions.savePdf")}
                  </Button>
                  <Button size="sm" onClick={() => handleSave("csv")}>
                    {t("actions.saveCsv")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
