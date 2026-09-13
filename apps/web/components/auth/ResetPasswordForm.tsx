"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";
import { isValidPassword, PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { Alert } from "./Alert";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    new_password?: string;
    confirm_password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } else {
      setToken(null);
    }
  }, [searchParams]);

  function validate(): boolean {
    const next: { new_password?: string; confirm_password?: string } = {};
    if (!newPassword) next.new_password = "Informe a nova senha.";
    else if (!isValidPassword(newPassword))
      next.new_password = `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    if (!confirmPassword) next.confirm_password = "Confirme a nova senha.";
    else if (confirmPassword !== newPassword)
      next.confirm_password = "As senhas não coincidem.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRateLimited(false);
    setExpired(false);
    setSuccess(false);

    if (!token) {
      setError("Token de redefinição ausente ou inválido.");
      return;
    }
    if (!validate()) return;

    setLoading(true);
    const result = await resetPassword(token, newPassword);
    setLoading(false);

    if (result.ok) {
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      return;
    }

    if (result.kind === "gone") {
      setExpired(true);
      setError("Este link expirou. Solicite uma nova redefinição de senha.");
      return;
    }
    if (result.kind === "rate_limit") {
      setRateLimited(true);
      setError("Muitas tentativas. Aguarde e tente novamente.");
      return;
    }
    if (result.kind === "validation") {
      setError(result.message || "Dados inválidos.");
      return;
    }
    if (result.kind === "network") {
      setError(result.message);
      return;
    }
    setError("Não foi possível redefinir a senha. Tente novamente.");
  }

  if (!token && !success) {
    return (
      <Alert variant="error">
        Token ausente. Abra o link enviado por e-mail ou solicite uma nova
        redefinição.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {success ? (
        <Alert variant="success" role="status">
          Senha redefinida com sucesso. Você já pode entrar com a nova senha.
        </Alert>
      ) : null}
      {expired ? (
        <Alert variant="warning">Link expirado (410). Solicite um novo.</Alert>
      ) : null}
      {rateLimited ? (
        <Alert variant="warning">Limite de tentativas excedido (429).</Alert>
      ) : null}
      {error && !rateLimited && !expired ? (
        <Alert variant="error">{error}</Alert>
      ) : null}

      {!success ? (
        <>
          <FormField
            id="new_password"
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required
            disabled={loading}
            minLength={PASSWORD_MIN_LENGTH}
            hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
            error={fieldErrors.new_password}
          />
          <FormField
            id="confirm_password"
            label="Confirmar senha"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            disabled={loading}
            error={fieldErrors.confirm_password}
          />
          <SubmitButton loading={loading}>Redefinir senha</SubmitButton>
        </>
      ) : null}
    </form>
  );
}
