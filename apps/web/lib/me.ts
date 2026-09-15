import { apiGet, apiPatch, handleApiError, type ApiResult } from "./api";
import { patchStoredUser, type OrigoUser, type OrigoUserRole } from "./auth-storage";

export type MeProfile = {
  id: string;
  email: string;
  name: string | null;
  role: OrigoUserRole | string;
  subscriptionActive: boolean;
  category: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeMe(raw: unknown): MeProfile | null {
  const data = asRecord(raw);
  if (!data) return null;
  const id = asString(data.id);
  const email = asString(data.email);
  if (!id || !email) return null;
  const role = asString(data.role) || "STUDENT";
  return {
    id,
    email,
    name: asString(data.name),
    role,
    subscriptionActive: data.subscriptionActive === true,
    category: asString(data.category),
  };
}

export function applyMeToStoredUser(profile: MeProfile): OrigoUser | null {
  return patchStoredUser({
    id: profile.id,
    email: profile.email,
    name: profile.name ?? undefined,
    role: profile.role === "PROFESSIONAL" || profile.role === "STUDENT" ? profile.role : undefined,
    category: profile.category ?? undefined,
    subscriptionActive: profile.subscriptionActive,
  });
}

export async function fetchMe(): Promise<ApiResult<MeProfile>> {
  const result = await apiGet<unknown>("/api/v1/me");
  if (!result.ok) {
    handleApiError(result);
    return result;
  }
  const profile = normalizeMe(result.data);
  if (!profile) {
    return { ok: false, kind: "unknown", message: "Resposta inválida do perfil." };
  }
  applyMeToStoredUser(profile);
  return { ok: true, data: profile };
}

export async function updateMyName(name: string | null): Promise<ApiResult<MeProfile>> {
  const result = await apiPatch<unknown>("/api/v1/me", { name });
  if (!result.ok) {
    handleApiError(result);
    return result;
  }
  const profile = normalizeMe(result.data);
  if (!profile) {
    return { ok: false, kind: "unknown", message: "Resposta inválida ao salvar nome." };
  }
  applyMeToStoredUser(profile);
  return { ok: true, data: profile };
}
