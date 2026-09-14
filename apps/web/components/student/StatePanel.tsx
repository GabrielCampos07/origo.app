import { Alert } from "@/components/auth/Alert";

export function LoadingPanel({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="rounded-lg bg-white p-8 text-center text-slate-600 shadow-sm">{label}</div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-3">
      <Alert variant="error">{message}</Alert>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-slate-600">{body}</p>
    </div>
  );
}
