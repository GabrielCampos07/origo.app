"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAccessToken,
  getMissingDocVersions,
  clearMissingDocVersions,
  getStoredUser,
} from "@/lib/auth-storage";
import { acceptLegalDocuments } from "@/lib/api";
import { getDocInfo } from "@/lib/legal-docs";
import { Alert } from "@/components/auth/Alert";

export default function LegalAcceptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingDocs, setMissingDocs] = useState<string[]>([]);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.push("/login");
      return;
    }

    const docs = getMissingDocVersions();
    if (!docs || docs.length === 0) {
      // No missing docs, redirect to appropriate dashboard
      const user = getStoredUser();
      if (user?.role === "PROFESSIONAL") {
        router.push("/dashboard/professor");
      } else if (user?.role === "STUDENT") {
        router.push("/dashboard/aluno");
      } else {
        router.push("/dashboard");
      }
      return;
    }

    setToken(accessToken);
    setMissingDocs(docs);
    setLoading(false);
  }, [router]);

  const allAccepted = missingDocs.every((docId) => accepted[docId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!allAccepted || !token) return;

    setError(null);
    setSubmitting(true);

    const result = await acceptLegalDocuments(token, missingDocs);
    setSubmitting(false);

    if (result.ok) {
      clearMissingDocVersions();
      const user = getStoredUser();
      if (user?.role === "PROFESSIONAL") {
        router.push("/dashboard/professor");
      } else if (user?.role === "STUDENT") {
        router.push("/dashboard/aluno");
      } else {
        router.push("/dashboard");
      }
      return;
    }

    if (result.kind === "unauthorized") {
      setError("Sessão expirada. Por favor, faça login novamente.");
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    if (result.kind === "network") {
      setError(result.message);
      return;
    }

    setError("Não foi possível aceitar os documentos. Tente novamente.");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">beOrigo</h1>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">
            Aceite de Documentos Legais
          </h2>
          <p className="text-slate-600">
            Para continuar, você precisa aceitar os seguintes documentos:
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="space-y-3">
            {missingDocs.map((docId) => {
              const docInfo = getDocInfo(docId);
              return (
                <div
                  key={docId}
                  className="flex items-start space-x-3 rounded-lg border border-slate-200 p-4"
                >
                  <input
                    type="checkbox"
                    id={`doc-${docId}`}
                    checked={accepted[docId] || false}
                    onChange={(e) => {
                      setAccepted((prev) => ({
                        ...prev,
                        [docId]: e.target.checked,
                      }));
                    }}
                    disabled={submitting}
                    className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
                  />
                  <label
                    htmlFor={`doc-${docId}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <span className="text-slate-900">
                      Li e aceito{" "}
                      {docInfo.url !== "#" ? (
                        <Link
                          href={docInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-teal-700 underline hover:text-teal-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {docInfo.label}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-700">
                          {docInfo.label}
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!allAccepted || submitting}
              className="w-full rounded-lg bg-teal-600 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {submitting ? "Processando..." : "Aceitar e Continuar"}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-600">
            Nota: Cookies e termos de DPA não são bloqueadores de login.
          </p>
        </div>
      </div>
    </div>
  );
}
