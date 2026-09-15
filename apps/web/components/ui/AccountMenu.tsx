"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { initialsFromUser, subscriptionStatusLabel } from "@/lib/plan-label";
import type { OrigoUser } from "@/lib/auth-storage";

type Props = {
  user: OrigoUser | null | undefined;
  onLogout: () => void;
  className?: string;
};

export function AccountMenu({ user, onLogout, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initials = initialsFromUser({ name: user?.name, email: user?.email });
  const planLabel = subscriptionStatusLabel(user?.subscriptionActive, user?.role);
  const isPro = user?.role === "PROFESSIONAL";

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        aria-label="Conta e configurações"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
      >
        {initials}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-900">
              {user?.name?.trim() || "Sua conta"}
            </p>
            {user?.email ? (
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            ) : null}
            {planLabel ? (
              <p className="mt-1 text-xs font-medium text-teal-800">{planLabel}</p>
            ) : null}
          </div>

          <Link
            href="/conta"
            role="menuitem"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Configurações
          </Link>

          {isPro ? (
            <Link
              href="/checkout"
              role="menuitem"
              className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Planos
            </Link>
          ) : null}

          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
