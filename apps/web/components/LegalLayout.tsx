import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface LegalLayoutProps {
  children: ReactNode;
  version: string;
  title: string;
}

export function LegalLayout({ children, version, title }: LegalLayoutProps) {
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
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)] transition-colors px-4 py-2 rounded-lg hover:bg-[#e5f0e8]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-60">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar para Home
          </Link>
        </div>
      </header>

      <main className="px-5 md:px-20 py-12 md:py-16">
        <article className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-[#d1e5d9] shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] p-8 md:p-12">
            <div className="mb-8 pb-6 border-b border-[#d1e5d9]">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-[#e5f0e8] border border-[#c7dbcc] rounded-full text-xs font-mono text-[var(--color-ink-700)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-70">
                  <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {version}
              </div>
              <h1 className="font-semibold text-3xl md:text-4xl text-[var(--color-ink-900)] mb-2">
                {title}
              </h1>
              <p className="text-sm text-[var(--color-ink-600)]">
                Controlador: GCP INOVACOES TECNOLOGIA LTDA · CNPJ 54.639.529/0001-89
              </p>
            </div>

            <div className="prose prose-legal max-w-none">
              {children}
            </div>
          </div>
        </article>
      </main>

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
