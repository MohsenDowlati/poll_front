'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../ui/table';
import Badge from '../ui/badge/Badge';
import Label from '@/components/form/Label';
import { useLocale } from '@/hooks/useLocale';
import {
  deleteSheet,
  extractSheetList,
  extractSheetPaginationMeta,
  fetchSheets,
  finishSheet,
  type SheetPollRecord,
  type SheetRecord,
} from '@/services/sheet/sheet';
import {
  deletePoll,
  extractPollPaginationMeta,
  extractPolls,
  fetchAdminPolls,
} from '@/services/poll/poll';
import { getAuthTokenFromCookie } from '@/utils/authToken';
import { decodeJwtPayload } from '@/utils/jwt';
import { isSuperAdmin } from '@/utils/roles';
import { useRouter } from "next/navigation";
import FullScreenModal from "@/components/example/ModalExample/FullScreenModal";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 15;
const ADMIN_POLL_PAGE_SIZE = 200;
const DELETABLE_STATUSES = new Set(['finished', 'rejected']);
const FINISHABLE_STATUSES = new Set(['published']);

const toTitleCase = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const resolveName = (sheet: SheetRecord, translate: TFunction<'translation'>): string => {
  const { name, title, id } = sheet;
  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }
  if (typeof title === 'string' && title.trim()) {
    return title.trim();
  }
  if (id !== undefined && id !== null) {
    return String(id);
  }
  return translate('status.unknown');
};

const resolveSubtitle = (sheet: SheetRecord): string => {
  if (typeof sheet.venue === 'string' && sheet.venue.trim()) {
    return sheet.venue.trim();
  }
  return '-';
};


const resolveOwner = (sheet: SheetRecord): string => {
  const candidates = [
    sheet.owner,
    sheet.user_name,
    sheet.approved_by,
    sheet.created_by,
    sheet.createdBy,
    (sheet as Record<string, unknown>).created_by_name,
    (sheet as Record<string, unknown>).creator,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '-';
};

const formatDate = (value?: string): string => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const resolveDate = (sheet: SheetRecord): string => {
  const candidates = [sheet.created_at, sheet.approved_at, sheet.updated_at , sheet.updatedAt];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return formatDate(candidate);
    }
  }
  return '-';
};

const resolveStatusMeta = (
  statusValue: string | undefined,
  translate: TFunction<'translation'>
) => {
  if (!statusValue) {
    return { label: '-', color: 'light' as const };
  }

  const normalized = statusValue.toLowerCase();
  const translationKey = `status.${normalized}`;

  if (normalized === 'pending') {
    return { label: translate(translationKey), color: 'warning' as const };
  }

  if (normalized === 'finished') {
    return { label: translate(translationKey), color: 'info' as const}
  }

  if (['approved', 'published', 'active', 'verified'].includes(normalized)) {
    return { label: translate(translationKey), color: 'success' as const };
  }

  if (['rejected', 'deleted', 'inactive', 'closed'].includes(normalized)) {
    return { label: translate(translationKey), color: 'error' as const };
  }

  return {
    label: translate(translationKey, { defaultValue: toTitleCase(statusValue) }),
    color: 'info' as const,
  };
};

const resolveSheetIdentifier = (sheet: SheetRecord): string | number | undefined => {
  const candidates: Array<string | number | undefined | null> = [
    sheet.id as string | number | undefined,
    (sheet as Record<string, unknown>).sheet_id as string | number | undefined,
    (sheet as Record<string, unknown>).sheetId as string | number | undefined,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }

  return undefined;
};

const SkeletonLine = ({
  width,
  height = 12,
  className,
}: {
  width: number | string;
  height?: number;
  className?: string;
}) => (
  <div
    className={`bg-gradient-to-r from-gray-200/80 via-gray-100/60 to-gray-200/80 dark:from-white/[0.18] dark:via-white/[0.08] dark:to-white/[0.16] ${className ?? ''}`}
    style={{ width, height }}
  />
);

