"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ShellSkeleton } from "@/components/ui/Skeleton";
import { LogoutButton } from "@/components/ui/LogoutButton";
import {
  clearAuthSession,
  getAccessToken,
  getMissingDocVersions,
  getStoredUser,
  patchStoredUser,
  type OrigoUser,
} from "@/lib/auth-storage";
import { fetchStudentProgram } from "@/lib/hep";
import { roleLabels } from "@/lib/role-labels";

const NAV = [
  { href: "/dashboard/aluno", label: "Hoje" },
  { href: "/dashboard/aluno/programa", label: "Programa" },
  { href: "/dashboard/aluno/progresso", label: "Progresso" },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/aluno") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<OrigoUser | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const missingDocs = getMissingDocVersions();
    if (missingDocs && missingDocs.length > 0) {
      router.push("/legal/accept");
      return;
    }

    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/login");
      return;
    }

    // P2 SEC: fail-closed — student HEP is STUDENT-only
    if (storedUser.role !== "STUDENT") {
      router.push("/dashboard/professor");
      return;
    }

    setUser(storedUser);
    setLoading(false);

    // Enrich category from enrollment when missing (copy labels).
    if (!storedUser.category) {
      void fetchStudentProgram().then((result) => {
        if (!result.ok || !result.data?.category) return;
        const next = patchStoredUser({ category: result.data.category });
        if (next) setUser(next);
      });
    }
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  if (loading || !user) {
    return <ShellSkeleton />;
  }

  const labels = roleLabels(user.category);
  const inSession = pathname.startsWith("/dashboard/aluno/sessao");

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <header className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href="/dashboard/aluno" className="text-2xl font-bold text-slate-900">
                beOrigo
              </Link>
              <span className="mt-1 block w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                {labels.studentBadge}
              </span>
            </div>
            <div className="flex flex-col items-end gap-2">
              <LogoutButton email={user.email} onLogout={handleLogout} />
            </div>
          </div>

          <nav className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1" aria-label={`Área do ${labels.studentSingular}`}>
            {NAV.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
                    active
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {inSession ? (
            <p className="mt-3 text-center text-xs font-medium text-teal-800">Sessão em andamento</p>
          ) : null}
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
