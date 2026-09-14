"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

function FlowerPetal({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <circle cx="14" cy="14" r="3.2" fill="#f5f5f0" />
      <ellipse cx="14" cy="6.5" rx="3.4" ry="5.2" fill="#c7dbcc" opacity="0.95" />
      <ellipse cx="14" cy="21.5" rx="3.4" ry="5.2" fill="#a8c4b3" opacity="0.95" />
      <ellipse cx="6.5" cy="14" rx="5.2" ry="3.4" fill="#7da890" opacity="0.9" />
      <ellipse cx="21.5" cy="14" rx="5.2" ry="3.4" fill="#598c6b" opacity="0.9" />
    </svg>
  );
}

function LeafAccent({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 18C4 10 10 3 19 3C19 12 13 18 4 18Z"
        fill="#e5f0e8"
        stroke="#7da890"
        strokeWidth="1.2"
      />
      <path d="M7 15C10 12 14 8 18 5" stroke="#598c6b" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

type DividerSurface = "cream" | "white" | "sage" | "mist";

function SectionDivider({
  tone = "soft",
  surface = "cream",
}: {
  tone?: "soft" | "deep";
  surface?: DividerSurface;
}) {
  const line =
    tone === "deep"
      ? "from-transparent via-[#598c6b]/50 to-transparent"
      : "from-transparent via-[#7da890]/45 to-transparent";

  const pill =
    surface === "white"
      ? "bg-white border-[#c7dbcc]/70 shadow-[0_4px_14px_-4px_rgba(46,56,51,0.14)]"
      : surface === "sage"
        ? "bg-[#e5f0e8] border-[#598c6b]/30 shadow-[0_4px_14px_-4px_rgba(46,56,51,0.12)]"
        : surface === "mist"
          ? "bg-[#f0f5ed] border-[#a8c4b3]/60 shadow-[0_4px_14px_-4px_rgba(46,56,51,0.12)]"
          : "bg-[#f5f5f0] border-[#c7dbcc]/55 shadow-[0_4px_14px_-4px_rgba(46,56,51,0.12)]";

  return (
    <div
      className="section-divider relative z-10 flex items-center justify-center py-5 px-6 md:px-20 -my-1"
      aria-hidden
    >
      <div className={`absolute inset-x-6 md:inset-x-24 top-1/2 h-px bg-gradient-to-r ${line}`} />
      <svg
        className="absolute left-[10%] md:left-[16%] top-1/2 -translate-y-1/2 w-20 h-10 opacity-60"
        viewBox="0 0 80 40"
        fill="none"
      >
        <path
          d="M2 28C18 22 28 12 40 10C52 8 64 14 78 22"
          stroke="#7da890"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <ellipse cx="26" cy="16" rx="3.2" ry="5" fill="#c7dbcc" transform="rotate(-28 26 16)" />
        <ellipse cx="34" cy="12" rx="2.6" ry="4.2" fill="#a8c4b3" transform="rotate(-18 34 12)" />
      </svg>
      <svg
        className="absolute right-[10%] md:right-[16%] top-1/2 -translate-y-1/2 w-20 h-10 opacity-60 scale-x-[-1]"
        viewBox="0 0 80 40"
        fill="none"
      >
        <path
          d="M2 28C18 22 28 12 40 10C52 8 64 14 78 22"
          stroke="#7da890"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <ellipse cx="26" cy="16" rx="3.2" ry="5" fill="#a8c4b3" transform="rotate(-28 26 16)" />
        <ellipse cx="34" cy="12" rx="2.6" ry="4.2" fill="#598c6b" transform="rotate(-18 34 12)" />
      </svg>
      <div className={`relative z-10 flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-[2px] ${pill}`}>
        <LeafAccent className="w-5 h-5 rotate-[-25deg] opacity-85" />
        <FlowerPetal className="w-7 h-7" />
        <LeafAccent className="w-5 h-5 rotate-[25deg] scale-x-[-1] opacity-85" />
      </div>
    </div>
  );
}

function BloomDecor({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const scale =
    size === "lg" ? "w-10 h-10" : size === "md" ? "w-8 h-8" : "w-6 h-6";
  const leaf =
    size === "lg" ? "w-8 h-8" : size === "md" ? "w-6 h-6" : "w-5 h-5";
  const offset =
    size === "lg"
      ? {
          tl: "-top-4 -left-3",
          bl: "-bottom-3 -left-4",
          tr: "-top-3 -right-4",
          br: "-bottom-4 -right-3",
          ml: "top-1/2 -left-6 -translate-y-1/2",
          mr: "top-1/2 -right-6 -translate-y-1/2",
        }
      : size === "md"
        ? {
            tl: "-top-3 -left-2",
            bl: "-bottom-2 -left-3",
            tr: "-top-2 -right-3",
            br: "-bottom-3 -right-2",
            ml: "top-1/2 -left-5 -translate-y-1/2",
            mr: "top-1/2 -right-5 -translate-y-1/2",
          }
        : {
            tl: "-top-2.5 -left-1.5",
            bl: "-bottom-1.5 -left-2.5",
            tr: "-top-1.5 -right-2.5",
            br: "-bottom-2.5 -right-1.5",
            ml: "top-1/2 -left-4 -translate-y-1/2",
            mr: "top-1/2 -right-4 -translate-y-1/2",
          };

  return (
    <>
      <FlowerPetal className={`cta-flower__bloom absolute ${offset.tl} ${scale} opacity-0 scale-50 transition-all duration-500 delay-0 group-hover:opacity-100 group-hover:scale-100`} />
      <LeafAccent className={`cta-flower__bloom absolute ${offset.bl} ${leaf} opacity-0 scale-50 transition-all duration-500 delay-75 group-hover:opacity-100 group-hover:scale-100`} />
      <FlowerPetal className={`cta-flower__bloom absolute ${offset.tr} ${scale} opacity-0 scale-50 transition-all duration-500 delay-100 group-hover:opacity-100 group-hover:scale-100`} />
      <LeafAccent className={`cta-flower__bloom absolute ${offset.br} ${leaf} opacity-0 scale-50 transition-all duration-500 delay-150 group-hover:opacity-100 group-hover:scale-100`} />
      <FlowerPetal className={`cta-flower__bloom absolute ${offset.ml} ${scale} opacity-0 scale-50 transition-all duration-500 delay-50 group-hover:opacity-100 group-hover:scale-100`} />
      <LeafAccent className={`cta-flower__bloom absolute ${offset.mr} ${leaf} opacity-0 scale-50 transition-all duration-500 delay-125 group-hover:opacity-100 group-hover:scale-100`} />
    </>
  );
}

function FlowerButton({
  href,
  children,
  className = "",
  size = "sm",
  asButton,
  disabled,
  onClick,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  asButton?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base =
    "cta-flower group relative inline-flex items-center justify-center overflow-visible cursor-pointer bg-[var(--brand-primary)] text-white font-medium tracking-[0.2px] rounded-xl transition-colors duration-500 hover:bg-[var(--color-green-600)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--brand-primary)]";

  const content = (
    <>
      {!disabled && <BloomDecor size={size} />}
      <span className="relative z-10">{children}</span>
    </>
  );

  if (asButton) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`${base} ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <a href={href} className={`${base} ${className}`}>
      {content}
    </a>
  );
}

function ComoFuncionaSteps() {
  const steps = [
    {
      n: "01",
      title: "Prescreve",
      body: "Profissional cria programa HEP com sessões e exercícios no app — prescrição clara.",
    },
    {
      n: "02",
      title: "Executa e reporta",
      body: "Aluno acessa HEP, sabe o que fazer hoje, completa sessão e reporta dor e observações.",
    },
    {
      n: "03",
      title: "Vê adesão e ajusta",
      body: "Profissional acompanha adesão em tempo real, registra evolução leve e ajusta programa.",
    },
  ] as const;

  const [active, setActive] = useState(1);
  const progress = ((active - 1) / (steps.length - 1)) * 100;

  return (
    <div className="steps-flow relative w-full pt-4">
      <div className="hidden md:block absolute top-[5.75rem] left-[16.5%] right-[16.5%] h-1.5 rounded-full bg-[#d1e5d9] z-0 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#598c6b] via-[#7da890] to-[#a8c4b3] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="md:hidden absolute left-[2.65rem] top-20 bottom-12 w-1.5 rounded-full bg-[#d1e5d9] z-0 overflow-hidden">
        <div
          className="w-full rounded-full bg-gradient-to-b from-[#598c6b] via-[#7da890] to-[#a8c4b3] transition-[height] duration-300 ease-out"
          style={{ height: `${progress}%` }}
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 w-full items-stretch">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isDone = active > stepNum;
          const isCurrent = active === stepNum;
          const isUpcoming = active < stepNum;

          const badgeLabel = isDone ? "Concluído" : isCurrent ? "Etapa atual" : "Próximo";
          const badgeClass = isDone
            ? "bg-[#598c6b] text-white border-[#598c6b]"
            : isCurrent
              ? "bg-white text-[var(--brand-primary)] border-[#598c6b]"
              : "bg-[#f5f5f0] text-[var(--color-ink-500)] border-[#c7dbcc]";

          return (
            <button
              key={step.n}
              type="button"
              onMouseEnter={() => setActive(stepNum)}
              onFocus={() => setActive(stepNum)}
              onClick={() => setActive(stepNum)}
              aria-current={isCurrent ? "step" : undefined}
              className={[
                "cta-flower group relative cursor-pointer text-left rounded-2xl px-7 pt-10 pb-7 md:px-8 md:pt-11 md:pb-8 flex flex-col gap-4",
                "min-h-[260px] overflow-visible transition-[border-color,box-shadow,background-color] duration-300 ease-out border-[1.5px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#598c6b]/40",
                isCurrent
                  ? "bg-white border-[#598c6b] shadow-[0px_18px_36px_-6px_rgba(46,56,51,0.16)] z-[2]"
                  : isDone
                    ? "bg-[#e5f0e8]/80 border-[#7da890] shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.08)]"
                    : "bg-white/80 border-[#c7dbcc] opacity-85 shadow-[0px_8px_18px_-4px_rgba(46,56,51,0.06)]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2",
                  "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1",
                  "text-[10px] font-semibold uppercase tracking-[0.12em] shadow-sm",
                  "transition-colors duration-300",
                  badgeClass,
                ].join(" ")}
              >
                {badgeLabel}
              </span>

              {isCurrent && <BloomDecor size="lg" />}

              <div
                className={[
                  "relative z-10 font-bold text-xl md:text-2xl w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300",
                  isDone
                    ? "bg-[#598c6b] text-white"
                    : isCurrent
                      ? "bg-[var(--brand-primary)] text-white shadow-[0_8px_20px_-4px_rgba(89,140,107,0.45)]"
                      : "bg-[#d1e5d9] text-[#5c6660]",
                ].join(" ")}
              >
                {isDone ? (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                    <path
                      d="M5 11.5L9.2 15.5L17 6.5"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.n
                )}
              </div>

              <h3
                className={[
                  "relative z-10 font-semibold text-xl transition-colors",
                  isUpcoming ? "text-[var(--color-ink-600)]" : "text-[var(--color-ink-900)]",
                ].join(" ")}
              >
                {step.title}
              </h3>
              <p
                className={[
                  "relative z-10 font-normal text-base transition-colors",
                  isCurrent ? "text-[var(--color-ink-700)]" : "text-[var(--color-ink-600)]",
                ].join(" ")}
              >
                {step.body}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const headerOffset = 88;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top, behavior: "smooth" });
    el.classList.add("section-pulse");
    window.setTimeout(() => el.classList.remove("section-pulse"), 900);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[var(--color-green-50)]">
      <header className="sticky top-0 z-30 bg-[var(--color-green-50)]/95 backdrop-blur-md border-b border-[#d1e5d9]/40">
        <div className="flex items-center justify-between px-5 md:px-20 py-3 md:py-5 gap-4">
          <Link href="/home" className="relative h-11 w-[160px] sm:h-14 sm:w-[200px] md:h-16 md:w-[260px] shrink-0 cursor-pointer">
            <Image
              src="/assets/logo-lockup.png"
              alt="beOrigo"
              fill
              className="object-contain object-left"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <button
              type="button"
              onClick={() => scrollToId("como-funciona")}
              className="nav-link cursor-pointer text-sm font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)] transition-colors"
            >
              Como funciona
            </button>
            <button
              type="button"
              onClick={() => scrollToId("para-quem")}
              className="nav-link cursor-pointer text-sm font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)] transition-colors"
            >
              Para quem
            </button>
            <button
              type="button"
              onClick={() => scrollToId("planos")}
              className="nav-link cursor-pointer text-sm font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)] transition-colors"
            >
              Planos
            </button>
            <FlowerButton
              href="/cadastro/profissional"
              className="text-base px-5 py-3.5 h-[52px]"
            >
              Para profissionais 1:1
            </FlowerButton>
          </nav>

          <button
            type="button"
            className="md:hidden relative z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#c7dbcc] bg-white text-[var(--color-ink-900)]"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? "Fechar" : "Menu"}</span>
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-transform duration-300 ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 rounded bg-current transition-opacity duration-200 ${menuOpen ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 top-[14px] h-0.5 w-5 rounded bg-current transition-transform duration-300 ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
            menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-1 px-5 pb-5 pt-1 border-t border-[#d1e5d9]/50 bg-[var(--color-green-50)]">
            <button
              type="button"
              onClick={() => scrollToId("como-funciona")}
              className="nav-link cursor-pointer text-left rounded-xl px-4 py-3.5 text-base font-medium text-[var(--color-ink-800)] hover:bg-[#e5f0e8] transition-colors"
            >
              Como funciona
            </button>
            <button
              type="button"
              onClick={() => scrollToId("para-quem")}
              className="nav-link cursor-pointer text-left rounded-xl px-4 py-3.5 text-base font-medium text-[var(--color-ink-800)] hover:bg-[#e5f0e8] transition-colors"
            >
              Para quem
            </button>
            <button
              type="button"
              onClick={() => scrollToId("planos")}
              className="nav-link cursor-pointer text-left rounded-xl px-4 py-3.5 text-base font-medium text-[var(--color-ink-800)] hover:bg-[#e5f0e8] transition-colors"
            >
              Planos
            </button>
            <FlowerButton
              href="/cadastro/profissional"
              className="mt-2 w-full text-base px-5 py-3.5 h-[52px]"
            >
              Para profissionais 1:1
            </FlowerButton>
          </nav>
        </div>
      </header>

      {/* Hero — vídeo como fundo */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 md:px-20 py-24 overflow-hidden">
        <video
          src="/assets/brand-film.mp4"
          poster="/assets/brand-film-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#f5f5f0]/88 via-[#f0f5ed]/78 to-[#e5f0e8]/90"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(245,245,240,0.35)_70%)]"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center gap-8 max-w-3xl text-center">
          <div className="relative w-[min(280px,70vw)] h-[70px] drop-shadow-sm">
            <Image
              src="/assets/logo-lockup.png"
              alt="beOrigo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="font-semibold text-[26px] md:text-[32px] text-[#2e3833] leading-[1.35]">
            Prescrição clara. Adesão visível. Continuidade entre consultas.
          </h1>

          <p className="font-normal text-base md:text-lg text-[#3d4740] max-w-2xl leading-relaxed">
            O profissional monta o HEP; o aluno sabe o que fazer hoje e reporta; o pro vê adesão e registra evolução mínima — continuidade humana e precisa.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <FlowerButton
              href="/cadastro/profissional"
              className="text-base px-5 py-3.5 h-[52px]"
            >
              Para profissionais 1:1
            </FlowerButton>
            <Link
              href="/login"
              className="cta-flower group relative inline-flex items-center justify-center overflow-visible cursor-pointer bg-white/90 border border-[var(--border-default)] text-[var(--fg-primary)] font-medium text-base px-5 py-3.5 rounded-xl h-[52px] tracking-[0.2px] hover:bg-white transition-colors"
            >
              <BloomDecor size="sm" />
              <span className="relative z-10">Sou aluno</span>
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider tone="deep" surface="white" />

      <section className="bg-white px-6 md:px-20 py-20 flex flex-col gap-6">
        <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal">
          Entre consultas, a adesão some
        </h2>
        <div className="font-normal text-lg text-[var(--color-ink-600)] space-y-2">
          <p>• O PDF some no WhatsApp</p>
          <p>• Apps genéricos não mostram se o aluno fez</p>
          <p>• Planilha sem registro clínico leve</p>
        </div>
      </section>

      <SectionDivider surface="cream" />

      <section className="bg-gradient-to-b from-[#e5f0e8] to-[#f5f5f0] px-6 md:px-20 py-20 flex flex-col gap-6">
        <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal">
          Continuidade humana e precisa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          <div className="relative bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-7 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-3 min-h-[200px]">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)]">HEP do aluno</h3>
            <p className="font-normal text-sm text-[var(--color-ink-600)]">
              Programa, sessão, dor e progresso — claro o que fazer hoje.
            </p>
          </div>

          <div className="relative bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-7 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-3 min-h-[200px]">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)]">Adesão visível</h3>
            <p className="font-normal text-sm text-[var(--color-ink-600)]">
              Aluno reporta sessão feita (dor, observações) — você vê em tempo real.
            </p>
          </div>

          <div className="relative bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-7 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-3 min-h-[200px]">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)]">Chart e nota leves</h3>
            <p className="font-normal text-sm text-[var(--color-ink-600)]">
              Registro clínico mínimo sem planilha — sessão e progresso salvos.
            </p>
          </div>
        </div>
      </section>

      <SectionDivider tone="deep" surface="white" />

      <section id="como-funciona" className="bg-[var(--color-green-50)] px-6 md:px-20 py-20 flex flex-col gap-10 scroll-mt-24">
        <div className="max-w-2xl">
          <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal mb-2">
            Como funciona
          </h2>
          <p className="text-[var(--color-ink-600)] text-base">
            Três etapas em sequência — passe o mouse ou toque para ver o progresso.
          </p>
        </div>
        <ComoFuncionaSteps />
        
        <div className="relative min-h-[320px] md:min-h-[400px] rounded-[24px] overflow-hidden border border-[#d1e5d9] shadow-[0px_16px_40px_-4px_rgba(46,56,51,0.1)] mt-6">
          <Image
            src="/assets/hero-image-2.png"
            alt="Visão do profissional no beOrigo"
            fill
            className="object-contain p-8"
          />
        </div>
      </section>

      <SectionDivider surface="white" />

      <section id="para-quem" className="bg-white px-6 md:px-20 py-20 flex flex-col gap-8 scroll-mt-24">
        <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal">
          Para quem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="bg-[#e5f0e8] border-[1.5px] border-[#c7dbcc] rounded-2xl p-8 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-4">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-xl text-[var(--color-ink-900)]">Profissional 1:1</h3>
            <p className="font-normal text-base text-[var(--color-ink-600)] leading-relaxed">
              Fisioterapeutas, personal trainers e profissionais de saúde que prescrevem HEP e acompanham adesão na relação 1:1 com seus alunos ou pacientes.
            </p>
          </div>
          <div className="bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-8 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-4">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-xl text-[var(--color-ink-900)]">Aluno</h3>
            <p className="font-normal text-base text-[var(--color-ink-600)] leading-relaxed">
              Pacientes e alunos que recebem programa HEP do profissional, executam em casa e reportam progresso e dor — continuidade clara.
            </p>
          </div>
        </div>
      </section>

      <SectionDivider tone="deep" surface="sage" />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#e5f0e8] to-[#f5f5f0] px-6 md:px-20 py-20 flex flex-col gap-10">
        <div
          className="absolute inset-0 pointer-events-none select-none bg-[url('/assets/card-frame-leaves.png')] bg-center bg-[length:100%_100%] opacity-40 mix-blend-multiply"
          aria-hidden
        />
        <div className="relative z-10 text-center">
          <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal mb-2">
            Planos
          </h2>
          <p className="font-normal text-lg text-[var(--color-ink-600)]">
            Escolha o plano que se encaixa no seu atendimento. Trial de 14 dias · Desconto de <strong>−20% anual</strong> disponível.
          </p>
        </div>

        <div id="planos" className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto scroll-mt-28">
          <div className="plan-frame bg-white border border-[#d1e5d9] rounded-2xl p-8 flex flex-col gap-6 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)]">
            <div>
              <h3 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-2">Start</h3>
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-4xl text-[var(--color-ink-900)]">R$ 49</span>
                  <span className="font-normal text-base text-[var(--color-ink-600)]">/mês</span>
                </div>
                <div className="mt-1 text-sm text-[var(--color-ink-600)]">
                  ou <strong className="text-[var(--color-ink-900)]">R$ 470,40</strong>/ano
                </div>
              </div>
              <p className="font-normal text-sm text-[var(--color-ink-600)]">Para quem está começando</p>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-[var(--color-ink-600)] flex-1">
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Até 15 alunos ativos</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>HEP ilimitado</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Relatório de adesão</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Registro clínico mínimo</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Trial 14 dias</span></li>
            </ul>
            <div className="mt-auto flex flex-col gap-2">
              <p className="text-xs text-center text-[var(--color-ink-500)]">Trial de 14 dias</p>
              <FlowerButton
                asButton
                className="w-full text-base px-5 py-3.5"
                onClick={() => {
                  window.location.href = "/checkout?plan=start";
                }}
              >
                Assinar Start
              </FlowerButton>
            </div>
          </div>

          <div className="plan-frame plan-frame--featured bg-white border-2 border-[var(--brand-primary)] rounded-2xl p-8 flex flex-col gap-6 shadow-[0px_16px_40px_-4px_rgba(46,56,51,0.15)] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--brand-primary)] text-white text-xs font-semibold px-4 py-1 rounded-full z-20">
              Mais popular
            </div>
            <div>
              <h3 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-2">Pro</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-4xl text-[var(--color-ink-900)]">R$ 79</span>
                <span className="font-normal text-base text-[var(--color-ink-600)]">/mês</span>
              </div>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">ou R$ 758,40/ano (−20%)</p>
              <p className="font-normal text-sm text-[var(--color-ink-600)]">Para atendimento consolidado</p>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-[var(--color-ink-600)] flex-1">
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Alunos ilimitados</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>HEP ilimitado</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Relatório de adesão avançado</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Registro clínico leve / mínimo</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Suporte prioritário</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Trial 14 dias</span></li>
            </ul>
            <FlowerButton
              asButton
              className="w-full text-base px-5 py-3.5 mt-auto"
              onClick={() => {
                window.location.href = "/checkout?plan=pro";
              }}
            >
              Assinar Pro
            </FlowerButton>
          </div>

          <div className="plan-frame bg-white border border-[#d1e5d9] rounded-2xl p-8 flex flex-col gap-6 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)]">
            <div>
              <h3 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-2">Clinic</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-4xl text-[var(--color-ink-900)]">R$ 149</span>
                <span className="font-normal text-base text-[var(--color-ink-600)]">/mês</span>
              </div>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">ou R$ 1.430,40/ano (−20%)</p>
              <p className="font-normal text-sm text-[var(--color-ink-600)]">Para equipes e clínicas</p>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-[var(--color-ink-600)] flex-1">
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Até 3 seats (profissionais)</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Alunos ilimitados</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Dashboard de gestão</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Suporte dedicado</span></li>
              <li className="flex items-start gap-2"><span className="text-[var(--brand-primary)] mt-0.5">✓</span><span>Trial 14 dias</span></li>
            </ul>
            <FlowerButton
              asButton
              className="w-full text-base px-5 py-3.5 mt-auto"
              onClick={() => {
                window.location.href = "/checkout?plan=clinic";
              }}
            >
              Assinar Clinic
            </FlowerButton>
          </div>
        </div>

        <div className="relative z-10 flex justify-center mt-6">
          <div className="relative w-[min(400px,90vw)] h-[200px]">
            <Image
              src="/assets/pricing-illustration-1.png"
              alt=""
              fill
              className="object-contain"
              aria-hidden
            />
          </div>
        </div>

        {/* Programa de indicação (Referral card) */}
        <div className="relative z-10 mt-12 bg-gradient-to-br from-[#e5f0e8] to-[#f0f5ed] border-2 border-[var(--brand-primary)]/40 rounded-2xl p-8 md:p-10 max-w-4xl mx-auto overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 md:w-64 md:h-64 opacity-40">
            <Image
              src="/assets/referral-illustration-1.png"
              alt=""
              fill
              className="object-contain"
              aria-hidden
            />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                <LeafAccent className="w-3 h-3" />
                Programa de indicação
              </div>
              
              <h3 className="text-2xl md:text-3xl font-semibold text-[var(--color-ink-900)] mb-3">
                Indique e ganhe
              </h3>
              
              <p className="text-base text-[var(--color-ink-700)] mb-4 max-w-lg">
                Compartilhe o beOrigo com outros profissionais e receba <strong>15% de comissão recorrente</strong> enquanto 
                a assinatura estiver ativa. Seu indicado ganha <strong>1 mês grátis</strong>.
              </p>
              
              <ul className="text-sm text-[var(--color-ink-600)] space-y-2 mb-6 text-left max-w-md mx-auto md:mx-0">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                  <span>15% recorrente após período gratuito</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                  <span>1 mês grátis para o indicado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                  <span>Zero comissão durante período gratuito</span>
                </li>
              </ul>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href="/dashboard/professor/indicacao"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-medium hover:bg-[var(--color-green-600)] transition-all duration-200 hover:shadow-[0_6px_16px_-2px_rgba(89,140,107,0.35)]"
                >
                  Pegar meu link
                </a>
                <a
                  href="/termos-saas#indicacao"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white border border-[var(--brand-primary)] text-[var(--brand-primary)] font-medium hover:bg-[#e5f0e8] transition-all duration-200 hover:border-[var(--color-green-600)]"
                >
                  Saiba como indicar
                </a>
              </div>
              
              <p className="text-xs text-[var(--color-ink-500)] mt-4">
                Programa exclusivo para plano Professional.{" "}
                <Link href="/termos-saas" className="underline hover:text-[var(--brand-primary)]">
                  Ver termos completos
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-[#f0f5ed]/90 border border-[#d1e5d9] rounded-xl p-6 text-center max-w-4xl mx-auto">
          <p className="text-sm text-[var(--color-ink-600)] leading-relaxed">
            <strong>Aviso:</strong> O beOrigo é uma ferramenta de gestão e comunicação para profissionais de saúde.
            Não substitui consulta, diagnóstico ou tratamento médico. Sempre consulte um profissional qualificado.
          </p>
        </div>
      </section>

      <SectionDivider surface="white" />

      <section className="relative overflow-hidden px-6 md:px-20 py-28 flex flex-col items-center gap-8">
        <Image
          src="/assets/hero-image-1.png"
          alt=""
          fill
          className="object-cover object-center pointer-events-none select-none"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#f5f5f0]/78" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#e5f0e8]/70 via-[#f0f5ed]/55 to-[#f5f5f0]/85"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-primary)] bg-white/70 border border-[#c7dbcc] rounded-full px-4 py-1.5">
            <LeafAccent className="w-4 h-4" />
            Continuidade 1:1
          </div>
          <h2 className="font-semibold text-[40px] md:text-[44px] text-[var(--color-ink-900)] leading-tight">
            Começo claro. Progresso contínuo.
          </h2>
          <p className="font-normal text-lg text-[var(--color-ink-600)] max-w-2xl leading-relaxed">
            Agende uma conversa com nosso time e veja como o beOrigo transforma a relação profissional-aluno através de HEP estruturado, adesão visível e registro leve.
          </p>
          <FlowerButton
            href="/cadastro/profissional"
            size="md"
            className="text-lg px-8 py-4"
          >
            Falar com consultor 1:1
          </FlowerButton>
        </div>
      </section>

      <footer className="relative overflow-hidden bg-[#2e3833] px-6 md:px-20 py-12 text-white">
        <Image
          src="/assets/footer-forest.png"
          alt=""
          fill
          className="object-cover opacity-[0.16] pointer-events-none select-none"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#2e3833]/55 pointer-events-none" aria-hidden />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto text-center">
          <Link href="/home" className="relative h-11 w-[200px] cursor-pointer">
            <Image
              src="/assets/logo-lockup.png"
              alt="beOrigo"
              fill
              className="object-contain"
            />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/70">
            <Link href="/privacidade" className="hover:text-white transition-colors">
              Privacidade
            </Link>
            <span className="opacity-50">·</span>
            <Link href="/termos" className="hover:text-white transition-colors">
              Termos
            </Link>
            <span className="opacity-50">·</span>
            <Link href="/cookies" className="hover:text-white transition-colors">
              Cookies
            </Link>
            <span className="opacity-50">·</span>
            <Link href="/dpa" className="hover:text-white transition-colors">
              DPA
            </Link>
            <span className="opacity-50">·</span>
            <a href="mailto:contact@beorigo.app" className="hover:text-white transition-colors">
              contact@beorigo.app
            </a>
          </div>

          <div className="flex gap-4 items-center mt-2">
            <a
              href="https://instagram.com/beorigo"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Instagram"
            >
              <Image src="/assets/social-icon-1.svg" alt="Instagram" width={24} height={24} />
            </a>
            <a
              href="https://linkedin.com/company/beorigo"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="LinkedIn"
            >
              <Image src="/assets/social-icon-2.svg" alt="LinkedIn" width={24} height={24} />
            </a>
          </div>

          <p className="text-sm text-white/50 mt-4">
            © 2026 beOrigo. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
