import http from '@/services/httpsService';
import endpoints from '@/services/endpoints';

export type NotificationType = 'user_signup' | 'sheet_approval' | string;

export interface GetNotificationParams {
  page?: number;
  page_size?: number;
}

export interface NotificationRecord extends Record<string, unknown> {
  id: string;
  type?: NotificationType;
  created_at?: string;
  user_name?: string;
  user_organization?: string;
  sheet_title?: string;
}

export interface NotificationListResponse extends Record<string, unknown> {
  data?: NotificationRecord[];
  results?: NotificationRecord[];
  notifications?: NotificationRecord[];
  items?: NotificationRecord[];
}

export const getNotification = (params?: GetNotificationParams) => {
  return http.get<NotificationListResponse>(endpoints.notification.notification, {
    params,
  });
};

export const approveNotification = (id: string | number) => {
  return http.post(endpoints.notification.approve(id));
};

export const rejectNotification = (id: string | number) => {
  return http.post(endpoints.notification.reject(id));
};

export const extractNotifications = (
  payload: NotificationListResponse | NotificationRecord[] | undefined,
): NotificationRecord[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.notifications)) {
    return payload.notifications;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
};
