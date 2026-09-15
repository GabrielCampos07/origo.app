"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { AccountMenu } from "@/components/ui/AccountMenu";
import {
  clearAuthSession,
  getAccessToken,
  getMissingDocVersions,
  getStoredUser,
  type OrigoUser,
} from "@/lib/auth-storage";
import { fetchMe, updateMyName, type MeProfile } from "@/lib/me";
import { subscriptionStatusLabel } from "@/lib/plan-label";
import { roleLabels } from "@/lib/role-labels";

export default function ContaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<OrigoUser | null>(null);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const missingDocs = getMissingDocVersions();
    if (missingDocs && missingDocs.length > 0) {
      router.push("/legal/accept");
      return;
    }

    const stored = getStoredUser();
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(stored);

    void fetchMe().then((result) => {
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      setProfile(result.data);
      setName(result.data.name ?? "");
      setUser(getStoredUser());
      setLoading(false);
    });
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    const result = await updateMyName(name.trim() || null);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setProfile(result.data);
    setName(result.data.name ?? "");
    setUser(getStoredUser());
    setSuccess("Nome atualizado.");
  }

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const labels = roleLabels(profile?.category ?? user?.category);
  const roleLabel =
    profile?.role === "PROFESSIONAL" || user?.role === "PROFESSIONAL"
      ? labels.professionalBadge
      : labels.studentBadge;
  const isPro = (profile?.role ?? user?.role) === "PROFESSIONAL";
  const planLabel = subscriptionStatusLabel(
    profile?.subscriptionActive ?? user?.subscriptionActive,
    profile?.role ?? user?.role
  );
  const backHref =
    (profile?.role ?? user?.role) === "STUDENT" ? "/dashboard/aluno" : "/dashboard/professor";

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
          <div>
            <Link href={backHref} className="text-2xl font-bold text-slate-900">
              beOrigo
            </Link>
            <span className="mt-1 block w-fit rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
              Conta
            </span>
          </div>
          <AccountMenu user={user} onLogout={handleLogout} />
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
          <Link href={backHref} className="mb-4 inline-block text-sm text-teal-700 hover:text-teal-900">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Configurações</h1>
          <p className="mt-1 text-slate-600">Seus dados de perfil na beOrigo.</p>

          {error ? (
            <div className="mt-4">
              <Alert variant="error">{error}</Alert>
            </div>
          ) : null}
          {success ? (
            <div className="mt-4">
              <Alert variant="success">{success}</Alert>
            </div>
          ) : null}

          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">E-mail</dt>
              <dd className="mt-1 text-slate-900">{profile?.email ?? user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Papel</dt>
              <dd className="mt-1 text-slate-900">{roleLabel}</dd>
            </div>
            {isPro ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Plano</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-3 text-slate-900">
                  <span>{planLabel ?? "Sem assinatura"}</span>
                  <Link href="/checkout" className="text-sm font-medium text-teal-700 hover:text-teal-900">
                    Gerenciar planos
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>

          <form onSubmit={onSubmit} className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Nome
              <input
                type="text"
                value={name}
                maxLength={120}
                disabled={saving}
                onChange={(event) => setName(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Como prefere ser chamado"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar nome"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
