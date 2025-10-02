import http from '@/services/httpsService';
import endpoints from '@/services/endpoints';

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

export interface SheetPollPayload {
  title: string;
  poll_type: string;
  options: string[];
  category: string;
  description?: string;
}

export interface CreateSheetPayload {
  title: string;
  polls?: SheetPollPayload[];
  venue?: string;
  is_phone_required?: boolean;
}

export interface CreateSheetPollPayload {
  sheet_id: string | number;
  title: string;
  poll_type: string;
  options: string[];
  category: string;
  description?: string;
}

export interface SheetQueryParams extends Record<string, unknown> {
  page?: number;
  page_size?: number;
}

export interface SheetPollRecord extends Record<string, unknown> {
  id?: string | number;
  title?: string;
  description?: string;
  poll_type?: string;
  options?: string[];
  votes?: unknown[];
  participant?: number;
}

export interface SheetRecord extends Record<string, unknown> {
  id?: string | number;
  title?: string;
  venue?: string;
  description?: string;
  is_phone_required?: boolean;
  status?: string;
  approved_at?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  owner?: string;
  user_name?: string;
  created_by?: string;
  createdBy?: string;
  polls?: SheetPollRecord[];
}

export interface SheetPaginationPayload extends Record<string, unknown> {
  page?: number | string;
  current_page?: number | string;
  page_size?: number | string;
  pageSize?: number | string;
  total_items?: number | string;
  totalItems?: number | string;
  total_pages?: number | string;
  totalPages?: number | string;
}

export interface SheetListResponse extends Record<string, unknown> {
  data?: SheetRecord[];
  results?: SheetRecord[];
  sheets?: SheetRecord[];
  items?: SheetRecord[];
  records?: SheetRecord[];
  pagination?: SheetPaginationPayload;
  meta?: SheetPaginationPayload;
  total?: number | string;
  count?: number | string;
}

export interface SheetMutationResponse extends Record<string, unknown> {
  message?: string;
  sheet?: SheetRecord;
  polls?: SheetPollRecord[];
}

export interface SheetPaginationMeta {
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
}

export const fetchSheets = (params?: SheetQueryParams) => {
  return http.get<SheetListResponse>(endpoints.sheet.fetch, {
    params,
  });
};

export const createSheet = (payload: CreateSheetPayload) => {
  return http.post<SheetMutationResponse>(endpoints.sheet.create, payload);
};

export const createSheetPoll = (payload: CreateSheetPollPayload) => {
  const formData = new FormData();
  formData.append('sheet_id', String(payload.sheet_id));
  formData.append('title', payload.title);
  formData.append('poll_type', payload.poll_type);
  formData.append('category', payload.category);
  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }
  for (const option of payload.options) {
    formData.append('options', option);
  }

  return http.post<SheetMutationResponse>(endpoints.poll.create, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteSheet = (id: string | number) => {
  return http.put<SheetMutationResponse>(
    endpoints.sheet.delete,
    null,
    {
      params: {
        id,
      },
    },
  );
};

export const extractSheetList = (
  payload: SheetListResponse | SheetRecord[] | null | undefined,
): SheetRecord[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  const containers = ['data', 'results', 'sheets', 'items', 'records'] as const;

  for (const container of containers) {
    const maybeList = payload[container];
    if (Array.isArray(maybeList)) {
      return maybeList as SheetRecord[];
    }
  }

  return [];
};

export const extractSheetFromResponse = (
  payload: SheetMutationResponse | null | undefined,
): SheetRecord | undefined => {
  if (!payload || Array.isArray(payload)) {
    return undefined;
  }

  const maybeSheet = (payload as Record<string, unknown>).sheet;
  if (maybeSheet && typeof maybeSheet === 'object') {
    return maybeSheet as SheetRecord;
  }

  return undefined;
};

export const extractSheetPolls = (
  payload: SheetMutationResponse | SheetRecord | SheetPollRecord[] | null | undefined,
): SheetPollRecord[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  const maybePolls = (payload as Record<string, unknown>).polls;
  if (Array.isArray(maybePolls)) {
    return maybePolls as SheetPollRecord[];
  }

  return [];
};

export const extractSheetPaginationMeta = (
  payload: SheetListResponse | null | undefined,
  fallbackPageSize?: number,
): SheetPaginationMeta => {
  if (!payload || Array.isArray(payload)) {
    return {
      pageSize: fallbackPageSize,
    };
  }

  const scope = (payload.pagination || payload.meta) as Record<string, unknown> | undefined;

  const page = extractNumberFromPaths(scope, ['page', 'current_page']);
  const pageSize =
    extractNumberFromPaths(scope, ['page_size', 'pageSize']) ?? fallbackPageSize;

  const totalItems =
    extractNumberFromPaths(scope, ['total_items', 'totalItems']) ??
    extractNumberFromPaths(payload as Record<string, unknown>, ['total', 'count']);

  const totalPages = extractNumberFromPaths(scope, ['total_pages', 'totalPages']);

  return {
    page: page !== undefined && page > 0 ? Math.floor(page) : undefined,
    pageSize: pageSize !== undefined && pageSize > 0 ? Math.floor(pageSize) : fallbackPageSize,
    totalItems: totalItems !== undefined && totalItems >= 0 ? Math.floor(totalItems) : undefined,
    totalPages: totalPages !== undefined && totalPages > 0 ? Math.floor(totalPages) : undefined,
  };
};
