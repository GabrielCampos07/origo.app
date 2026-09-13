import { storeMissingDocVersions, redirectToLegalAccept } from "./legal-storage";

export type ApiErrorKind =
  | "validation"
  | "unauthorized"
  | "legal_acceptance_required"
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
 * Handle API error result, including legal acceptance redirect.
 * SEC: Backend PR #14 (a103f20) - protected routes return 403 with legal_acceptance_required.
 * Frontend must store missing_doc_versions and redirect to /legal/accept.
 * 
 * Call this in components after getting an API error result to handle redirects.
 */
export function handleApiError<T>(result: ApiResult<T>): void {
  if (result.ok) return;
  
  if (result.kind === "legal_acceptance_required") {
    if (result.missing_doc_versions) {
      storeMissingDocVersions(result.missing_doc_versions);
    }
    redirectToLegalAccept();
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
