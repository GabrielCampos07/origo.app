"use client";

import { FormEvent, useState } from "react";
import { forgotPassword } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { Alert } from "./Alert";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

const GENERIC_SUCCESS =
  "Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setFieldError("Informe seu e-mail.");
      return false;
    }
    if (!isValidEmail(email)) {
      setFieldError("E-mail inválido.");
      return false;
    }
    setFieldError(undefined);
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRateLimited(false);
    setSuccess(false);
    if (!validate()) return;

    setLoading(true);
    const result = await forgotPassword(email.trim().toLowerCase());
    setLoading(false);

    if (result.ok) {
      setSuccess(true);
      return;
    }

    if (result.kind === "rate_limit") {
      setRateLimited(true);
      setError("Muitas tentativas. Aguarde e tente novamente.");
      return;
    }
    if (result.kind === "validation") {
      setError(result.message || "E-mail inválido.");
      return;
    }
    if (result.kind === "network") {
      setError(result.message);
      return;
    }
    setError("Não foi possível enviar a solicitação. Tente novamente.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {success ? (
        <Alert variant="success" role="status">
          {GENERIC_SUCCESS}
        </Alert>
      ) : null}
      {rateLimited ? (
        <Alert variant="warning">Limite de tentativas excedido (429).</Alert>
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
        disabled={loading || success}
        placeholder="voce@exemplo.com"
        error={fieldError}
      />

      <SubmitButton loading={loading} disabled={success}>
        Enviar link de redefinição
      </SubmitButton>
    </form>
  );
}
