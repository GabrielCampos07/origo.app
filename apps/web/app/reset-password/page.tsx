"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "../../lib/api";
import { isValidPassword, PASSWORD_MIN_LENGTH } from "../../lib/validation";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Alert } from "../../components/auth/Alert";

function readResetToken(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash?.replace(/^#/, "") || "";
  if (hash.startsWith("token=")) {
    return decodeURIComponent(hash.slice("token=".length)) || null;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    const t = readResetToken();
    setToken(t);
    if (t) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const next: typeof fieldErrors = {};
    if (!isValidPassword(password)) next.password = `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`;
    if (password !== confirm) next.confirm = "As senhas não coincidem";
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    if (!token) {
      setError("Link inválido ou expirado");
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, password);
    setLoading(false);
    if (!res.ok) {
      if (res.kind === "gone") setError("Este link expirou ou já foi usado (410)");
      else if (res.kind === "validation") setError("Senha não atende aos requisitos (422)");
      else if (res.kind === "rate_limit") setError("Muitas tentativas. Aguarde e tente novamente (429)");
      else if (res.kind === "network") setError("Falha de rede. Verifique se a API está em :3001");
      else setError("Não foi possível redefinir a senha");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Defina uma senha forte para sua conta">
      {success ? (
        <Alert variant="success" role="status">
          Senha alterada. Redirecionando para o login…
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
          {error ? <Alert variant="error">{error}</Alert> : null}
          {!token ? <Alert variant="error">Link inválido ou incompleto</Alert> : null}
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Nova senha
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              disabled={loading || !token}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
            {fieldErrors.password ? <span className="text-red-700">{fieldErrors.password}</span> : null}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Confirmar senha
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              disabled={loading || !token}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
            {fieldErrors.confirm ? <span className="text-red-700">{fieldErrors.confirm}</span> : null}
          </label>
          <button
            type="submit"
            disabled={loading || !token}
            className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Salvando…" : "Salvar nova senha"}
          </button>
          <Link href="/login" className="text-sm">
            Voltar ao login
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
