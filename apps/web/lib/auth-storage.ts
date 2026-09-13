/**
 * P0 SEC (FRONTEND SECURITY CHECKER): localStorage is DEMO-ONLY.
 * Prod must move access/refresh to httpOnly + Secure + SameSite cookies; refresh cookie path locked.
 */
export type OrigoUserRole = "PROFESSIONAL" | "STUDENT";

export type OrigoUser = {
  id: string;
  email: string;
  role?: OrigoUserRole;
};

const ACCESS_KEY = "origo_access_token";
const REFRESH_KEY = "origo_refresh_token";
const USER_KEY = "origo_user";
const MISSING_DOCS_KEY = "origo_missing_docs";

export function storeAuthSession(params: {
  access_token: string;
  refresh_token: string;
  user: OrigoUser;
  missing_doc_versions?: string[];
}): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, params.access_token);
  localStorage.setItem(REFRESH_KEY, params.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(params.user));
  if (params.missing_doc_versions && params.missing_doc_versions.length > 0) {
    localStorage.setItem(MISSING_DOCS_KEY, JSON.stringify(params.missing_doc_versions));
  } else {
    localStorage.removeItem(MISSING_DOCS_KEY);
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(MISSING_DOCS_KEY);
}

export function getStoredUser(): OrigoUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrigoUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getMissingDocVersions(): string[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MISSING_DOCS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

export function clearMissingDocVersions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MISSING_DOCS_KEY);
}

export function storeMissingDocVersions(versions: string[]): void {
  if (typeof window === "undefined") return;
  if (!versions || versions.length === 0) {
    localStorage.removeItem(MISSING_DOCS_KEY);
    return;
  }
  localStorage.setItem(MISSING_DOCS_KEY, JSON.stringify(versions));
}
