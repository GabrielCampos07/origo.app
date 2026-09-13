type AlertVariant = "error" | "success" | "warning" | "info";

const styles: Record<AlertVariant, string> = {
  error: "bg-red-50 text-red-800 border-red-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  info: "bg-sky-50 text-sky-900 border-sky-200",
};

type Props = {
  variant: AlertVariant;
  children: React.ReactNode;
  role?: "alert" | "status";
};

export function Alert({ variant, children, role = "alert" }: Props) {
  return (
    <div
      role={role}
      className={`rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${styles[variant]}`}
    >
      {children}
    </div>
  );
}