const SkeletonSheetRow = ({ canManageSheets }: { canManageSheets: boolean }) => (
  <div className="w-full animate-pulse rounded-2xl border border-gray-100/60 bg-gradient-to-br from-gray-100/60 via-white to-gray-100/30 p-4 shadow-theme-xs dark:border-gray-800/70 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.08]">
    <div className="grid grid-cols-12 items-center gap-4">
      <div className="col-span-4 flex flex-col gap-2">
        <SkeletonLine width="60%" height={14} className="rounded-full" />
        <SkeletonLine width="35%" height={10} className="rounded-full opacity-80" />
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <SkeletonLine width="70%" height={12} className="rounded-full" />
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <SkeletonLine width="55%" height={12} className="rounded-full" />
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <SkeletonLine width={90} height={22} className="rounded-full" />
      </div>
      {canManageSheets && (
        <div className="col-span-1 flex items-center gap-2">
          <SkeletonLine width={32} height={32} className="rounded-full" />
          <SkeletonLine width={32} height={32} className="rounded-full" />
        </div>
      )}
      <div className={`${canManageSheets ? 'col-span-1' : 'col-span-2'} flex justify-end`}>
        <SkeletonLine width={108} height={32} className="rounded-xl" />
      </div>
    </div>
  </div>
);



const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.4017 4.35986L6.12166 11.6399L2.59833 8.11657"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.05394 4.78033C3.76105 4.48744 3.76105 4.01256 4.05394 3.71967C4.34684 3.42678 4.82171 3.42678 5.1146 3.71967L8.33437 6.93944L11.5521 3.72173C11.845 3.42883 12.3199 3.42883 12.6127 3.72173C12.9056 4.01462 12.9056 4.48949 12.6127 4.78239L9.39503 8.0001L12.6127 11.2178C12.9056 11.5107 12.9056 11.9856 12.6127 12.2785C12.3198 12.5713 11.845 12.5713 11.5521 12.2785L8.33437 9.06076L5.11462 12.2805C4.82173 12.5734 4.34685 12.5734 4.05396 12.2805C3.76107 11.9876 3.76107 11.5127 4.05396 11.2199L7.27371 8.0001L4.05394 4.78033Z"
      fill="currentColor"
    />
  </svg>
);

const FinishIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8C14.5 11.5899 11.5899 14.5 8 14.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M5.75 8.08333L7.10638 9.43971C7.19969 9.53302 7.35031 9.53302 7.44362 9.43971L10.25 6.63333"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.5 2.5L5.79289 2.20711C5.925 2.075 6.10754 2 6.2981 2H9.7019C9.89246 2 10.075 2.075 10.2071 2.20711L10.5 2.5H12.5C12.7761 2.5 13 2.72386 13 3C13 3.27614 12.7761 3.5 12.5 3.5H3.5C3.22386 3.5 3 3.27614 3 3C3 2.72386 3.22386 2.5 3.5 2.5H5.5Z"
      fill="currentColor"
    />
    <path
      d="M4 5H12V12.5C12 13.3284 11.3284 14 10.5 14H5.5C4.67157 14 4 13.3284 4 12.5V5Z"
      fill="currentColor"
    />
  </svg>
);

