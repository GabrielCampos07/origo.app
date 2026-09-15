"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "../../lib/api";
import { storeAuthSession, type OrigoUser } from "../../lib/auth-storage";
import { isLocalDevHost } from "../../lib/is-local-dev";
import { isValidEmail } from "../../lib/validation";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Alert } from "../../components/auth/Alert";

type DemoAccount = {
  label: string;
  email: string;
  role: "PROFESSIONAL" | "STUDENT";
  category: "FISIOTERAPIA" | "EDUCACAO_FISICA";
  /** Env key for password — values live in apps/web/.env.local (not committed). */
  passwordEnv:
    | "NEXT_PUBLIC_DEMO_PROF_PASSWORD"
    | "NEXT_PUBLIC_DEMO_ALUNO_PASSWORD"
    | "NEXT_PUBLIC_DEMO_EDUCADOR_PASSWORD"
    | "NEXT_PUBLIC_DEMO_ALUNO_EDUCADOR_PASSWORD";
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Fisioterapeuta",
    email: "prof@origo.dev",
    role: "PROFESSIONAL",
    category: "FISIOTERAPIA",
    passwordEnv: "NEXT_PUBLIC_DEMO_PROF_PASSWORD",
  },
  {
    label: "Paciente (do fisioterapeuta)",
    email: "aluno@origo.dev",
    role: "STUDENT",
    category: "FISIOTERAPIA",
    passwordEnv: "NEXT_PUBLIC_DEMO_ALUNO_PASSWORD",
  },
  {
    label: "Profissional de Educação Física",
    email: "educador@origo.dev",
    role: "PROFESSIONAL",
    category: "EDUCACAO_FISICA",
    passwordEnv: "NEXT_PUBLIC_DEMO_EDUCADOR_PASSWORD",
  },
  {
    label: "Aluno (do educador)",
    email: "aluno.educador@origo.dev",
    role: "STUDENT",
    category: "EDUCACAO_FISICA",
    passwordEnv: "NEXT_PUBLIC_DEMO_ALUNO_EDUCADOR_PASSWORD",
  },
];

function demoPasswordFromEnv(envKey: DemoAccount["passwordEnv"]): string {
  const value = process.env[envKey];
  return typeof value === "string" ? value : "";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showQuickLogin, setShowQuickLogin] = useState(false);

  useEffect(() => {
    setShowQuickLogin(isLocalDevHost());
  }, []);

  async function completeLogin(normalized: string, passwordValue: string) {
    setLoading(true);
    setError(null);
    const res = await login(normalized, passwordValue);
    setLoading(false);
    if (!res.ok) {
      if (res.kind === "unauthorized") setError("E-mail ou senha inválidos");
      else if (res.kind === "validation") setError("Dados inválidos. Confira e tente de novo");
      else if (res.kind === "rate_limit") setError("Muitas tentativas. Aguarde um pouco e tente novamente");
      else if (res.kind === "network") setError("Falha de rede. Verifique se a API está em :3001");
      else setError("Não foi possível entrar. Tente novamente");
      return;
    }

    const demo = DEMO_ACCOUNTS.find((account) => account.email === normalized);

    // DEMO stub: if role missing, map seed emails
    let user: OrigoUser = { ...res.data.user };
    if (!user.role) {
      if (demo) {
        user = { ...user, role: demo.role };
      } else if (normalized === "prof@origo.dev") {
        user = { ...user, role: "PROFESSIONAL" };
      } else if (normalized === "aluno@origo.dev" || normalized === "aluno.educador@origo.dev") {
        user = { ...user, role: "STUDENT" };
      } else if (normalized === "educador@origo.dev") {
        user = { ...user, role: "PROFESSIONAL" };
      }
    }
    if (demo?.category) {
      user = { ...user, category: demo.category };
    }

    storeAuthSession({
      access_token: res.data.access_token,
      refresh_token: res.data.refresh_token,
      user,
      missing_doc_versions: res.data.missing_doc_versions,
    });

    if (res.data.missing_doc_versions && res.data.missing_doc_versions.length > 0) {
      router.push("/legal/accept");
    } else if (user.role === "PROFESSIONAL") {
      router.push("/dashboard/professor");
    } else if (user.role === "STUDENT") {
      router.push("/dashboard/aluno");
    } else {
      router.push("/dashboard");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const next: typeof fieldErrors = {};
    if (!isValidEmail(email.trim().toLowerCase())) next.email = "Informe um e-mail válido";
    if (!password) next.password = "Informe a senha";
    setFieldErrors(next);
    if (Object.keys(next).length) return;

    const normalized = email.trim().toLowerCase();
    await completeLogin(normalized, password);
  }

  async function onQuickLogin(account: DemoAccount) {
    if (!isLocalDevHost()) return;
    const demoPassword = demoPasswordFromEnv(account.passwordEnv);
    if (!demoPassword) {
      setError(
        `Login rápido: defina ${account.passwordEnv} em apps/web/.env.local (veja .env.local.example / DEMO_LOCAL.md)`,
      );
      return;
    }
    setEmail(account.email);
    setPassword(demoPassword);
    setFieldErrors({});
    await completeLogin(account.email, demoPassword);
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

      {showQuickLogin ? (
        <div className="mt-6 border-t border-dashed border-slate-200 pt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Dev local — login rápido
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={loading}
                onClick={() => void onQuickLogin(account)}
                title={account.email}
                className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-900 transition-colors hover:bg-teal-100 disabled:opacity-60"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </AuthLayout>
  );
}
