import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  /** Accessible label for screen readers */
  label?: string;
};

/** Pulse block — slate/teal-friendly, matches dashboard surfaces. */
export function Skeleton({ className = "", style, label = "Carregando" }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      style={style}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Carregando">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
          label=""
        />
      ))}
    </div>
  );
}

/** Full-page shell used while auth or primary HEP data loads. */
export function PageSkeleton({
  variant = "card",
}: {
  variant?: "card" | "dashboard" | "list" | "detail" | "session";
}) {
  if (variant === "dashboard") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="mb-2 h-7 w-56" />
          <Skeleton className="mb-8 h-4 w-72" />
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-4">
                <Skeleton className="mb-3 h-3 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-6">
                <Skeleton className="mb-3 h-12 w-12 rounded-full" />
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-1" role="status" aria-label="Carregando lista">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="space-y-6" role="status" aria-label="Carregando ficha">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-100 p-4">
              <Skeleton className="mb-3 h-3 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-2 h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-100 p-4">
          <Skeleton className="mb-3 h-5 w-36" />
          <Skeleton className="mb-2 h-4 w-64" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "session") {
    return (
      <div className="space-y-6" role="status" aria-label="Carregando sessão">
        <div className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
          <Skeleton className="mb-2 h-7 w-40" />
          <Skeleton className="mb-6 h-4 w-64" />
          <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto h-11 w-48 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // card (default) — student shell content
  return (
    <div className="space-y-6" role="status" aria-label="Carregando">
      <div className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="mb-4 h-4 w-72 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="mb-1 h-6 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-100 bg-white p-8 shadow-sm">
        <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto mb-2 h-6 w-40" />
        <Skeleton className="mx-auto mb-6 h-4 w-56" />
        <Skeleton className="mx-auto h-11 w-44 rounded-lg" />
      </div>
    </div>
  );
}

/** Auth-gate full screen for ProShell / StudentShell. */
export function ShellSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 flex-1 rounded-md" />
            ))}
          </div>
        </div>
        <PageSkeleton variant="card" />
      </div>
    </div>
  );
}
