import { LegalLayout } from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos SaaS — beOrigo",
  description: "Termos de Serviço SaaS para Profissionais beOrigo",
};

export default function TermosSaaSPage() {
  return (
    <LegalLayout version="terms_saas_v2_2026-09-13" title="Termos SaaS — beOrigo PROFESSIONAL">
      <div className="space-y-8">
        <section>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Versão:</strong> <code className="text-sm bg-[#f5f5f0] px-2 py-0.5 rounded">terms_saas_v2_2026-09-13</code>
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Escopo:</strong> Termos de serviço SaaS para profissionais (PROFESSIONAL)
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Prestador:</strong> GCP INOVACOES TECNOLOGIA LTDA, CNPJ 54.639.529/0001-89, São Paulo/SP.
          </p>
          <p className="text-base text-[var(--color-ink-700)]">
            <strong>Contato:</strong> contact@beorigo.app
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Área autenticada — Profissional</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-4">
            Este documento contém os termos específicos do serviço SaaS para profissionais que utilizam o beOrigo. 
            O acesso completo aos detalhes contratuais, planos e condições comerciais está disponível na área autenticada do profissional após o login.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-4">
            Para os termos gerais de uso do aplicativo, consulte os <a href="/termos" className="text-[var(--brand-primary)] underline hover:no-underline">Termos de Uso</a>.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Para questões sobre privacidade, consulte nossa <a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Documentos relacionados</h2>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><a href="/termos" className="text-[var(--brand-primary)] underline hover:no-underline">Termos de Uso (gerais)</a></li>
            <li><a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a></li>
            <li><a href="/aviso-pagamentos" className="text-[var(--brand-primary)] underline hover:no-underline">Aviso de Pagamentos</a></li>
            <li><a href="/dpa" className="text-[var(--brand-primary)] underline hover:no-underline">Lista de Subprocessadores (DPA)</a></li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Foro e Contato</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Foro exclusivo:</strong> Comarca de São Paulo/SP, Brasil.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Contato:</strong> contact@beorigo.app
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
