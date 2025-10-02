"use client";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import {
  getNotification,
  extractNotifications, approveNotification, rejectNotification,
} from "@/services/notification/notification";
import type {
  GetNotificationParams,
  NotificationRecord,
} from "@/services/notification/notification";

type NotificationCardProps = {
  notification: NotificationRecord;
};

const DEFAULT_NOTIFICATION_PARAMS: GetNotificationParams = {
  page: 1,
  page_size: 10,
};

const DEFAULT_PAGE = DEFAULT_NOTIFICATION_PARAMS.page ?? 1;
const DEFAULT_PAGE_SIZE = DEFAULT_NOTIFICATION_PARAMS.page_size ?? 10;

//TODO: alert

const formatRelativeTime = (input?: string): string => {
  if (!input) {
    return "just now";
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }

  const diffMs = Date.now() - parsed.getTime();
  const isFuture = diffMs < 0;
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);

  if (diffSeconds < 60) {
    return isFuture ? "in less than a minute" : "just now";
  }

  const units = [
    { label: "year", seconds: 60 * 60 * 24 * 365 },
    { label: "month", seconds: 60 * 60 * 24 * 30 },
    { label: "week", seconds: 60 * 60 * 24 * 7 },
    { label: "day", seconds: 60 * 60 * 24 },
    { label: "hour", seconds: 60 * 60 },
    { label: "minute", seconds: 60 },
  ];

  for (const { label, seconds } of units) {
    if (diffSeconds >= seconds) {
      const value = Math.floor(diffSeconds / seconds);
      const suffix = value === 1 ? label : `${label}s`;
      return isFuture ? `in ${value} ${suffix}` : `${value} ${suffix} ago`;
    }
  }

  return isFuture ? "in less than a minute" : "just now";
};

function NotificationCard({ notification }: NotificationCardProps) {
  const {
    id,
    user_name: name,
    type,
    created_at,
    user_organization,
    sheet_title,
  } = notification;

  async function approve_notification(id:string) {
    try {
      const {status, data} = await approveNotification(id);
      if (status>=200 && status<300) {
        console.log("ok")
      } else {
        console.log("error")
      }

    } catch (e) {
      console.error(e);
    }
  }

  async function reject_notification(id:string) {
    try {
      const {status, data} = await rejectNotification(id);
      if (status>=200 && status<300) {
        console.log("ok")
      } else {
        console.log("error")
      }
    } catch (e) {
      console.error(e);
    }
  }

  const approveNote = () => {
    void approve_notification(id)
  }

  const rejectNote = () => {
    void reject_notification(id)
  }



  const displayName = name ?? "Unknown user";
  const notificationType =
    typeof type === "string" ? type : "notification_event";
  const actionText =
    notificationType === "user_signup"
      ? "requests permission to have access"
      : notificationType === "sheet_approval"
      ? "request permission to publish the sheet"
      : "sent a notification";
  const scopeLabel =
    notificationType === "user_signup"
      ? "Access"
      : notificationType === "sheet_approval"
      ? "Sheet"
      : "Notification";
  const organizationAndSheet = [user_organization, sheet_title]
    .filter(Boolean)
    .join(" ");

  return (
    <DropdownItem className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5">
      <span className="block">
        <span className="mb-1.5 block space-x-1 text-theme-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {displayName}
          </span>
          <span>{actionText}</span>
          {organizationAndSheet && (
            <span className="font-medium text-gray-800 dark:text-white/90">
              {organizationAndSheet}
            </span>
          )}
        </span>
        <span className="flex w-full flex-row items-center justify-between">
          <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
          <span>{scopeLabel}</span>
          <span className="h-1 w-1 rounded-full bg-gray-400"></span>
          <span>{formatRelativeTime(created_at)}</span>
        </span>
          <span className="flex flex-row gap-2">
               <svg
                   width="17"
                   height="16"
                   viewBox="0 0 17 16"
                   fill="none"
                   xmlns="http://www.w3.org/2000/svg"
                   onClick={rejectNote}
               >
              <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.05394 4.78033C3.76105 4.48744 3.76105 4.01256 4.05394 3.71967C4.34684 3.42678 4.82171 3.42678 5.1146 3.71967L8.33437 6.93944L11.5521 3.72173C11.845 3.42883 12.3199 3.42883 12.6127 3.72173C12.9056 4.01462 12.9056 4.48949 12.6127 4.78239L9.39503 8.0001L12.6127 11.2178C12.9056 11.5107 12.9056 11.9856 12.6127 12.2785C12.3198 12.5713 11.845 12.5713 11.5521 12.2785L8.33437 9.06076L5.11462 12.2805C4.82173 12.5734 4.34685 12.5734 4.05396 12.2805C3.76107 11.9876 3.76107 11.5127 4.05396 11.2199L7.27371 8.0001L4.05394 4.78033Z"
                  fill="red"
              />
            </svg>
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                onClick={approveNote}
            >
            <path
                d="M13.4017 4.35986L6.12166 11.6399L2.59833 8.11657"
                stroke="green"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
          </svg>
          </span>
        </span>

      </span>
    </DropdownItem>
  );
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [isLastPage, setIsLastPage] = useState(false);
  const pageSize = DEFAULT_PAGE_SIZE;

  const loadNotifications = useCallback(
    async (overrideParams?: GetNotificationParams) => {
      const mergedParams: GetNotificationParams = {
        page: overrideParams?.page ?? DEFAULT_PAGE,
        page_size: overrideParams?.page_size ?? pageSize,
      };

      try {
        const { status, data } = await getNotification(mergedParams);
        if (status >= 200 && status < 300) {
          let resolvedItems = extractNotifications(data);
          let resolvedPage = mergedParams.page ?? DEFAULT_PAGE;
          let reachedEnd =
            resolvedItems.length < (mergedParams.page_size ?? pageSize);

          if (resolvedPage !== DEFAULT_PAGE && resolvedItems.length === 0) {
            const fallbackParams: GetNotificationParams = {
              page: DEFAULT_PAGE,
              page_size: mergedParams.page_size,
            };
            const { status: fallbackStatus, data: fallbackData } =
              await getNotification(fallbackParams);

            if (fallbackStatus >= 200 && fallbackStatus < 300) {
              resolvedItems = extractNotifications(fallbackData);
              resolvedPage = DEFAULT_PAGE;
              reachedEnd = true;
            } else {
              console.warn("Unable to retrieve notifications.", fallbackStatus);
              return;
            }
          }

          setNotifications(resolvedItems);
          setNotifying(resolvedItems.length > 0);
          setCurrentPage(resolvedPage);
          setIsLastPage(reachedEnd);
        } else {
          console.warn("Unable to retrieve notifications.", status);
        }
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  const handleLoadMore = () => {
    const nextPage = isLastPage ? DEFAULT_PAGE : currentPage + 1;
    void loadNotifications({ page: nextPage, page_size: pageSize });
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notification
          </h5>
          <button
            onClick={toggleDropdown}
            className="dropdown-toggle text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
          {notifications.length === 0 ? (
            <li className="px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
              No notifications yet.
            </li>
          ) : (
            notifications.map((notification, index) => {
              const key =
                notification.id ??
                `${notification.type ?? "notification"}-${
                  notification.created_at ?? index
                }-${index}`;
              return (
                <li key={key}>
                  <NotificationCard notification={notification} />
                </li>
              );
            })
          )}
        </ul>
        <button
          type="button"
          onClick={handleLoadMore}
          className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          More Notifications
        </button>
      </Dropdown>
    </div>
  );
}
