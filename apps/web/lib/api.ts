import { storeMissingDocVersions } from "./auth-storage";

export type ApiErrorKind =
  | "validation"
  | "unauthorized"
  | "legal_acceptance_required"
  | "payment_required"
  | "rate_limit"
  | "gone"
  | "network"
  | "unknown";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { 
      ok: false; 
      kind: ApiErrorKind; 
      message: string; 
      status?: number;
      missing_doc_versions?: string[];
    };

/**
 * Handle API error result, including legal acceptance and payment redirects.
 * SEC: Backend PR #14 (a103f20) - protected routes return 403 with legal_acceptance_required.
 * SEC: Backend PR #53 - protected routes return 403 with payment_required.
 * Frontend must store missing_doc_versions and redirect to /legal/accept or /checkout.
 * 
 * Call this in components after getting an API error result to handle redirects.
 * 
 * FRONTEND SECURITY NOTE: Client never authorizes; only reacts to server payment_required;
 * redirect to /checkout only. Generic error without detail to prevent enumeration.
 */
export function handleApiError<T>(result: ApiResult<T>): void {
  if (result.ok) return;
  
  if (result.kind === "legal_acceptance_required") {
    if (result.missing_doc_versions) {
      storeMissingDocVersions(result.missing_doc_versions);
    }
    // Redirect to /legal/accept with current path as return URL
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname + window.location.search;
      const returnUrl = encodeURIComponent(currentPath);
      window.location.href = `/legal/accept?return=${returnUrl}`;
    }
  }
  
  if (result.kind === "payment_required") {
    // Redirect to /checkout - user must complete payment to access protected routes
    // Backend PR #53: fail-closed payment gate for PROFESSIONAL users
    if (typeof window !== "undefined") {
      window.location.href = "/checkout";
    }
  }
}

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}

async function parseErrorMessage(res: Response): Promise<{
  message: string;
  kind?: ApiErrorKind;
  missing_doc_versions?: string[];
}> {
  try {
    const body = (await res.json()) as { 
      message?: string; 
      error?: string;
      missing_doc_versions?: string[];
    };
    
    // SEC: Legal 403 gate — when backend returns 403 with legal_acceptance_required,
    // frontend must redirect to /legal/accept
    if (res.status === 403 && body.error === "legal_acceptance_required") {
      return {
        message: body.message || "Aceitação de termos necessária",
        kind: "legal_acceptance_required",
        missing_doc_versions: body.missing_doc_versions,
      };
    }
    
    // SEC: Payment 403 gate — when backend returns 403 with payment_required,
    // frontend must redirect to /checkout (Backend PR #53)
    if (res.status === 403 && body.error === "payment_required") {
      return {
        message: body.message || "Pagamento pendente. Complete o checkout para ativar sua conta.",
        kind: "payment_required",
      };
    }
    
    return {
      message: body.message || body.error || `Erro HTTP ${res.status}`,
    };
  } catch {
    return { message: `Erro HTTP ${res.status}` };
  }
}

function mapStatusToKind(status: number, errorKind?: ApiErrorKind): ApiErrorKind {
  if (errorKind) return errorKind;
  if (status === 401) return "unauthorized";
  if (status === 409) return "validation";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limit";
  if (status === 410) return "gone";
  return "unknown";
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<ApiResult<T>> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      return { ok: true, data };
    }

    const errorData = await parseErrorMessage(res);
    return {
      ok: false,
      kind: mapStatusToKind(res.status, errorData.kind),
      message: errorData.message,
      status: res.status,
      missing_doc_versions: errorData.missing_doc_versions,
    };
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

