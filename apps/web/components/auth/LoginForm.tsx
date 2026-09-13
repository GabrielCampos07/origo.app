"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { login } from "@/lib/api";
import { storeAuthSession } from "@/lib/auth-storage";
import { isValidEmail } from "@/lib/validation";
import { Alert } from "./Alert";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Informe seu e-mail.";
    else if (!isValidEmail(email)) next.email = "E-mail inválido.";
    if (!password) next.password = "Informe sua senha.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRateLimited(false);
    setSuccess(false);
    if (!validate()) return;

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.ok) {
      storeAuthSession({
        access_token: result.data.access_token,
        refresh_token: result.data.refresh_token,
        user: result.data.user,
      });
      setSuccess(true);
      setPassword("");
      return;
    }

    if (result.kind === "rate_limit") {
      setRateLimited(true);
      setError("Muitas tentativas. Aguarde um momento e tente novamente.");
      return;
    }
    if (result.kind === "unauthorized") {
      setError("E-mail ou senha inválidos.");
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
    setError("Não foi possível entrar. Tente novamente.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {success ? (
        <Alert variant="success" role="status">
          Login realizado com sucesso.
        </Alert>
      ) : null}
      {rateLimited ? (
        <Alert variant="warning">Limite de tentativas excedido (429). Tente mais tarde.</Alert>
      ) : null}
      {error && !rateLimited ? <Alert variant="error">{error}</Alert> : null}

      <FormField
        id="email"
        label="E-mail"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
        disabled={loading}
        placeholder="voce@exemplo.com"
        error={fieldErrors.email}
      />
      <FormField
        id="password"
        label="Senha"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
        disabled={loading}
        error={fieldErrors.password}
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          Esqueci minha senha
        </Link>
      </div>

      <SubmitButton loading={loading}>Entrar</SubmitButton>
    </form>
  );
}
