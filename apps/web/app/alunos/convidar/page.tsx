"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getStoredUser, clearAuthSession } from "@/lib/auth-storage";
import { apiPostAuth, handleApiError } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { Alert } from "@/components/auth/Alert";

type InviteResponse = {
  invite_url: string;
  code?: string;
  expires_at: string;
};

const CATEGORIES = [
  { value: "fisioterapeuta", label: "Fisioterapeuta" },
  { value: "psicologo", label: "Psicólogo" },
  { value: "terapeuta-ocupacional", label: "Terapeuta Ocupacional" },
  { value: "fonoaudiologo", label: "Fonoaudiólogo" },
  { value: "educador-fisico", label: "Educador Físico" },
  { value: "nutricionista", label: "Nutricionista" },
  { value: "pedagogo", label: "Pedagogo" },
  { value: "outro", label: "Outro" },
];

export default function InviteStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ email: string; role?: string } | null>(null);
  const [email, setEmail] = useState("");
  const [categoria, setCategoria] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; categoria?: string }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/login");
      return;
    }

    if (storedUser.role !== "PROFESSIONAL") {
      router.push("/dashboard/aluno");
      return;
    }

    setUser(storedUser);
    setLoading(false);
  }, [router]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Informe o e-mail do aluno.";
    else if (!isValidEmail(email)) next.email = "E-mail inválido.";
    if (!categoria) next.categoria = "Selecione a categoria.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteUrl(null);
    if (!validate()) return;

    setSubmitting(true);

    // P0 SEC (FRONTEND SECURITY CHECKER): POST /api/v1/invites
    // - Bearer JWT required (professional only)
    // - Backend validates category against whitelist
    // - Backend generates opaque single-use hashed token with TTL
    // - Returns invite_url with opaque token (no client IDs exposed)
    // - 1 active pro per category (backend enforces)
    const result = await apiPostAuth<InviteResponse>("/api/v1/invites", {
      student_email: email.trim().toLowerCase(),
      category: categoria,
    });

    setSubmitting(false);

    if (result.ok) {
      setInviteUrl(result.data.invite_url);
      setEmail("");
      setCategoria("");
      return;
    }

    handleApiError(result);

    if (result.kind === "unauthorized") {
      setError("Sessão expirada. Faça login novamente.");
      setTimeout(() => router.push("/login"), 2000);
      return;
    }
    if (result.kind === "validation") {
      setError(result.message || "Dados inválidos. Verifique e tente novamente.");
      return;
    }
    if (result.kind === "network") {
      setError(result.message);
      return;
    }
    setError("Não foi possível criar o convite. Tente novamente.");
  }

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">beOrigo</h1>
            <span className="mt-1 inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
              Professor
            </span>
          </div>
          <span className="text-sm text-slate-600">{user?.email}</span>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">Convidar aluno</h2>
          <p className="text-slate-600">
            Crie um convite para seu aluno. Use o link ou compartilhe diretamente.
          </p>
        </div>

        {inviteUrl ? (
          <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50 p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 mx-auto">
              <svg
                className="h-8 w-8 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Convite criado!</h3>
            <p className="mb-4 text-sm text-slate-600">
              Agora você só precisa copiar e enviar o link pro aluno.
            </p>
            <div className="mb-4 overflow-hidden rounded-lg border border-slate-300 bg-white p-3">
              <code className="break-all text-xs text-slate-700">{inviteUrl}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
              }}
              className="rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
            >
              Copiar link
            </button>
            <p className="mt-4 text-xs text-slate-500">Válido por 7 dias. Uso único.</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              E-mail do aluno
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              placeholder="aluno@exemplo.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-slate-700">
              Categoria
            </label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              disabled={submitting}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">Selecione a categoria</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {fieldErrors.categoria ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.categoria}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-teal-600 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {submitting ? "Criando convite..." : "Gerar link de convite"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
          <button
            onClick={() => router.push("/dashboard/professor")}
            className="text-sm text-teal-700 hover:text-teal-900"
          >
            ← Voltar ao dashboard
          </button>
          <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-slate-900">
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
