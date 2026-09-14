"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { storeAuthSession } from "@/lib/auth-storage";
import { isValidEmail, isValidPassword, PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { Alert } from "@/components/auth/Alert";
import { FormField } from "@/components/auth/FormField";
import { SelectField } from "@/components/auth/SelectField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { AuthLayout } from "@/components/auth/AuthLayout";

type RegisterProfessionalResponse = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string; role: "PROFESSIONAL" };
  missing_doc_versions?: string[];
};

const CATEGORIES = [
  { value: "FISIOTERAPIA", label: "Fisioterapeuta" },
  { value: "EDUCACAO_FISICA", label: "Educador físico" },
];

export default function ProfessionalSignupPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [categoria, setCategoria] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    nome?: string;
    email?: string;
    senha?: string;
    categoria?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!nome.trim()) next.nome = "Informe seu nome.";
    if (!email.trim()) next.email = "Informe seu e-mail.";
    else if (!isValidEmail(email)) next.email = "E-mail inválido.";
    if (!senha) next.senha = "Informe sua senha.";
    else if (!isValidPassword(senha))
      next.senha = `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    if (!categoria) next.categoria = "Selecione sua categoria.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);

    // P0 SEC (FRONTEND SECURITY CHECKER): POST /api/v1/auth/register/professional
    // - Body keys in EN: name/email/password/category (not nome/senha/categoria)
    // - Category values: FISIOTERAPIA | EDUCACAO_FISICA (OpenAPI enum, not kebab-case)
    // - UI restricted to only these two options (no PERSONAL, no deprecated categories)
    // - Backend validates category against OpenAPI enum whitelist
    // - Backend returns JWT + trial starts after legal acceptance
    // - No client-side ID generation or manipulation
    // - 422 error messages sanitized to prevent enum value leakage
    const result = await apiPost<RegisterProfessionalResponse>(
      "/api/v1/auth/register/professional",
      {
        name: nome.trim(),
        email: email.trim().toLowerCase(),
        password: senha,
        category: categoria,
      }
    );

    setLoading(false);

    if (result.ok) {
      storeAuthSession({
        access_token: result.data.access_token,
        refresh_token: result.data.refresh_token,
        user: result.data.user,
        missing_doc_versions: result.data.missing_doc_versions,
      });

      // SEC: Legal gate - redirect to legal acceptance if missing docs
      // Professional requires: privacy, terms_app, terms_saas, payments_notice
      if (result.data.missing_doc_versions && result.data.missing_doc_versions.length > 0) {
        router.push("/legal/accept");
      } else {
        router.push("/dashboard/professor");
      }
      return;
    }

    if (result.kind === "validation") {
      setError("Dados inválidos. Verifique as informações e tente novamente.");
      return;
    }
    if (result.kind === "network") {
      setError(result.message);
      return;
    }
    setError("Não foi possível criar sua conta. Tente novamente.");
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Criar conta profissional</h1>
          <p className="text-slate-600">
            Crie sua conta de terapeuta. Plano pro iniciando em 14 dias após aceitar os termos.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <FormField
            id="nome"
            label="Seu nome"
            type="text"
            value={nome}
            onChange={setNome}
            autoComplete="name"
            required
            disabled={loading}
            placeholder="Digite seu nome completo"
            error={fieldErrors.nome}
          />

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
            id="senha"
            label="Senha"
            type="password"
            value={senha}
            onChange={setSenha}
            autoComplete="new-password"
            required
            disabled={loading}
            error={fieldErrors.senha}
          />

          <SelectField
            id="categoria"
            label="Categoria"
            value={categoria}
            onChange={setCategoria}
            options={CATEGORIES}
            placeholder="Selecione sua categoria"
            required
            disabled={loading}
            error={fieldErrors.categoria}
          />

          <SubmitButton loading={loading}>Continuar</SubmitButton>

          <p className="text-center text-sm text-slate-600">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-teal-700 hover:text-teal-900">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
