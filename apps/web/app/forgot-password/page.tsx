"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../../lib/api";
import { isValidEmail } from "../../lib/validation";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Alert } from "../../components/auth/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setFieldError("Informe um e-mail válido");
      return;
    }
    setLoading(true);
    const res = await forgotPassword(normalized);
    setLoading(false);
    // Anti-enumeration: only network + 429 surface as error; everything else => generic success
    if (!res.ok && res.kind === "rate_limit") {
      setError("Muitas tentativas. Aguarde e tente novamente");
      return;
    }
    if (!res.ok && res.kind === "network") {
      setError("Falha de rede. Verifique se a API está em :3001");
      return;
    }
    setSuccess(true);
  }

  return (
    <AuthLayout title="Esqueci minha senha" subtitle="Enviaremos instruções de recuperação">
      {success ? (
        <div className="flex flex-col gap-4">
          <Alert variant="success" role="status">
            Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha.
          </Alert>
          <Link href="/login">Voltar ao login</Link>
        </div>
      ) : (
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
            {fieldError ? <span className="text-red-700">{fieldError}</span> : null}
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar link"}
          </button>
          <Link href="/login" className="text-sm">
            Voltar ao login
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
