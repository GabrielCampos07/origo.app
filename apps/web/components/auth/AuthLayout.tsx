type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/40 to-slate-100 px-4 py-10">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Origo</p>
          {title ? <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
