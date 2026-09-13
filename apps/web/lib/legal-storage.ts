/**
 * Legal acceptance state management.
 * 
 * SEC: When protected API endpoints return 403 with legal_acceptance_required,
 * frontend stores missing_doc_versions and redirects to /legal/accept.
 * 
 * Backend PR #14 (tip a103f20) implements this gate.
 */

const MISSING_DOCS_KEY = "origo_missing_legal_docs";

export type MissingDocVersions = string[];

/**
 * Store missing document versions that require acceptance.
 * Called when API returns 403 with legal_acceptance_required.
 */
export function storeMissingDocVersions(versions: string[]): void {
  if (typeof window === "undefined") return;
  if (!versions || versions.length === 0) {
    localStorage.removeItem(MISSING_DOCS_KEY);
    return;
  }
  localStorage.setItem(MISSING_DOCS_KEY, JSON.stringify(versions));
}

/**
 * Get stored missing document versions.
 */
export function getMissingDocVersions(): MissingDocVersions {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MISSING_DOCS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Clear missing document versions after successful acceptance.
 */
export function clearMissingDocVersions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MISSING_DOCS_KEY);
}

/**
 * Check if user has pending legal documents to accept.
 */
export function hasPendingLegalDocs(): boolean {
  return getMissingDocVersions().length > 0;
}

/**
 * Redirect to /legal/accept with current path as return URL.
 * Call this when API returns legal_acceptance_required.
 */
export function redirectToLegalAccept(): void {
  if (typeof window === "undefined") return;
  const currentPath = window.location.pathname + window.location.search;
  const returnUrl = encodeURIComponent(currentPath);
  window.location.href = `/legal/accept?return=${returnUrl}`;
}
