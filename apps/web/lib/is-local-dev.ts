/**
 * Gate for local-dev-only UI (e.g. one-click demo login).
 * Requires BOTH a development build AND a localhost hostname.
 * Never true for production builds or when browsing staging/prod hosts.
 */
export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV !== "development") return false;

  const host = window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}
