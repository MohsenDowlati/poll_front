import http from '@/services/httpsService';
import endpoints from '@/services/endpoints';

export interface FetchPollsParams extends Record<string, unknown> {
  id: string | number;
  page?: number;
  page_size?: number;
}

export interface PollRecord extends Record<string, unknown> {
  id?: string | number;
  title?: string;
  description?: string;
  poll_type?: string;
  options?: string[];
}

export interface PollPaginationPayload extends Record<string, unknown> {
  page?: number | string;
  page_size?: number | string;
  pageSize?: number | string;
  total_items?: number | string;
  totalItems?: number | string;
  total_pages?: number | string;
  totalPages?: number | string;
}

export interface PollListResponse extends Record<string, unknown> {
  data?: PollRecord[];
  results?: PollRecord[];
  polls?: PollRecord[];
  items?: PollRecord[];
  records?: PollRecord[];
  pagination?: PollPaginationPayload;
  meta?: PollPaginationPayload;
}

export interface SubmitPollVotesPayload {
  id: string | number;
  votes: Array<string | number>;
}

export interface SubmitPollVotesResponse extends Record<string, unknown> {
  message?: string;
  poll?: PollRecord;
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

export const fetchPolls = (params: FetchPollsParams) => {
  return http.get<PollListResponse>(endpoints.poll.fetch, {
    params,
  });
};

export const submitPollVotes = (payload: SubmitPollVotesPayload) => {
  return http.post<SubmitPollVotesResponse>(endpoints.poll.submit, payload);
};

export const extractPolls = (
  payload: PollListResponse | PollRecord[] | null | undefined,
): PollRecord[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  const containers = ['data', 'results', 'polls', 'items', 'records'] as const;

  for (const container of containers) {
    const maybeList = payload[container];
    if (Array.isArray(maybeList)) {
      return maybeList as PollRecord[];
    }
  }

  return [];
};

export interface PollPaginationMeta {
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
}

export const extractPollPaginationMeta = (
  payload: PollListResponse | null | undefined,
): PollPaginationMeta => {
  if (!payload || Array.isArray(payload)) {
    return {};
  }

  const scope = (payload.pagination || payload.meta) as Record<string, unknown> | undefined;

  const page = extractNumberFromPaths(scope, ['page']);
  const pageSize = extractNumberFromPaths(scope, ['page_size', 'pageSize']);
  const totalPages = extractNumberFromPaths(scope, ['total_pages', 'totalPages']);
  const totalItems = extractNumberFromPaths(scope, ['total_items', 'totalItems']);

  return {
    page: page !== undefined && page > 0 ? Math.floor(page) : undefined,
    pageSize: pageSize !== undefined && pageSize > 0 ? Math.floor(pageSize) : undefined,
    totalPages: totalPages !== undefined && totalPages > 0 ? Math.floor(totalPages) : undefined,
    totalItems: totalItems !== undefined && totalItems >= 0 ? Math.floor(totalItems) : undefined,
  };
};
