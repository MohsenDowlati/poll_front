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

export interface AdminPollRecord extends PollRecord {
  category?: string;
  participant?: number | string;
  participants?: number | string;
  responses?: Array<unknown>;
  votes?: Array<unknown>;
  type?: string;
}

export interface AdminPollSummary {
  id: string;
  title: string;
  category: string;
  description?: string;
  type: string;
  options: string[];
  votes: number[];
  responses: string[];
  participants: number;
  raw: PollRecord;
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
  inputs?: string[];
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

const toTrimmedString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => toTrimmedString(item))
    .filter((item) => item.length > 0);
};

const toNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const numeric = toFiniteNumber(item);
    return numeric !== undefined ? numeric : 0;
  });
};

const sumNumberArray = (values: number[]): number => {
  return values.reduce((total, current) => total + current, 0);
};

export const fetchPolls = (params: FetchPollsParams) => {
  return http.get<PollListResponse>(endpoints.poll.fetch, {
    params,
  });
};

export const fetchAdminPolls = (params: FetchPollsParams) => {
  return http.get<PollListResponse>(endpoints.poll.adminFetch, {
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
export const extractAdminPolls = (
  payload: PollListResponse | PollRecord[] | null | undefined,
): AdminPollSummary[] => {
  const rawPolls = extractPolls(payload);

  return rawPolls.map((raw, index) => {
    const record = raw as AdminPollRecord;
    const idValue = record.id ?? index;
    const id = toTrimmedString(idValue) || String(index + 1);
    const title = toTrimmedString(record.title) || `Poll ${index + 1}`;
    const category = toTrimmedString((record as Record<string, unknown>).category) || 'Uncategorized';
    const type = toTrimmedString(record.poll_type ?? record.type) || 'unknown';
    const descriptionValue = toTrimmedString(record.description);
    const optionsSource = Array.isArray(record.options)
      ? record.options
      : (record as Record<string, unknown>).options;
    const options = toStringArray(optionsSource);
    const votesRaw = toNumberArray((record as Record<string, unknown>).votes);
    const votes = options.map((_, idx) => votesRaw[idx] ?? 0);
    const responses = toStringArray((record as Record<string, unknown>).responses);
    const participantValue = (record as Record<string, unknown>).participant;
    const participantsValue = (record as Record<string, unknown>).participants;
    const participantNumeric =
      toFiniteNumber(participantValue) ?? toFiniteNumber(participantsValue);
    const participants =
      participantNumeric !== undefined ? Math.max(0, Math.floor(participantNumeric)) : sumNumberArray(votes);

    return {
      id,
      title,
      category,
      description: descriptionValue || undefined,
      type,
      options,
      votes,
      responses,
      participants,
      raw,
    };
  });
};
