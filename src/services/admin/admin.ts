import http from '@/services/httpsService';
import endpoints from '@/services/endpoints';

export interface AdminUsersQueryParams extends Record<string, unknown> {
  page?: number;
  page_size?: number;
}

export interface AdminUserRecord extends Record<string, unknown> {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  organization?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface AdminUserListResponse extends Record<string, unknown> {
  data?: AdminUserRecord[];
  results?: AdminUserRecord[];
  users?: AdminUserRecord[];
  items?: AdminUserRecord[];
  records?: AdminUserRecord[];
  total?: number;
  total_items?: number;
  totalPages?: number;
  total_pages?: number;
  count?: number;
  page?: number;
  page_size?: number;
  pageSize?: number;
  current_page?: number;
  currentPage?: number;
  next?: string | null;
  previous?: string | null;
  meta?: Record<string, unknown>;
  pagination?: Record<string, unknown>;
  paging?: Record<string, unknown>;
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

const extractNumberFromPaths = (
  payload: Record<string, unknown> | undefined,
  paths: string[],
): number | undefined => {
  if (!payload) {
    return undefined;
  }

  for (const path of paths) {
    const segments = path.split('.');
    let cursor: unknown = payload;
    for (const segment of segments) {
      if (cursor && typeof cursor === 'object' && segment in (cursor as Record<string, unknown>)) {
        cursor = (cursor as Record<string, unknown>)[segment];
      } else {
        cursor = undefined;
        break;
      }
    }

    const numeric = toFiniteNumber(cursor);
    if (numeric !== undefined) {
      return numeric;
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

  const containers = ['data', 'results', 'users', 'items', 'records'] as const;

  for (const container of containers) {
    const maybeList = payload[container];
    if (Array.isArray(maybeList)) {
      return maybeList as AdminUserRecord[];
    }
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

  const pageSize = extractNumberFromPaths(payload, [
    'page_size',
    'pageSize',
    'meta.page_size',
    'meta.pageSize',
    'pagination.page_size',
    'pagination.pageSize',
    'paging.page_size',
    'paging.pageSize',
  ]) ?? fallbackPageSize;

  const totalItems = extractNumberFromPaths(payload, [
    'total_items',
    'totalItems',
    'total',
    'count',
    'meta.total_items',
    'meta.total',
    'pagination.total_items',
    'pagination.total',
    'paging.total_items',
    'paging.total',
    'recordsTotal',
  ]);

  let totalPages = extractNumberFromPaths(payload, [
    'total_pages',
    'totalPages',
    'meta.total_pages',
    'meta.totalPages',
    'pagination.total_pages',
    'pagination.totalPages',
    'paging.total_pages',
    'paging.totalPages',
  ]);

  if ((totalPages === undefined || totalPages <= 0) && pageSize && totalItems !== undefined) {
    totalPages = Math.ceil(totalItems / pageSize);
  }

  if (totalPages !== undefined && totalPages < 1) {
    totalPages = 1;
  }

  const currentPage = extractNumberFromPaths(payload, [
    'page',
    'current_page',
    'currentPage',
    'meta.page',
    'meta.current_page',
    'meta.currentPage',
    'pagination.page',
    'pagination.current_page',
    'pagination.currentPage',
    'paging.page',
    'paging.current_page',
    'paging.currentPage',
  ]);

  return {
    pageSize: pageSize !== undefined && pageSize > 0 ? Math.floor(pageSize) : fallbackPageSize,
    currentPage:
      currentPage !== undefined && currentPage > 0 ? Math.floor(currentPage) : undefined,
    totalPages: totalPages !== undefined ? Math.floor(totalPages) : undefined,
    totalItems: totalItems !== undefined ? Math.floor(totalItems) : undefined,
  };
};
