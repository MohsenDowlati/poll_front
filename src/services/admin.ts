import http from '@/services/httpsService';
import endpoints from '@/services/endpoints';

export type AdminUserType =
  | 'super_admin'
  | 'verified_admin'
  | 'new_user'
  | 'canceled_user'
  | string;

export interface AdminUsersQueryParams extends Record<string, unknown> {
  page?: number;
  page_size?: number;
}

export interface AdminUserRecord extends Record<string, unknown> {
  id?: string | number;
  admin?: AdminUserType;
  name?: string;
  organization?: string;
  phone?: string;
  is_verified?: boolean;
  isVerified?: boolean;
}

export interface AdminPaginationPayload extends Record<string, unknown> {
  page?: number;
  page_size?: number;
  total_items?: number;
  total_pages?: number;
}

export interface AdminUserListResponse extends Record<string, unknown> {
  data?: AdminUserRecord[];
  pagination?: AdminPaginationPayload;
}

export interface AdminPaginationMeta {
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

export const listAdminUsers = (params?: AdminUsersQueryParams) => {
  return http.get<AdminUserListResponse>(endpoints.admin.users, {
    params,
  });
};

export const extractAdminUsers = (
  payload: AdminUserListResponse | AdminUserRecord[] | undefined,
): AdminUserRecord[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
};

export const extractAdminPaginationMeta = (
  payload: AdminUserListResponse | undefined,
  fallbackPageSize?: number,
): AdminPaginationMeta => {
  if (!payload || Array.isArray(payload)) {
    return {
      pageSize: fallbackPageSize,
    };
  }

  const pagination = payload.pagination;
  if (!pagination || typeof pagination !== 'object') {
    return {
      pageSize: fallbackPageSize,
    };
  }

  const pageSize = toFiniteNumber(pagination.page_size) ?? fallbackPageSize;
  const totalItems = toFiniteNumber(pagination.total_items);
  let totalPages = toFiniteNumber(pagination.total_pages);

  if ((totalPages === undefined || totalPages <= 0) && totalItems !== undefined && pageSize) {
    totalPages = Math.ceil(totalItems / pageSize);
  }

  if (totalPages !== undefined && totalPages < 1) {
    totalPages = 1;
  }

  const currentPage = toFiniteNumber(pagination.page);

  return {
    pageSize: pageSize && pageSize > 0 ? Math.floor(pageSize) : fallbackPageSize,
    currentPage:
      currentPage !== undefined && currentPage > 0 ? Math.floor(currentPage) : undefined,
    totalPages: totalPages !== undefined ? Math.floor(totalPages) : undefined,
    totalItems: totalItems !== undefined ? Math.floor(totalItems) : undefined,
  };
};
