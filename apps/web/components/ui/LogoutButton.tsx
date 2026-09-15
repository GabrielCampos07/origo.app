"use client";

type Props = {
  email?: string | null;
  onLogout: () => void;
  className?: string;
};

export function LogoutButton({ email, onLogout, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {email ? <span className="text-sm text-slate-600">{email}</span> : null}
      <button
        type="button"
        onClick={onLogout}
        aria-label="Sair"
        title="Sair"
        className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  );
}
