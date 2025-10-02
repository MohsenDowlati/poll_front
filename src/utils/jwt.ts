export type JwtPayload = Record<string, unknown>;

const normalizeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = normalized.length % 4;
  if (paddingNeeded === 0) {
    return normalized;
  }
  return normalized + '='.repeat(4 - paddingNeeded);
};

const decodeBase64 = (value: string): string => {
  if (typeof atob === 'function') {
    return atob(value);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('binary');
  }

  throw new Error('No base64 decoder available');
};

const toUtf8String = (binary: string): string => {
  try {
    return decodeURIComponent(
      Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  } catch (error) {
    console.warn('Failed to decode binary string as UTF-8', error);
    return binary;
  }
};

export const decodeJwtPayload = (token: string | null | undefined): JwtPayload | null => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadSegment = normalizeBase64Url(parts[1]);

    if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
      const payloadString = Buffer.from(payloadSegment, 'base64').toString('utf-8');
      return JSON.parse(payloadString) as JwtPayload;
    }

    const binary = decodeBase64(payloadSegment);
    const payloadString = toUtf8String(binary);

    return JSON.parse(payloadString) as JwtPayload;
  } catch (error) {
    console.warn('Failed to decode JWT payload', error);
    return null;
  }
};