export default function RecentOrders() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sheets, setSheets] = useState<SheetRecord[]>([]);
  const [totalItems, setTotalItems] = useState<number | undefined>(undefined);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [deletingSheetIds, setDeletingSheetIds] = useState<Record<string, boolean>>({});
  const [finishingSheetIds, setFinishingSheetIds] = useState<Record<string, boolean>>({});
  const [canManageSheets, setCanManageSheets] = useState(false);
  const { t, language } = useLocale();
  const locale = language === 'fa' ? 'fa-IR' : 'en-US';
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const formatNumber = useCallback((value: number) => numberFormatter.format(value), [numberFormatter]);

  const router = useRouter();

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) {
      router.push("/")
    }
    const payload = decodeJwtPayload(token);
    setCanManageSheets(isSuperAdmin(payload));
  }, [router]);

  useEffect(() => {
    setMutationError(null);
    let isMounted = true;

    const loadSheets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { status, data } = await fetchSheets({
          page,
          page_size: pageSize,
        });

        if (!isMounted) {
          return;
        }

        if (status >= 200 && status < 300) {
          const fetchedSheets = extractSheetList(data);
          setSheets(fetchedSheets);

          const meta = extractSheetPaginationMeta(data, pageSize);
          const effectivePageSize = meta.pageSize && meta.pageSize > 0 ? meta.pageSize : pageSize;
          const effectivePage = meta.page && meta.page > 0 ? meta.page : page;

          let resolvedTotalPages = meta.totalPages;
          if (
            (resolvedTotalPages === undefined || resolvedTotalPages <= 0) &&
            meta.totalItems !== undefined &&
            effectivePageSize > 0
          ) {
            resolvedTotalPages = Math.ceil(meta.totalItems / effectivePageSize);
          }

          if (resolvedTotalPages === undefined) {
            const isLastPage = fetchedSheets.length < effectivePageSize;
            resolvedTotalPages = isLastPage
              ? Math.max(effectivePage, 1)
              : Math.max(effectivePage + 1, 1);
          }

          setTotalPages(Math.max(resolvedTotalPages, 1));
          setTotalItems(meta.totalItems);

          if (effectivePageSize !== pageSize) {
            setPageSize(effectivePageSize);
          }

          if (effectivePage !== page) {
            setPage(effectivePage);
          }
        } else {
          setSheets([]);
          setError(t('tables.error.load'));
        }
      } catch (fetchError) {
        console.error('Failed to fetch sheets', fetchError);
        if (!isMounted) {
          return;
        }
        setSheets([]);
        setError(t('tables.error.unavailable'));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSheets();
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, t]);

  const handlePageChange = (nextPage: number) => {
    const targetPage = Math.max(nextPage, 1);
    if (targetPage === page) {
      return;
    }
    setPage(Math.min(targetPage, Math.max(totalPages, 1)));
  };

  const paginationLabel = useMemo(() => {
    const startIndex = sheets.length > 0 ? (page - 1) * pageSize + 1 : 0;
    const endIndex = sheets.length > 0 ? startIndex + sheets.length - 1 : 0;

    if (totalItems !== undefined) {
      const cappedEnd = endIndex ? Math.min(endIndex, totalItems) : 0;
      const effectiveStart = startIndex || (totalItems > 0 ? 1 : 0);
      return t('tables.pagination.range', {
        start: formatNumber(effectiveStart),
        end: formatNumber(cappedEnd),
        total: formatNumber(totalItems),
      });
    }

    return t('tables.pagination.rangeNoTotal', {
      start: formatNumber(startIndex),
      end: formatNumber(endIndex),
    });
  }, [formatNumber, page, pageSize, sheets.length, t, totalItems]);

  const showEmptyState = !isLoading && sheets.length === 0 && !error;

  const handleRowClick = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>, identifier: string | number | undefined) => {
      if (identifier === undefined || identifier === null) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        target.closest('button, a, [role="button"], input, textarea, select')
      ) {
        return;
      }

      const link = `http://iicc-poll.runflare.run/poll/${String(identifier)}`;
      const fallbackCopy = (value: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      };

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(link).catch(() => {
          fallbackCopy(link);
        });
      } else {
        fallbackCopy(link);
      }
    },
    [],
  );

  const handleFinishSheet = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>, sheet: SheetRecord) => {
      event.stopPropagation();
      setMutationError(null);

      const identifier = resolveSheetIdentifier(sheet);
      if (identifier === undefined || identifier === null) {
        return;
      }

      const normalizedStatus = (sheet.status ?? '').toString().toLowerCase();
      if (!FINISHABLE_STATUSES.has(normalizedStatus)) {
        return;
      }

      const trackerKey = String(identifier);
      setFinishingSheetIds((prev) => ({ ...prev, [trackerKey]: true }));

      try {
        await finishSheet(identifier);
        setSheets((prevSheets) =>
          prevSheets.map((candidate) => {
            if (resolveSheetIdentifier(candidate) === identifier) {
              return {
                ...candidate,
                status: 'finished',
              };
            }
            return candidate;
          }),
        );
      } catch (finishError) {
        console.error('Failed to finish sheet', finishError);
        setMutationError(
          t('tables.error.finishSheet', {
            defaultValue: 'Failed to mark sheet as finished. Please try again.',
          }),
        );
      } finally {
        setFinishingSheetIds((prev) => {
          const next = { ...prev };
          delete next[trackerKey];
          return next;
        });
      }
    },
    [setSheets, setMutationError, setFinishingSheetIds, t],
  );

  const handleDeleteSheet = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>, sheet: SheetRecord) => {
      event.stopPropagation();
      setMutationError(null);

      const identifier = resolveSheetIdentifier(sheet);
      if (identifier === undefined || identifier === null) {
        return;
      }

      const normalizedStatus = (sheet.status ?? '').toString().toLowerCase();
      if (!DELETABLE_STATUSES.has(normalizedStatus)) {
        return;
      }

      const trackerKey = String(identifier);
      setDeletingSheetIds((prev) => ({ ...prev, [trackerKey]: true }));

      try {
        const pollIds = new Set<string | number>();

        if (Array.isArray(sheet.polls)) {
          for (const rawPoll of sheet.polls) {
            const pollRecord = rawPoll as SheetPollRecord;
            const pollId = pollRecord?.id;
            if (pollId !== undefined && pollId !== null) {
              pollIds.add(pollId);
            }
          }
        }

        if (pollIds.size === 0) {
          let currentPage = 1;
          let keepFetching = true;

          while (keepFetching) {
            const { status, data } = await fetchAdminPolls({
              id: identifier,
              page: currentPage,
              page_size: ADMIN_POLL_PAGE_SIZE,
            });

            if (status < 200 || status >= 300) {
              throw new Error(`Unexpected status ${status} while fetching polls for deletion.`);
            }

            const fetchedPolls = extractPolls(data);
            for (const poll of fetchedPolls) {
              const pollId = poll?.id;
              if (pollId !== undefined && pollId !== null) {
                pollIds.add(pollId);
              }
            }

            const meta = extractPollPaginationMeta(data);
            const effectivePageSize =
              meta.pageSize && meta.pageSize > 0 ? meta.pageSize : ADMIN_POLL_PAGE_SIZE;
            const resolvedTotalPages =
              meta.totalPages && meta.totalPages > 0 ? meta.totalPages : undefined;

            if (resolvedTotalPages !== undefined) {
              keepFetching = currentPage < resolvedTotalPages;
            } else if (fetchedPolls.length === 0 || fetchedPolls.length < effectivePageSize) {
              keepFetching = false;
            } else {
              currentPage += 1;
              continue;
            }

            if (keepFetching) {
              currentPage += 1;
            }
          }
        }

        if (pollIds.size === 0) {
          await deletePoll(identifier);
        } else {
          for (const pollId of pollIds) {
            await deletePoll(pollId);
          }
        }

        await deleteSheet(identifier);

        setSheets((prevSheets) => {
          const updated = prevSheets.filter(
            (candidate) => resolveSheetIdentifier(candidate) !== identifier,
          );

          if (updated.length !== prevSheets.length) {
            if (updated.length === 0) {
              setPage((currentPage) => (currentPage > 1 ? currentPage - 1 : currentPage));
            }
          }

          return updated;
        });

        setTotalItems((prevTotal) => {
          if (typeof prevTotal === 'number') {
            return Math.max(prevTotal - 1, 0);
          }
          return prevTotal;
        });
      } catch (deleteError) {
        console.error('Failed to delete sheet', deleteError);
        setMutationError(
          t('tables.error.deleteSheet', {
            defaultValue: 'Failed to delete sheet. Please try again.',
          }),
        );
      } finally {
        setDeletingSheetIds((prev) => {
          const next = { ...prev };
          delete next[trackerKey];
          return next;
        });
      }
    },
    [setPage, setSheets, setTotalItems, setMutationError, setDeletingSheetIds, t],
  );

  return (
    <div dir={'ltr'} className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 overflow-x-auto sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t('tables.surveySheets')}</h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            aria-label={t('tables.pagination.previous')}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-180"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <Label>{paginationLabel}</Label>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={isLoading || page >= totalPages}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            aria-label={t('tables.pagination.next')}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                {t('tables.headers.name')}
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                {t('tables.headers.owner')}
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                {t('tables.headers.date')}
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                {t('tables.headers.status')}
              </TableCell>
              {canManageSheets && (
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {t('tables.headers.actions')}
                </TableCell>
              )}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                {t('tables.headers.analyze')}
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sheets.map((sheet) => {
              const statusMeta = resolveStatusMeta(sheet.status as string | undefined, t);
              const normalizedStatus = (sheet.status ?? '').toString().toLowerCase();
              const isPending = normalizedStatus === 'pending';
              const isDeletable = DELETABLE_STATUSES.has(normalizedStatus);
              const isFinishable = FINISHABLE_STATUSES.has(normalizedStatus);
              const sheetIdentifier = resolveSheetIdentifier(sheet);
              const sheetIdKey =
                sheetIdentifier !== undefined && sheetIdentifier !== null
                  ? String(sheetIdentifier)
                  : undefined;
              const isDeleting = sheetIdKey ? deletingSheetIds[sheetIdKey] === true : false;
              const isFinishing = sheetIdKey ? finishingSheetIds[sheetIdKey] === true : false;
              const isBusy = isDeleting || isFinishing;
              const resolvedName = resolveName(sheet, t);

              return (
                <TableRow
                  key={sheet.id ?? resolvedName}
                  onClick={(event) => handleRowClick(event, sheetIdentifier)}
                  className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {resolvedName}
                        </p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                          {resolveSubtitle(sheet)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {resolveOwner(sheet)}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {resolveDate(sheet)}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Badge size="sm" color={statusMeta.color}>
                      {statusMeta.label}
                    </Badge>
                  </TableCell>
                  {canManageSheets && (
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              className="inline-flex"
                              aria-label={t('actions.approve')}
                            >
                              <Badge size="sm" color="success">
                                <CheckIcon />
                              </Badge>
                            </button>
                            <button
                              type="button"
                              className="inline-flex"
                              aria-label={t('actions.reject')}
                            >
                              <Badge size="sm" color="error">
                                <CloseIcon />
                              </Badge>
                            </button>
                          </>
                        ) : (
                          <>
                            {isFinishable && (
                              <button
                                type="button"
                                className="inline-flex disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={t('actions.finish')}
                                onClick={(event) => handleFinishSheet(event, sheet)}
                                disabled={isBusy}
                              >
                                <Badge size="sm" color="success">
                                  <FinishIcon />
                                </Badge>
                              </button>
                            )}
                            {isDeletable && (
                              <button
                                type="button"
                                className="inline-flex disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={t('actions.delete')}
                                onClick={(event) => handleDeleteSheet(event, sheet)}
                                disabled={isBusy}
                              >
                                <Badge size="sm" color="info">
                                  <TrashIcon />
                                </Badge>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <FullScreenModal sheetId={sheetIdentifier} sheetTitle={resolvedName} />
                  </TableCell>
                </TableRow>
              );
            })}

            {isLoading && sheets.length === 0 &&
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={`skeleton-row-${idx}`} className="border-none">
                  <TableCell colSpan={canManageSheets ? 6 : 5} className="py-4">
                    <SkeletonSheetRow canManageSheets={canManageSheets} />
                  </TableCell>
                </TableRow>
              ))}

            {showEmptyState && (
              <TableRow>
                <TableCell
                  colSpan={canManageSheets ? 6 : 5}
                  className="py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {t('tables.empty')}
                </TableCell>
              </TableRow>
            )}

            {mutationError && (
              <TableRow>
                <TableCell
                  colSpan={canManageSheets ? 6 : 5}
                  className="py-6 text-center text-sm text-error-500"
                >
                  {mutationError}
                </TableCell>
              </TableRow>
            )}

            {error && (
              <TableRow>
                <TableCell
                  colSpan={canManageSheets ? 6 : 5}
                  className="py-6 text-center text-sm text-error-500"
                >
                  {error}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}




























