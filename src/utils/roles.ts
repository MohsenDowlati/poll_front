import type { JwtPayload } from "@/utils/jwt";

const ADMIN_FIELD = "admin";
const USER_FIELD = "user";

const findAdminType = (candidate: unknown): string | null => {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const adminValue = record[ADMIN_FIELD];
  if (typeof adminValue === "string" && adminValue.trim() !== "") {
    return adminValue.trim();
  }

  const nestedUser = record[USER_FIELD];
  if (Array.isArray(nestedUser)) {
    for (const nestedCandidate of nestedUser) {
      const nestedValue = findAdminType(nestedCandidate);
      if (nestedValue) {
        return nestedValue;
      }
    }
    return null;
  }

  if (nestedUser && typeof nestedUser === "object") {
    return findAdminType(nestedUser);
  }

  return null;
};

export const extractAdminType = (payload: JwtPayload | null): string | null => {
  return findAdminType(payload);
};

export const isSuperAdmin = (payload: JwtPayload | null): boolean => {
  const adminType = extractAdminType(payload);
  return Boolean(adminType && adminType.toLowerCase() === "super_admin");
};
