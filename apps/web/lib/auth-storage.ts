/**
 * P0 SEC (FRONTEND SECURITY CHECKER): localStorage is DEMO-ONLY.
 * Prod must move access/refresh to httpOnly + Secure + SameSite cookies; refresh cookie path locked.
 */
export type OrigoUser = {
  id: string;
  email: string;
};

const ACCESS_KEY = "origo_access_token";
const REFRESH_KEY = "origo_refresh_token";
const USER_KEY = "origo_user";

export function storeAuthSession(params: {
  access_token: string;
  refresh_token: string;
  user: OrigoUser;
}): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, params.access_token);
  localStorage.setItem(REFRESH_KEY, params.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(params.user));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
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
