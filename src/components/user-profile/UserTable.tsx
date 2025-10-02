"use client";

import React, { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/tables/Pagination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import {
  listAdminUsers,
  extractAdminUsers,
  extractAdminPaginationMeta,
  type AdminUserRecord,
} from "@/services/admin";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const ADMIN_TYPE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  verified_admin: "Verified Admin",
  new_user: "New User",
  canceled_user: "Canceled User",
};

const formatAdminType = (typeValue: AdminUserRecord["admin"]): string => {
  if (!typeValue) {
    return "-";
  }

  const raw = String(typeValue);
  const normalized = raw.toLowerCase();
  return ADMIN_TYPE_LABELS[normalized] ?? raw.replace(/_/g, " " ).replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolveStatusMeta = (isVerified?: boolean) => {
  if (isVerified) {
    return { label: "Verified", color: "success" as const };
  }
  return { label: "Not Verified", color: "warning" as const };
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

const resolveName = (record: AdminUserRecord): string => {
  if (record.name && record.name.trim()) {
    return record.name.trim();
  }
  return String(record.id ?? "Unknown");
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

export default function UserTable() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { status, data } = await listAdminUsers({
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
          setError(`Unable to retrieve users (status ${status}).`);
        }
      } catch (fetchError) {
        console.error("Failed to load users", fetchError);
        if (!isMounted) {
          return;
        }
        setUsers([]);
        setError("Failed to load users. Please try again.");
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
  }, [page, pageSize]);

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

  const handleDeleteUser = (user: AdminUserRecord) => {
    console.log("delete user", user.id);
  };

  const handleVerifyUser = (user: AdminUserRecord) => {
    console.log("verify user", user.id);
  };

  const handleRejectUser = (user: AdminUserRecord) => {
    console.log("reject user", user.id);
  };

  const showEmptyState = !isLoading && !error && users.length === 0;
  const tableRows = useMemo(() => users, [users]);

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                >
                  Phone
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                >
                  Organization
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                >
                  Admin Type
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left font-medium text-theme-xs text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {tableRows.map((user, index) => {
                const key = String(user.id ?? index);
                const isVerified = resolveIsVerified(user);
                const statusMeta = resolveStatusMeta(isVerified);

                return (
                  <TableRow key={key}>
                    <TableCell className="px-5 py-4 text-left text-theme-sm text-gray-800 dark:text-white/90">
                      {resolveName(user)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-left text-theme-sm text-gray-600 dark:text-gray-300">
                      {resolvePhone(user)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-left text-theme-sm text-gray-600 dark:text-gray-300">
                      {resolveOrganization(user)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-left text-theme-sm text-gray-600 dark:text-gray-300">
                      {formatAdminType(user.admin)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-left text-theme-sm text-gray-600 dark:text-gray-300">
                      <Badge size="sm" color={statusMeta.color}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {(isVerified && user.admin !== "user_admin") ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="inline-flex items-center"
                            aria-label="Remove admin"
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
                              className="inline-flex items-center"
                              aria-label="Verify admin"
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
                              className="inline-flex items-center"
                              aria-label="Reject admin"
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
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {isLoading && tableRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading users...
                  </TableCell>
                </TableRow>
              )}

              {showEmptyState && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No users found.
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
        <Pagination currentPage={page} totalPages={Math.max(totalPages, 1)} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}
