'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../ui/table';
import Badge from '../ui/badge/Badge';
import Label from '@/components/form/Label';
import {
  fetchSheets,
  extractSheetList,
  extractSheetPaginationMeta,
  type SheetRecord,
} from '@/services/sheet/sheet';
import { getAuthTokenFromCookie } from '@/utils/authToken';
import { decodeJwtPayload, type JwtPayload } from '@/utils/jwt';
import {useRouter} from "next/navigation";
import Button from "@/components/ui/button/Button";
import FullScreenModal from "@/components/example/ModalExample/FullScreenModal";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 15;

const toTitleCase = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const resolveName = (sheet: SheetRecord): string => {
  const { name, title, id } = sheet;
  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }
  if (typeof title === 'string' && title.trim()) {
    return title.trim();
  }
  return String(id ?? 'Unknown');
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

const resolveStatusMeta = (statusValue?: string) => {
  if (!statusValue) {
    return { label: '-', color: 'light' as const };
  }

  const normalized = statusValue.toLowerCase();

  if (normalized === 'pending') {
    return { label: toTitleCase(normalized), color: 'warning' as const };
  }

  if (['approved', 'published', 'active', 'verified'].includes(normalized)) {
    return { label: toTitleCase(normalized), color: 'success' as const };
  }

  if (['rejected', 'deleted', 'inactive', 'closed'].includes(normalized)) {
    return { label: toTitleCase(normalized), color: 'error' as const };
  }

  return { label: toTitleCase(statusValue), color: 'info' as const };
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

const extractRoleString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim().toLowerCase();
  }
  return undefined;
};

const isSuperAdmin = (payload: JwtPayload | null): boolean => {
  if (!payload) {
    return false;
  }

  if (payload.admin === 'super_admin') {
    return true;
  }


  const userField = (payload as Record<string, unknown>).user;
  if (userField && typeof userField === 'object') {
    return isSuperAdmin(userField as JwtPayload);
  }

  return false;
};

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
  const [canManageSheets, setCanManageSheets] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) {
      router.push("/")
    }
    const payload = decodeJwtPayload(token);
    setCanManageSheets(isSuperAdmin(payload));
  }, []);

  useEffect(() => {
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
          setError('Failed to load sheets.');
        }
      } catch (fetchError) {
        console.error('Failed to fetch sheets', fetchError);
        if (!isMounted) {
          return;
        }
        setSheets([]);
        setError('Unable to fetch sheets right now.');
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
  }, [page, pageSize]);

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
      return `${effectiveStart}-${cappedEnd} out of ${totalItems}`;
    }

    if (sheets.length === 0) {
      return '0-0';
    }

    return `${startIndex}-${endIndex}`;
  }, [page, pageSize, sheets.length, totalItems]);

  const showEmptyState = !isLoading && sheets.length === 0 && !error;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 overflow-x-auto sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Survey Sheets</h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            aria-label="Previous page"
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
            aria-label="Next page"
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
                Name
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Owner
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              {canManageSheets && (
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              )}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Analyze
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sheets.map((sheet) => {
              const statusMeta = resolveStatusMeta(sheet.status as string | undefined);
              const normalizedStatus = (sheet.status ?? '').toString().toLowerCase();
              const isPending = normalizedStatus === 'pending';
              const sheetIdentifier = resolveSheetIdentifier(sheet);

              return (
                <TableRow key={sheet.id ?? resolveName(sheet)}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {resolveName(sheet)}
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
                              aria-label="Approve sheet"
                            >
                              <Badge size="sm" color="success">
                                <CheckIcon />
                              </Badge>
                            </button>
                            <button
                              type="button"
                              className="inline-flex"
                              aria-label="Reject sheet"
                            >
                              <Badge size="sm" color="error">
                                <CloseIcon />
                              </Badge>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex"
                            aria-label="Delete sheet"
                          >
                            <Badge size="sm" color="info">
                              <TrashIcon />
                            </Badge>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <FullScreenModal sheetId={sheetIdentifier} sheetTitle={resolveName(sheet)} />
                  </TableCell>
                </TableRow>
              );
            })}

            {isLoading && sheets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManageSheets ? 6 : 5}
                  className="py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Loading sheets...
                </TableCell>
              </TableRow>
            )}

            {showEmptyState && (
              <TableRow>
                <TableCell
                  colSpan={canManageSheets ? 6 : 5}
                  className="py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No sheets found.
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
