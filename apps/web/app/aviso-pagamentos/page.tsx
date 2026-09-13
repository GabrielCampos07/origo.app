import { LegalLayout } from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Pagamentos — beOrigo",
  description: "Aviso sobre Processamento de Pagamentos beOrigo",
};

export default function AvisoPagamentosPage() {
  return (
    <LegalLayout version="payments_notice_v2_2026-09-13" title="Aviso de Pagamentos — beOrigo">
      <div className="space-y-8">
        <section>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Versão:</strong> <code className="text-sm bg-[#f5f5f0] px-2 py-0.5 rounded">payments_notice_v2_2026-09-13</code>
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Escopo:</strong> Informações sobre processamento de pagamentos para profissionais
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Área autenticada — Profissional</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-4">
            Este documento contém informações sobre o processamento de pagamentos para profissionais que utilizam o beOrigo. 
            Os detalhes completos sobre cobrança, formas de pagamento e condições comerciais estão disponíveis na área autenticada do profissional após o login.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Informações gerais</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Os pagamentos do serviço SaaS beOrigo para profissionais são processados através da <strong>Stripe</strong>, 
            um processador de pagamentos seguro e certificado internacionalmente.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Importante:</strong> A Stripe processa exclusivamente dados de pagamento do profissional (cobrança SaaS). 
            A Stripe <strong>não tem acesso</strong> aos dados clínicos dos seus alunos (VAS, notas clínicas, HEP).
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            O <strong>aluno (STUDENT)</strong> não é cobrado para usar o app vinculado ao profissional.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Documentos relacionados</h2>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><a href="/termos" className="text-[var(--brand-primary)] underline hover:no-underline">Termos de Uso (gerais)</a></li>
            <li><a href="/termos-saas" className="text-[var(--brand-primary)] underline hover:no-underline">Termos SaaS (profissionais)</a></li>
            <li><a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a></li>
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
