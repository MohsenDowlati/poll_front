'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../ui/table';
import Button from '../ui/button/Button';
import Badge from '../ui/badge/Badge';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import MultiSelect from '@/components/form/MultiSelect';
import VenueSelect, { defaultVenues as sheetVenueOptions } from '@/components/sheet/VenueSelect';
import { useLocale } from '@/hooks/useLocale';
import {
  deleteSheet,
  extractSheetList,
  extractSheetPaginationMeta,
  fetchSheets,
  finishSheet,
  type SheetPollRecord,
  type SheetQueryParams,
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
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 15;
const ADMIN_POLL_PAGE_SIZE = 200;
const OWNER_DISCOVERY_PAGE_SIZE = 200;
const OWNER_DISCOVERY_MAX_PAGES = 25;
const DELETABLE_STATUSES = new Set(['finished', 'rejected']);
const FINISHABLE_STATUSES = new Set(['published']);
const STATUS_FILTER_VALUES = [
  'pending',
  'approved',
  'published',
  'finished',
  'rejected',
  'active',
  'verified',
  'deleted',
  'inactive',
  'closed',
] as const;
type SheetActionType = 'finish' | 'delete';
interface PendingSheetAction {
  type: SheetActionType;
  sheet: SheetRecord;
}

interface SheetFiltersState {
  owners: string[];
  statuses: string[];
  venue: string;
  dateFrom: string;
  dateTo: string;
}

type FiltersUpdater =
  | Partial<SheetFiltersState>
  | ((prev: SheetFiltersState) => SheetFiltersState);

const FILTER_DEFAULTS: SheetFiltersState = {
  owners: [],
  statuses: [],
  venue: '',
  dateFrom: '',
  dateTo: '',
};

const areStringArraysEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
};