// SEC: Authenticated API calls require Bearer token from localStorage (DEMO-ONLY)
// Prod must use httpOnly cookies
function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("origo_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      return { ok: true, data };
    }

    const errorData = await parseErrorMessage(res);
    return {
      ok: false,
      kind: mapStatusToKind(res.status, errorData.kind),
      message: errorData.message,
      status: res.status,
      missing_doc_versions: errorData.missing_doc_versions,
    };
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export async function apiPostAuth<T>(
  path: string,
  body: Record<string, unknown>
): Promise<ApiResult<T>> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      return { ok: true, data };
    }

    const errorData = await parseErrorMessage(res);
    return {
      ok: false,
      kind: mapStatusToKind(res.status, errorData.kind),
      message: errorData.message,
      status: res.status,
      missing_doc_versions: errorData.missing_doc_versions,
    };
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export async function apiPut<T>(
  path: string,
  body: Record<string, unknown>
): Promise<ApiResult<T>> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      return { ok: true, data };
    }

    const errorData = await parseErrorMessage(res);
    return {
      ok: false,
      kind: mapStatusToKind(res.status, errorData.kind),
      message: errorData.message,
      status: res.status,
      missing_doc_versions: errorData.missing_doc_versions,
    };
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export async function apiPatch<T>(
  path: string,
  body: Record<string, unknown>
): Promise<ApiResult<T>> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      return { ok: true, data };
    }

    const errorData = await parseErrorMessage(res);
    return {
      ok: false,
      kind: mapStatusToKind(res.status, errorData.kind),
      message: errorData.message,
      status: res.status,
      missing_doc_versions: errorData.missing_doc_versions,
    };
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string; role?: "PROFESSIONAL" | "STUDENT" };
  missing_doc_versions?: string[];
};

export function login(email: string, password: string) {
  return apiPost<LoginResponse>("/api/v1/auth/login", { email, password });
}

export function forgotPassword(email: string) {
  return apiPost<{ message?: string }>("/api/v1/auth/forgot-password", {
    email,
  });
}

export function resetPassword(token: string, new_password: string) {
  return apiPost<{ message?: string }>("/api/v1/auth/reset-password", {
    token,
    new_password,
  });
}

/**
 * P0 SEC (FRONTEND SECURITY CHECKER): Authorization header with Bearer JWT required.
 * No accept without auth.
 */
export function acceptLegalDocuments(token: string, docVersions: string[]) {
  const url = `${getApiBase()}/api/v1/legal/accept`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ docVersions }),
  }).then(async (res) => {
    if (res.ok) {
      const data = await res.json();
      return { ok: true as const, data };
    }
    const errorData = await parseErrorMessage(res);
    return {
      ok: false as const,
      kind: mapStatusToKind(res.status, errorData.kind),
      message: errorData.message,
      status: res.status,
      missing_doc_versions: errorData.missing_doc_versions,
    };
  }).catch(() => ({
    ok: false as const,
    kind: "network" as const,
    message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
  }));
}

/**
 * Checkout Session API
 * Backend PR #21 (bb12fd6) - POST /api/v1/checkout/session
 * 
 * P0 SEC (FRONTEND SECURITY CHECKER): 
 * - Bearer JWT required (authenticated)
 * - Plan must be whitelisted: "start"|"pro"|"clinic"
 * - Billing cycle must be: "monthly"|"annual"
 * - Referral code is optional, sent only if validated
 * - NEVER put Stripe secret or price IDs in frontend
 * - Redirect to checkout_url from trusted API response only
 * 
 * Error handling:
 * - 401: unauthorized → redirect to login
 * - 403 legal_acceptance_required → redirect to /legal/accept
 * - 403 STUDENT → redirect to dashboard
 * - 422: validation error → show inline
 * - 503: Stripe/config error → show inline
 */
export type CheckoutSessionRequest = {
  plan: "start" | "pro" | "clinic";
  billing_cycle: "monthly" | "annual";
  referral_code?: string;
};

export type CheckoutSessionResponse = {
  checkout_url: string;
  session_id: string;
};

export async function createCheckoutSession(
  request: CheckoutSessionRequest
): Promise<ApiResult<CheckoutSessionResponse>> {
  return apiPostAuth<CheckoutSessionResponse>(
    "/api/v1/checkout/session",
    request
  );
}
