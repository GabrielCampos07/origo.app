export type ApiErrorKind =
  | "validation"
  | "unauthorized"
  | "rate_limit"
  | "gone"
  | "network"
  | "unknown";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: ApiErrorKind; message: string; status?: number };

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return body.message || body.error || `Erro HTTP ${res.status}`;
  } catch {
    return `Erro HTTP ${res.status}`;
  }
}

function mapStatusToKind(status: number): ApiErrorKind {
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

    const message = await parseErrorMessage(res);
    return {
      ok: false,
      kind: mapStatusToKind(res.status),
      message,
      status: res.status,
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
async function apiPostAuth<T>(
  path: string,
  body: Record<string, unknown>,
  token: string
): Promise<ApiResult<T>> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      return { ok: true, data };
    }

    const message = await parseErrorMessage(res);
    return {
      ok: false,
      kind: mapStatusToKind(res.status),
      message,
      status: res.status,
    };
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}

export function acceptLegalDocuments(token: string, docVersions: string[]) {
  return apiPostAuth<{ message?: string }>(
    "/api/v1/legal/accept",
    { docVersions },
    token
  );
}