const areFilterStatesEqual = (left: SheetFiltersState, right: SheetFiltersState): boolean => {
  return (
    left.venue === right.venue &&
    left.dateFrom === right.dateFrom &&
    left.dateTo === right.dateTo &&
    areStringArraysEqual(left.owners, right.owners) &&
    areStringArraysEqual(left.statuses, right.statuses)
  );
};

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
  const [pendingSheetAction, setPendingSheetAction] = useState<PendingSheetAction | null>(null);
  const [isConfirmingSheetAction, setIsConfirmingSheetAction] = useState(false);
  const [filters, setFilters] = useState<SheetFiltersState>(() => ({ ...FILTER_DEFAULTS }));
  const [filterError, setFilterError] = useState<string | null>(null);
  const [ownerOptions, setOwnerOptions] = useState<Array<{ value: string; text: string }>>([]);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const { t, language } = useLocale();
  const locale = language === 'fa' ? 'fa-IR' : 'en-US';
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const collator = useMemo(() => new Intl.Collator(locale, { sensitivity: 'base' }), [locale]);
  const formatNumber = useCallback((value: number) => numberFormatter.format(value), [numberFormatter]);
  const statusFilterOptions = useMemo(
    () =>
      STATUS_FILTER_VALUES.map((statusKey) => ({
        value: statusKey,
        text: t(`status.${statusKey}`, { defaultValue: toTitleCase(statusKey) }),
      })),
    [t],
  );
  const hasActiveFilters = useMemo(
    () => !areFilterStatesEqual(filters, FILTER_DEFAULTS),
    [filters],
  );
  const normalizeMultiSelectValues = useCallback(
    (values: string[]) => {
      const sanitized = values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0);
      const unique = Array.from(new Set(sanitized));
      return unique.sort((left, right) => collator.compare(left, right));
    },
    [collator],
  );
  const updateFilters = useCallback(
    (updater: FiltersUpdater) => {
      setFilters((previousFilters) => {
        const nextFilters =
          typeof updater === 'function'
            ? (updater as (prev: SheetFiltersState) => SheetFiltersState)(previousFilters)
            : { ...previousFilters, ...updater };

        if (areFilterStatesEqual(previousFilters, nextFilters)) {
          return previousFilters;
        }

        setPage((currentPage) => (currentPage === DEFAULT_PAGE ? currentPage : DEFAULT_PAGE));

        return nextFilters;
      });
    },
    [],
  );

  const router = useRouter();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);


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

  const showEmptyState = !isLoading && sheets.length === 0 && !error && !filterError;

  const copySheetLink = useCallback((identifier: string | number | undefined | null) => {
    if (identifier === undefined || identifier === null) {
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
  }, []);
  const handleVenueChange = (value: string) => {
    updateFilters({ venue: value });
  };
  const handleStatusChange = (values: string[]) => {
    updateFilters({ statuses: normalizeMultiSelectValues(values) });
  };
  const handleOwnerChange = (values: string[]) => {
    updateFilters({ owners: normalizeMultiSelectValues(values) });
  };
  const handleDateChange =
    (key: 'dateFrom' | 'dateTo') => (event: React.ChangeEvent<HTMLInputElement>) => {
      updateFilters({ [key]: event.target.value });
    };
  const handleResetFilters = () => {
    updateFilters(() => ({ ...FILTER_DEFAULTS }));
  };
  const loadOwnerOptions = useCallback(async () => {
    if (!canManageSheets || !isMountedRef.current) {
      return;
    }

    setOwnerError(null);
    setIsLoadingOwners(true);

    try {
      const collectedOwners = new Set<string>();
      let currentPage = 1;
      let keepFetching = true;

      while (keepFetching && currentPage <= OWNER_DISCOVERY_MAX_PAGES) {
        const { status, data } = await fetchSheets({
          page: currentPage,
          page_size: OWNER_DISCOVERY_PAGE_SIZE,
        });

        if (status < 200 || status >= 300) {
          throw new Error(`Unexpected status ${status} while loading owners.`);
        }

        const fetchedSheets = extractSheetList(data);
        for (const sheet of fetchedSheets) {
          const ownerName = resolveOwner(sheet);
          if (ownerName && ownerName !== '-') {
            collectedOwners.add(ownerName);
          }
        }

        const meta = extractSheetPaginationMeta(data, OWNER_DISCOVERY_PAGE_SIZE);
        const totalPages = meta.totalPages && meta.totalPages > 0 ? meta.totalPages : undefined;

        if (totalPages !== undefined) {
          keepFetching = currentPage < totalPages;
        } else if (fetchedSheets.length < OWNER_DISCOVERY_PAGE_SIZE) {
          keepFetching = false;
        } else {
          currentPage += 1;
          continue;
        }

        if (keepFetching) {
          currentPage += 1;
        }
      }

      if (!isMountedRef.current) {
        return;
      }

      const sortedOwners = Array.from(collectedOwners).sort((left, right) =>
        collator.compare(left, right),
      );
      setOwnerOptions(sortedOwners.map((value) => ({ value, text: value })));
    } catch (ownersError) {
      console.error('Failed to load owners', ownersError);
      if (isMountedRef.current) {
        setOwnerOptions([]);
        setOwnerError(
          t('tables.filters.ownerError', {
            defaultValue: 'Unable to load owners. Please try again.',
          }),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingOwners(false);
      }
    }
  }, [canManageSheets, collator, t]);

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) {
      router.push("/")
    }
    const payload = decodeJwtPayload(token);
    setCanManageSheets(isSuperAdmin(payload));
  }, [router]);

  useEffect(() => {
    if (!canManageSheets) {
      setOwnerOptions([]);
      setOwnerError(null);
      setIsLoadingOwners(false);
      updateFilters((previous) => {
        if (previous.owners.length === 0) {
          return previous;
        }
        return { ...previous, owners: [] };
      });
      return;
    }

    void loadOwnerOptions();
  }, [canManageSheets, loadOwnerOptions, updateFilters]);

  useEffect(() => {
    setMutationError(null);
    let isMounted = true;

    const hasInvalidDateRange =
      filters.dateFrom &&
      filters.dateTo &&
      new Date(filters.dateFrom).getTime() > new Date(filters.dateTo).getTime();

    if (hasInvalidDateRange) {
      setFilterError(
        t('tables.filters.invalidDateRange', {
          defaultValue: 'The end date must be on or after the start date.',
        }),
      );
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setFilterError(null);

    const loadSheets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams: SheetQueryParams = {
          page,
          page_size: pageSize,
        };

        if (filters.dateFrom) {
          queryParams.date_from = filters.dateFrom;
        }

        if (filters.dateTo) {
          queryParams.date_to = filters.dateTo;
        }

        if (filters.venue.trim()) {
          queryParams.venue = filters.venue.trim();
        }

        if (filters.statuses.length > 0) {
          queryParams.status = filters.statuses;
        }

        if (canManageSheets && filters.owners.length > 0) {
          queryParams.owners = filters.owners;
        }

        const { status, data } = await fetchSheets(queryParams);

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
  }, [page, pageSize, filters, t, canManageSheets]);

  const finishSheetRecord = useCallback(
    async (sheet: SheetRecord) => {
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

  const deleteSheetRecord = useCallback(
    async (sheet: SheetRecord) => {
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

  const handleRequestFinish = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, sheet: SheetRecord) => {
      event.stopPropagation();
      setPendingSheetAction({ type: 'finish', sheet });
    },
    [setPendingSheetAction],
  );

  const handleRequestDelete = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, sheet: SheetRecord) => {
      event.stopPropagation();
      setPendingSheetAction({ type: 'delete', sheet });
    },
    [setPendingSheetAction],
  );

  const handleCancelSheetAction = useCallback(() => {
    if (isConfirmingSheetAction) {
      return;
    }
    setPendingSheetAction(null);
  }, [isConfirmingSheetAction, setPendingSheetAction]);

  const handleConfirmSheetAction = useCallback(async () => {
    if (!pendingSheetAction) {
      return;
    }

    setIsConfirmingSheetAction(true);
    try {
      if (pendingSheetAction.type === 'finish') {
        await finishSheetRecord(pendingSheetAction.sheet);
      } else {
        await deleteSheetRecord(pendingSheetAction.sheet);
      }
      setPendingSheetAction(null);
    } finally {
      setIsConfirmingSheetAction(false);
    }
  }, [pendingSheetAction, finishSheetRecord, deleteSheetRecord, setPendingSheetAction]);

  const sheetActionDialogProps = useMemo(() => {
    if (!pendingSheetAction) {
      return null;
    }

    const sheetName = resolveName(pendingSheetAction.sheet, t);

    if (pendingSheetAction.type === 'finish') {
      return {
        title: t('tables.confirm.finishTitle', {
          defaultValue: 'Finish this sheet?',
          name: sheetName,
        }),
        description: t('tables.confirm.finishDescription', {
          defaultValue: `This action will mark "${sheetName}" as finished.`,
          name: sheetName,
        }),
        confirmLabel: t('actions.finish', { defaultValue: 'Finish' }),
        tone: 'primary' as const,
      };
    }

    return {
      title: t('tables.confirm.deleteTitle', {
        defaultValue: 'Delete this sheet?',
        name: sheetName,
      }),
      description: t('tables.confirm.deleteDescription', {
        defaultValue:
          'Deleting a sheet also deletes all of its polls. This action cannot be undone.',
        name: sheetName,
      }),
      confirmLabel: t('actions.delete', { defaultValue: 'Delete' }),
      tone: 'danger' as const,
    };
  }, [pendingSheetAction, t]);

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
      <div className="mb-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="sheet-date-from">
              {t('tables.filters.dateFrom', { defaultValue: 'Date from' })}
            </Label>
            <Input
              id="sheet-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={handleDateChange('dateFrom')}
              max={filters.dateTo || undefined}
            />
          </div>
          <div>
            <Label htmlFor="sheet-date-to">
              {t('tables.filters.dateTo', { defaultValue: 'Date to' })}
            </Label>
            <Input
              id="sheet-date-to"
              type="date"
              value={filters.dateTo}
              onChange={handleDateChange('dateTo')}
              min={filters.dateFrom || undefined}
            />
          </div>
          <div>
            <Label>
              {t('tables.filters.venue', { defaultValue: 'Venue' })}
            </Label>
            <VenueSelect
              value={filters.venue}
              onChange={handleVenueChange}
              options={sheetVenueOptions}
              placeholder={t('tables.filters.venuePlaceholder', { defaultValue: 'All venues' })}
              allowEmptySelection
            />
          </div>
          <div>
            <MultiSelect
              label={t('tables.filters.status', { defaultValue: 'Status' })}
              options={statusFilterOptions}
              value={filters.statuses}
              onChange={handleStatusChange}
              placeholder={t('tables.filters.statusPlaceholder', { defaultValue: 'All statuses' })}
            />
          </div>
        </div>
        {filterError ? (
          <p className="text-xs text-error-500">{filterError}</p>
        ) : null}
        {canManageSheets ? (
          <div>
            <MultiSelect
              label={t('tables.filters.owners', { defaultValue: 'Owner' })}
              options={ownerOptions}
              value={filters.owners}
              onChange={handleOwnerChange}
              placeholder={t('tables.filters.ownerPlaceholder', { defaultValue: 'All owners' })}
              disabled={isLoadingOwners || ownerOptions.length === 0}
            />
            {isLoadingOwners ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('tables.filters.loadingOwners', { defaultValue: 'Loading owners...' })}
              </p>
            ) : null}
            {ownerError ? (
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="text-xs text-error-500">{ownerError}</span>
                <button
                  type="button"
                  onClick={() => {
                    void loadOwnerOptions();
                  }}
                  className="text-xs font-medium text-brand-500 transition hover:text-brand-600"
                >
                  {t('tables.filters.ownerRetry', { defaultValue: 'Retry' })}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
          >
            {t('tables.filters.reset', { defaultValue: 'Clear filters' })}
          </Button>
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
              <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                {t('tables.headers.link')}
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
              const isPublished = normalizedStatus === 'published';
              const sheetIdentifier = resolveSheetIdentifier(sheet);
              const sheetIdKey =
                sheetIdentifier !== undefined && sheetIdentifier !== null
                  ? String(sheetIdentifier)
                  : undefined;
              const isDeleting = sheetIdKey ? deletingSheetIds[sheetIdKey] : false;
              const isFinishing = sheetIdKey ? finishingSheetIds[sheetIdKey] : false;
              const isBusy = isDeleting || isFinishing;
              const resolvedName = resolveName(sheet, t);

              return (
                <TableRow
                  key={sheet.id ?? resolvedName}
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
                                onClick={(event) => handleRequestFinish(event, sheet)}
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
                                onClick={(event) => handleRequestDelete(event, sheet)}
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
                    <div className="flex items-center gap-2">
                      <FullScreenModal sheetId={sheetIdentifier} sheetTitle={resolvedName} />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">

                          <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              disabled={
                                  sheetIdentifier === undefined ||
                                  sheetIdentifier === null ||
                                  isBusy || !isPublished
                              }
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                copySheetLink(sheetIdentifier);
                              }}
                          >
                            <CopyIcon/>
                          </Button>

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
      {pendingSheetAction && sheetActionDialogProps ? (
        <ConfirmDialog
          isOpen
          title={sheetActionDialogProps.title}
          description={sheetActionDialogProps.description}
          confirmLabel={sheetActionDialogProps.confirmLabel}
          cancelLabel={t('actions.cancel', { defaultValue: 'Cancel' })}
          tone={sheetActionDialogProps.tone}
          isProcessing={isConfirmingSheetAction}
          onConfirm={handleConfirmSheetAction}
          onCancel={handleCancelSheetAction}
        />
      ) : null}
    </div>
  );
}

