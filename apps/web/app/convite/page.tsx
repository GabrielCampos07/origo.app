"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { storeAuthSession } from "@/lib/auth-storage";
import { isValidEmail, isValidPassword, PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { Alert } from "@/components/auth/Alert";

type InviteState =
  | { state: "loading" }
  | { state: "valid"; professional_name: string; category: string }
  | { state: "expired" }
  | { state: "used" }
  | { state: "success" }
  | { state: "error" };

type RegisterStudentResponse = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string; role: "STUDENT" };
  missing_doc_versions?: string[];
};

export default function InvitePage() {
  const router = useRouter();

  const [inviteState, setInviteState] = useState<InviteState>({ state: "loading" });
  const [token, setToken] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ nome?: string; email?: string; senha?: string }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // P1 SEC (FRONTEND SECURITY CHECKER): Token in URL hash #token=, NOT query param
    // After read, strip hash with history.replaceState
    // NEVER log token to console or analytics
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash || !hash.startsWith("#token=")) {
      setInviteState({ state: "error" });
      return;
    }

    const tokenValue = hash.substring(7); // Remove "#token="
    if (!tokenValue) {
      setInviteState({ state: "error" });
      return;
    }

    // Strip hash immediately after reading
    history.replaceState(null, "", window.location.pathname);

    setToken(tokenValue);

    async function checkInvite() {
      // P1 SEC (FRONTEND SECURITY CHECKER): POST /api/v1/invites/validate with token in body
      // Backend PR #32 @ 2231cfc - locked contract
      // - Token in JSON body (NOT URL path) to prevent access log leakage
      // - Backend returns states: valid | expired | used | invalid
      // - "email_exists" is NOT exposed as distinct state (collapsed into generic error)
      // - No internal IDs leaked
      const result = await apiPost<{
        valid: boolean;
        state: "valid" | "expired" | "used" | "invalid";
        professional_name?: string;
        category?: string;
      }>("/api/v1/invites/validate", { token: tokenValue });

      if (result.ok) {
        if (result.data.state === "valid") {
          setInviteState({
            state: "valid",
            professional_name: result.data.professional_name || "",
            category: result.data.category || "",
          });
        } else if (result.data.state === "expired") {
          setInviteState({ state: "expired" });
        } else if (result.data.state === "used") {
          setInviteState({ state: "used" });
        } else {
          // invalid or any other state → generic error (no enumeration)
          setInviteState({ state: "error" });
        }
      } else {
        // P1 SEC: Generic error - do not expose "email_exists" or other enumerable states
        setInviteState({ state: "error" });
      }
    }

    checkInvite();
  }, []);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!nome.trim()) next.nome = "Informe seu nome.";
    if (!email.trim()) next.email = "Informe seu e-mail.";
    else if (!isValidEmail(email)) next.email = "E-mail inválido.";
    if (!senha) next.senha = "Informe sua senha.";
    else if (!isValidPassword(senha))
      next.senha = `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate() || !token) return;

    setSubmitting(true);

    // P1 SEC (FRONTEND SECURITY CHECKER): POST /api/v1/auth/register/student
    // Backend PR #32 Sec: MUST include real email field (user-entered)
    // - Token + nome/email/senha - NO professionalId/studentId in client payload
    // - Backend validates token and creates enrollment ACTIVE
    // - Backend enforces 1 active pro per category
    // - Returns JWT + student role
    const result = await apiPost<RegisterStudentResponse>("/api/v1/auth/register/student", {
      invite_token: token,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
    });

    setSubmitting(false);

    if (result.ok) {
      storeAuthSession({
        access_token: result.data.access_token,
        refresh_token: result.data.refresh_token,
        user: result.data.user,
        missing_doc_versions: result.data.missing_doc_versions,
      });

      setInviteState({ state: "success" });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        if (result.data.missing_doc_versions && result.data.missing_doc_versions.length > 0) {
          router.push("/legal/accept");
        } else {
          router.push("/dashboard/aluno");
        }
      }, 2000);
      return;
    }

    // P1 SEC: All errors collapse to generic message
    // Do not expose "email_exists", "invalid_token", etc. as distinct states
    if (result.kind === "gone") {
      setInviteState({ state: "expired" });
      return;
    }
    // P1 SEC (FRONTEND SECURITY CHECKER): On 422 validation error, do NOT render result.message
    // May leak "email_exists" or other enumerable info - show generic error only
    if (result.kind === "validation") {
      setError("Não foi possível criar sua conta. Verifique seus dados e tente novamente.");
      return;
    }
    if (result.kind === "network") {
      setError(result.message);
      return;
    }
    setError("Não foi possível criar sua conta. Tente novamente.");
  }

  if (inviteState.state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900">beOrigo</h1>
          </div>

          {inviteState.state === "valid" ? (
            <>
              <div className="mb-6 text-center">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-semibold text-slate-900">Você foi convidado!</h2>
                <p className="text-slate-600">
                  {inviteState.professional_name 
                    ? `${inviteState.professional_name} convidou você para se cadastrar. Cadastre-se com seus dados e comece a usar o beOrigo.`
                    : "Convite válido. Cadastre-se com seus dados e comece a usar o beOrigo."}
                </p>
                {inviteState.category && (
                  <p className="mt-2 text-sm text-slate-500">Categoria: {inviteState.category}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error ? <Alert variant="error">{error}</Alert> : null}

                <div>
                  <label htmlFor="nome" className="mb-1 block text-sm font-medium text-slate-700">
                    Nome
                  </label>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={submitting}
                    required
                    placeholder="Digite seu nome completo"
                    autoComplete="name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  {fieldErrors.nome ? (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.nome}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  {fieldErrors.email ? (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="senha" className="mb-1 block text-sm font-medium text-slate-700">
                    Senha
                  </label>
                  <input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={submitting}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  {fieldErrors.senha ? (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.senha}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-teal-600 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {submitting ? "Criando conta..." : "Criar conta de aluno"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-600">
                Já tem conta?{" "}
                <Link href="/login" className="font-medium text-teal-700 hover:text-teal-900">
                  Entrar
                </Link>
              </p>
            </>
          ) : inviteState.state === "expired" ? (
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mx-auto">
                <svg
                  className="h-8 w-8 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-slate-900">Link expirado</h2>
              <p className="text-slate-600">Este link de convite já expirou.</p>
              <p className="mt-4">
                <Link
                  href="/login"
                  className="inline-block rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
                >
                  Voltar
                </Link>
              </p>
            </div>
          ) : inviteState.state === "used" ? (
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mx-auto">
                <svg
                  className="h-8 w-8 text-slate-600"
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
              <h2 className="mb-2 text-2xl font-semibold text-slate-900">Convite já usado</h2>
              <p className="text-slate-600">Este link de convite já foi utilizado.</p>
              <p className="mt-4">
                <Link
                  href="/login"
                  className="inline-block rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
                >
                  Ir para o login
                </Link>
              </p>
            </div>
          ) : inviteState.state === "success" ? (
            <div className="text-center">
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
              <h2 className="mb-2 text-2xl font-semibold text-slate-900">Vinculado!</h2>
              <p className="text-slate-600">Conta criada com sucesso. Redirecionando...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-slate-900">Algo deu errado</h2>
              <p className="text-slate-600">Não foi possível processar o convite. Tente novamente mais tarde.</p>
              <p className="mt-4">
                <Link
                  href="/login"
                  className="inline-block rounded-lg bg-slate-600 px-6 py-2 font-medium text-white transition-colors hover:bg-slate-700"
                >
                  Ir para o login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
  );
}
