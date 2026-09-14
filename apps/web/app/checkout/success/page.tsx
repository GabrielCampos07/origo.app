import { Suspense } from "react";
import CheckoutSuccessContent from "./CheckoutSuccessContent";

export const dynamic = "force-dynamic";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-green-50)]">
          <div className="text-[var(--color-ink-600)]">Carregando...</div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
