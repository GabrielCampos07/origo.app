"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "../../lib/api";
import { storeAuthSession } from "../../lib/auth-storage";
import { isValidEmail } from "../../lib/validation";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Alert } from "../../components/auth/Alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const next: typeof fieldErrors = {};
    if (!isValidEmail(email.trim().toLowerCase())) next.email = "Informe um e-mail válido";
    if (!password) next.password = "Informe a senha";
    setFieldErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const normalized = email.trim().toLowerCase();
    const res = await login(normalized, password);
    setLoading(false);
    if (!res.ok) {
      if (res.kind === "unauthorized") setError("E-mail ou senha inválidos");
      else if (res.kind === "validation") setError("Dados inválidos. Confira e tente de novo");
      else if (res.kind === "rate_limit") setError("Muitas tentativas. Aguarde um pouco e tente novamente");
      else if (res.kind === "network") setError("Falha de rede. Verifique se a API está em :3001");
      else setError("Não foi possível entrar. Tente novamente");
      return;
    }
    storeAuthSession(res.data);
    router.push("/dashboard");
  }

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta Origo">
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
        {error ? <Alert variant="error">{error}</Alert> : null}
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          E-mail
          <input
            type="email"
            autoComplete="email"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
          {fieldErrors.email ? <span className="text-red-700">{fieldErrors.email}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
          {fieldErrors.password ? <span className="text-red-700">{fieldErrors.password}</span> : null}
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <p className="text-sm text-slate-600">
          <Link href="/forgot-password">Esqueci minha senha</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
