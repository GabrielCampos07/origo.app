import { LegalLayout } from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies — beOrigo",
  description: "Política de Cookies do Site beOrigo",
};

export default function CookiesPage() {
  return (
    <LegalLayout version="cookies_v2_2026-09-13" title="Política de Cookies — Site beOrigo">
      <div className="space-y-8">
        <section>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Versão:</strong> <code className="text-sm bg-[#f5f5f0] px-2 py-0.5 rounded">cookies_v2_2026-09-13</code>
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Escopo:</strong> Site de apresentação beorigo.com
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Controlador:</strong> GCP INOVACOES TECNOLOGIA LTDA, CNPJ 54.639.529/0001-89
          </p>
          <p className="text-base text-[var(--color-ink-700)]">
            Para o <strong>app beorigo.app</strong>, consulte a <a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">O que são cookies</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um site. Eles permitem que o site reconheça seu dispositivo e lembre de suas preferências ou ações.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Nossa abordagem MVP: somente essenciais</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            No estágio atual (MVP), o site de apresentação <strong>beorigo.com</strong> utiliza <strong>apenas cookies essenciais</strong> necessários para o funcionamento básico do site.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Não utilizamos:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Cookies analíticos (Google Analytics, Hotjar, etc.)</li>
            <li>Cookies de marketing ou publicidade (Meta Pixel, Google Ads, etc.)</li>
            <li>Pixels de rastreamento de conversão</li>
            <li>Ferramentas de CMP (Consent Management Platform) ou banners de cookie</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Cookies essenciais</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Os cookies essenciais são necessários para o funcionamento básico do site e não requerem consentimento explícito. Exemplos incluem:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Cookies de sessão para manter você logado (quando aplicável)</li>
            <li>Cookies de preferências básicas (idioma, se implementado)</li>
            <li>Cookies de segurança para proteção contra fraudes</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Hospedagem e infraestrutura</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            O site é hospedado na <strong>Vercel</strong>. A Vercel pode coletar logs técnicos básicos para operação do serviço (veja a <a href="/dpa" className="text-[var(--brand-primary)] underline hover:no-underline">lista de subprocessadores DPA</a>).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Dados clínicos e checkout</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            O site de apresentação <strong>não coleta</strong> dados clínicos (dor VAS, notas clínicas, HEP). Esses dados ficam restritos ao <strong>app beorigo.app</strong> após login.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Preços públicos:</strong> O site de apresentação exibe planos e preços (Start, Pro, Clinic) conforme autorizado. Cookies de funil de checkout serão introduzidos somente quando necessário para processar transações, com aviso prévio e atualização desta política.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Como gerenciar cookies</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Você pode controlar e gerenciar cookies através das configurações do seu navegador. A maioria dos navegadores permite:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Ver quais cookies estão armazenados</li>
            <li>Bloquear todos ou alguns cookies</li>
            <li>Excluir cookies existentes</li>
            <li>Configurar preferências para sites específicos</li>
          </ul>
          <p className="text-sm text-[var(--color-ink-600)] mt-4 leading-relaxed">
            <strong>Atenção:</strong> Bloquear cookies essenciais pode impedir o funcionamento correto do site.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Links para instruções de navegadores</h2>
          <ul className="space-y-2 text-base text-[var(--color-ink-700)]">
            <li>
              <strong>Chrome:</strong>{" "}
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-primary)] underline hover:no-underline"
              >
                Como gerenciar cookies no Chrome
              </a>
            </li>
            <li>
              <strong>Firefox:</strong>{" "}
              <a
                href="https://support.mozilla.org/pt-BR/kb/gerencie-configuracoes-de-armazenamento-local-de-s"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-primary)] underline hover:no-underline"
              >
                Como gerenciar cookies no Firefox
              </a>
            </li>
            <li>
              <strong>Safari:</strong>{" "}
              <a
                href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-primary)] underline hover:no-underline"
              >
                Como gerenciar cookies no Safari
              </a>
            </li>
            <li>
              <strong>Edge:</strong>{" "}
              <a
                href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-primary)] underline hover:no-underline"
              >
                Como gerenciar cookies no Edge
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Atualizações desta política</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Quando implementarmos cookies analíticos ou de marketing no futuro, atualizaremos esta política e solicitaremos seu consentimento conforme exigido pela LGPD. A versão será incrementada (cookies_v3_…) e você será notificado.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Contato</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Dúvidas sobre nossa política de cookies?
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>E-mail:</strong> contact@beorigo.app
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Controlador:</strong><br />
            GCP INOVACOES TECNOLOGIA LTDA<br />
            CNPJ 54.639.529/0001-89<br />
            R ALM ALEXANDRINO 25 SALA 2 ANEXO 31 — VILA INVERNADA<br />
            SÃO PAULO/SP — CEP 03.350-010
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
