import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="mb-6 text-center">
        <Link
          href="/login"
          className="inline-block text-lg font-bold tracking-tight text-teal-800"
        >
          Origo
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