const CopyIcon = () => (
  <svg width="30px" height="30px" viewBox="0 0 1024 1024" className="icon" version="1.1"
       xmlns="http://www.w3.org/2000/svg">
    <path d="M589.3 260.9v30H371.4v-30H268.9v513h117.2v-304l109.7-99.1h202.1V260.9z" fill="#E1F0FF"/>
    <path d="M516.1 371.1l-122.9 99.8v346.8h370.4V371.1z" fill="#E1F0FF"/>
    <path d="M752.7 370.8h21.8v435.8h-21.8z" fill="#446EB1"/>
    <path d="M495.8 370.8h277.3v21.8H495.8z" fill="#446EB1"/>
    <path d="M495.8 370.8h21.8v124.3h-21.8z" fill="#446EB1"/>
    <path d="M397.7 488.7l-15.4-15.4 113.5-102.5 15.4 15.4z" fill="#446EB1"/>
    <path d="M382.3 473.3h135.3v21.8H382.3z" fill="#446EB1"/>
    <path d="M382.3 479.7h21.8v348.6h-21.8zM404.1 806.6h370.4v21.8H404.1z" fill="#446EB1"/>
    <path d="M447.7 545.1h261.5v21.8H447.7zM447.7 610.5h261.5v21.8H447.7zM447.7 675.8h261.5v21.8H447.7z"
          fill="#6D9EE8"/>
    <path d="M251.6 763h130.7v21.8H251.6z" fill="#446EB1"/>
    <path d="M251.6 240.1h21.8v544.7h-21.8zM687.3 240.1h21.8v130.7h-21.8zM273.4 240.1h108.9v21.8H273.4z"
          fill="#446EB1"/>
    <path
        d="M578.4 240.1h130.7v21.8H578.4zM360.5 196.5h21.8v108.9h-21.8zM382.3 283.7h196.1v21.8H382.3zM534.8 196.5h65.4v21.8h-65.4z"
        fill="#446EB1"/>
    <path d="M360.5 196.5h65.4v21.8h-65.4zM404.1 174.7h152.5v21.8H404.1zM578.4 196.5h21.8v108.9h-21.8z" fill="#446EB1"/>
  </svg>
)




























