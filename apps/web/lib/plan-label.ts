/**
 * Generic subscription chip labels (MVP — no planId yet).
 */

export function subscriptionStatusLabel(
  subscriptionActive: boolean | null | undefined,
  role?: string | null
): string | null {
  // Students have no SaaS plan.
  if (role === "STUDENT") return null;
  if (subscriptionActive === true) return "Assinatura ativa";
  if (subscriptionActive === false) return "Sem assinatura";
  return null;
}

export function initialsFromUser(params: {
  name?: string | null;
  email?: string | null;
}): string {
  const name = (params.name || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = (params.email || "").trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}
