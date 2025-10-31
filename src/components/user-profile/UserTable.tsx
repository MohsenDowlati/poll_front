"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import Pagination from "@/components/tables/Pagination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import {
  listAdminUsers,
  extractAdminUsers,
  extractAdminPaginationMeta,
  type AdminUserRecord,
  updateAdminStatus,
} from "@/services/admin";
import { useLocale } from "@/hooks/useLocale";
import { getAuthTokenFromCookie } from "@/utils/authToken";
import { decodeJwtPayload } from "@/utils/jwt";
import { isSuperAdmin } from "@/utils/roles";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const ADMIN_TYPE_KEYS: Record<string, string> = {
  super_admin: "userTable.roles.superAdmin",
  verified_admin: "userTable.roles.verifiedAdmin",
  new_user: "userTable.roles.newUser",
  canceled_user: "userTable.roles.canceledUser",
};

const formatAdminType = (
  typeValue: AdminUserRecord["admin"],
  translate: TFunction<"translation">,
): string => {
  if (!typeValue) {
    return "-";
  }

  const raw = String(typeValue);
  const normalized = raw.toLowerCase();
  const translationKey = ADMIN_TYPE_KEYS[normalized];
  if (translationKey) {
    return translate(translationKey);
  }
  return raw.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolveStatusMeta = (isVerified: boolean, translate: TFunction<"translation">) => {
  if (isVerified) {
    return { label: translate("userTable.status.verified"), color: "success" as const };
  }
  return { label: translate("userTable.status.notVerified"), color: "warning" as const };
};

const resolveIsVerified = (record: AdminUserRecord): boolean => {
  if (typeof record.is_verified === "boolean") {
    return record.is_verified;
  }
  if (typeof (record as Record<string, unknown>).isVerified === "boolean") {
    return Boolean((record as Record<string, unknown>).isVerified);
  }
  return false;
};

const resolveName = (record: AdminUserRecord, translate: TFunction<"translation">): string => {
  if (record.name && record.name.trim()) {
    return record.name.trim();
  }
  return String(record.id ?? translate("common.unknown"));
};

const resolveOrganization = (record: AdminUserRecord): string => {
  if (record.organization && record.organization.trim()) {
    return record.organization.trim();
  }
  return "-";
};

const resolvePhone = (record: AdminUserRecord): string => {
  if (record.phone && record.phone.trim()) {
    return record.phone.trim();
  }
  return "-";
};

const resolveUserIdentifier = (record: AdminUserRecord): string | null => {
  const extendedRecord = record as Record<string, unknown>;
  const candidates = [
    record.id,
    extendedRecord["user_id"],
    extendedRecord["userId"],
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      const normalized = String(candidate).trim();
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
};

const StarIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.049 2.927c.3-.921 1.602-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.89a1 1 0 00-1.176 0l-3.976 2.89c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.976-2.89c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.518-4.674z" />
  </svg>
);

const SkeletonBar = ({
  width,
  height = 12,
  className,
}: {
  width: number | string;
  height?: number;
  className?: string;
}) => (
  <div
    className={`bg-gradient-to-r from-gray-200/80 via-gray-100/60 to-gray-200/80 dark:from-white/[0.2] dark:via-white/[0.1] dark:to-white/[0.18] ${className ?? ""}`}
    style={{ width, height }}
  />
);

const SkeletonUserRow = () => (
  <div className="w-full animate-pulse rounded-xl border border-gray-100/60 bg-gradient-to-br from-gray-100/60 via-white to-gray-100/30 p-4 shadow-theme-xs dark:border-white/[0.08] dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.08]">
    <div className="grid grid-cols-12 items-center gap-4">
      <div className="col-span-3 flex flex-col gap-2">
        <SkeletonBar width="55%" height={14} className="rounded-full" />
        <SkeletonBar width="30%" height={10} className="rounded-full opacity-80" />
      </div>
      <div className="col-span-3 flex flex-col gap-2">
        <SkeletonBar width="75%" height={12} className="rounded-full" />
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <SkeletonBar width="70%" height={12} className="rounded-full" />
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <SkeletonBar width="65%" height={12} className="rounded-full" />
      </div>
      <div className="col-span-1 flex justify-center">
        <SkeletonBar width={72} height={24} className="rounded-full" />
      </div>
      <div className="col-span-1 flex items-center justify-end gap-2">
        <SkeletonBar width={32} height={32} className="rounded-full" />
        <SkeletonBar width={32} height={32} className="rounded-full" />
      </div>
    </div>
  </div>
);

export default function UserTable() {
  const {t} = useLocale();
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutatingUserIds, setMutatingUserIds] = useState<Record<string, boolean>>({});
  const [canManageUsers, setCanManageUsers] = useState(false);

  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      setMutationError(null);

      try {
        const {status, data} = await listAdminUsers({
          page,
          page_size: pageSize,
        });

        if (!isMounted) {
          return;
        }

        if (status >= 200 && status < 300) {
          const fetchedUsers = extractAdminUsers(data);
          setUsers(fetchedUsers);

          const meta = extractAdminPaginationMeta(data, pageSize);
          const effectivePageSize = meta.pageSize && meta.pageSize > 0 ? meta.pageSize : pageSize;
          const effectivePage = meta.currentPage && meta.currentPage > 0 ? meta.currentPage : page;

          let resolvedTotalPages = meta.totalPages;
          if (
              (resolvedTotalPages === undefined || resolvedTotalPages <= 0) &&
              meta.totalItems !== undefined &&
              effectivePageSize > 0
          ) {
            resolvedTotalPages = Math.ceil(meta.totalItems / effectivePageSize);
          }

          if (resolvedTotalPages === undefined) {
            const isLastPage = fetchedUsers.length < effectivePageSize;
            resolvedTotalPages = isLastPage
                ? Math.max(effectivePage, 1)
                : Math.max(effectivePage + 1, 1);
          }

          setTotalPages(Math.max(resolvedTotalPages, 1));

          if (effectivePage !== page) {
            setPage(effectivePage);
          }
        } else {
          setUsers([]);
          setError(t("userTable.error.status", {status}));
        }
      } catch (fetchError) {
        console.error("Failed to load users", fetchError);
        if (!isMounted) {
          return;
        }
        setUsers([]);
        setError(t("userTable.error.fetch"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, t]);

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setCanManageUsers(false);
      return;
    }
    const payload = decodeJwtPayload(token);
    setCanManageUsers(isSuperAdmin(payload));
  }, []);

  const handlePageChange = (nextPage: number) => {
    setPage((current) => {
      if (!Number.isFinite(nextPage)) {
        return current;
      }

      const normalized = Math.max(1, Math.floor(nextPage));
      const clamped = Math.min(normalized, Math.max(totalPages, 1));
      return clamped === current ? current : clamped;
    });
  };

  const mutateUserStatus = useCallback(
      async (user: AdminUserRecord, nextStatus: boolean) => {
        if (!canManageUsers) {
          return;
        }

        const identifier = resolveUserIdentifier(user);
        if (!identifier) {
          setMutationError(
              t("tables.error.updateAdminStatus.missingIdentifier", {
                defaultValue: "Unable to determine the selected admin account.",
              }),
          );
          return;
        }

        setMutationError(null);
        setMutatingUserIds((prev) => ({
          ...prev,
          [identifier]: true,
        }));

        try {
          await updateAdminStatus({
            user_id: identifier,
            is_verified: nextStatus,
          });

          setUsers((prev) =>
              prev.map((candidate) => {
                if (resolveUserIdentifier(candidate) === identifier) {
                  return {
                    ...candidate,
                    is_verified: nextStatus,
                    isVerified: nextStatus,
                  };
                }
                return candidate;
              }),
          );
        } catch (statusError) {
          console.error("Failed to update admin status", statusError);
          setMutationError(
              t("tables.error.updateAdminStatus.failed", {
                defaultValue: "Failed to update admin status. Please try again.",
              }),
          );
        } finally {
          setMutatingUserIds((prev) => {
            const next = {...prev};
            delete next[identifier];
            return next;
          });
        }
      },
      [canManageUsers, setUsers, setMutationError, setMutatingUserIds, t],
  );

  const handleDeleteUser = (user: AdminUserRecord) => {
    void mutateUserStatus(user, false);
  };

  const handleVerifyUser = (user: AdminUserRecord) => {
    void mutateUserStatus(user, true);
  };

  const handleRejectUser = (user: AdminUserRecord) => {
    void mutateUserStatus(user, false);
  };

  const showEmptyState = !isLoading && !error && users.length === 0;
  const tableRows = useMemo(() => users, [users]);


  return (
      <div dir="ltr" className="w-full">
        <div
            className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                      isHeader
                      className="px-5 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('tables.headers.name')}
                  </TableCell>
                  <TableCell
                      isHeader
                      className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('tables.headers.phone')}
                  </TableCell>
                  <TableCell
                      isHeader
                      className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('tables.headers.organization')}
                  </TableCell>
                  <TableCell
                      isHeader
                      className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('tables.headers.admin')}
                  </TableCell>
                  <TableCell
                      isHeader
                      className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('tables.headers.status')}
                  </TableCell>
                  <TableCell
                      isHeader
                      className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('tables.headers.actions')}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {tableRows.map((user, index) => {
                  const key = String(user.id ?? index);
                  const isVerified = resolveIsVerified(user);
                  const statusMeta = resolveStatusMeta(isVerified, t);
                  const identifier = resolveUserIdentifier(user);
                  const isMutating = identifier ? Boolean(mutatingUserIds[identifier]) : false;
                  const canMutate = canManageUsers && Boolean(identifier);
                  const resolvedName = resolveName(user, t);
                  const resolvedPhone = resolvePhone(user);
                  const resolvedOrganization = resolveOrganization(user);
                  const adminRole =
                      typeof user.admin === "string" ? user.admin.toLowerCase() : "";
                  const isSuperAdminUser = adminRole === "super_admin";
                  const adminTypeLabel = formatAdminType(user.admin, t);
                  const canRenderMutationActions = canMutate && !isSuperAdminUser;
                  const superAdminLabel = t("userTable.roles.superAdmin");

                  return (
                      <TableRow key={key}>
                        <TableCell className="px-5 py-4 text-left text-theme-sm text-gray-800 dark:text-white/90">
                          {resolvedName}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-left text-theme-sm text-gray-600 dark:text-gray-300">
                          {resolvedPhone}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-left text-theme-sm text-gray-600 dark:text-gray-300">
                          {resolvedOrganization}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-left text-theme-sm text-gray-600 dark:text-gray-300">
                          {adminTypeLabel}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-left text-theme-sm text-gray-600 dark:text-gray-300">
                          <Badge size="sm" color={statusMeta.color}>
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {isSuperAdminUser && (
                                <span
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
                                    role="img"
                                    aria-label={superAdminLabel}
                                    title={superAdminLabel}
                                >
                              <StarIcon className="h-3.5 w-3.5"/>
                            </span>
                            )}

                            {canRenderMutationActions ? (
                                adminRole !== "user_admin" && isVerified ? (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteUser(user)}
                                        className="inline-flex items-center disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label={t("userTable.actions.remove")}
                                        disabled={isMutating}
                                    >
                                      <Badge size="sm" color="info">
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
                                      </Badge>
                                    </button>
                                ) : (
                                    <>
                                      <button
                                          type="button"
                                          onClick={() => handleVerifyUser(user)}
                                          className="inline-flex items-center disabled:cursor-not-allowed disabled:opacity-50"
                                          aria-label={t("userTable.actions.verify")}
                                          disabled={isMutating}
                                      >
                                        <Badge size="sm" color="success">
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
                                        </Badge>
                                      </button>
                                      <button
                                          type="button"
                                          onClick={() => handleRejectUser(user)}
                                          className="inline-flex items-center disabled:cursor-not-allowed disabled:opacity-50"
                                          aria-label={t("userTable.actions.reject")}
                                          disabled={isMutating}
                                      >
                                        <Badge size="sm" color="error">
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
                                        </Badge>
                                      </button>
                                    </>
                                )
                            ) : !isSuperAdminUser ? (
                                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                  );
                })}

                {isLoading && tableRows.length === 0 &&
                    Array.from({ length: 4 }).map((_, idx) => (
                        <TableRow key={`skeleton-row-${idx}`} className="border-none">
                          <TableCell colSpan={6} className="px-5 py-3">
                            <SkeletonUserRow />
                          </TableCell>
                        </TableRow>
                    ))}

                {showEmptyState && (
                    <TableRow>
                      <TableCell
                          colSpan={6}
                          className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        {t("userTable.empty")}
                      </TableCell>
                    </TableRow>
                )}

                {mutationError && (
                    <TableRow>
                      <TableCell
                          colSpan={6}
                          className="px-5 py-6 text-center text-sm text-error-500"
                      >
                        {mutationError}
                      </TableCell>
                    </TableRow>
                )}

                {error && (
                    <TableRow>
                      <TableCell
                          colSpan={6}
                          className="px-5 py-6 text-center text-sm text-error-500"
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-4 flex w-full items-center justify-center lg:justify-start">
          <Pagination currentPage={page} totalPages={Math.max(totalPages, 1)} onPageChange={handlePageChange}/>
        </div>
      </div>
  );
}
