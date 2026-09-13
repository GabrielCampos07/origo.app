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
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Planos e Preços</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Os planos beOrigo estão disponíveis publicamente:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>Start:</strong> R$ 49/mês ou R$ 470,40/ano (−20%)</li>
            <li><strong>Pro:</strong> R$ 79/mês ou R$ 758,40/ano (−20%)</li>
            <li><strong>Clinic:</strong> R$ 149/mês ou R$ 1.430,40/ano (−20%)</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            Todos os planos incluem <strong>trial de 14 dias</strong>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">Segregação: Stripe não acessa dados clínicos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            A <strong>Stripe processa exclusivamente dados de pagamento do profissional</strong> (cobrança SaaS). 
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            A Stripe <strong>não tem acesso</strong> a dados clínicos dos alunos (VAS, notas clínicas, HEP). A segregação é arquitetural.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">§13. Programa de Indicação e Comissões</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Profissionais podem participar do programa de indicação do beOrigo. As comissões seguem as regras definidas nos <a href="/termos-saas" className="text-[var(--brand-primary)] underline hover:no-underline">Termos SaaS §15</a>:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>Indicado:</strong> 1 mês grátis via cupom</li>
            <li><strong>Indicador:</strong> 15% recorrente sobre o valor cobrado do indicado</li>
            <li><strong>0% durante o período free</strong> (trial ou cupom de indicação) — sem comissão no grátis</li>
            <li>Comissão continua enquanto o indicado mantiver assinatura paga ativa</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-4 mb-3">
            <strong>Importante:</strong> Comissões de indicação são <strong>diferentes</strong> da cobrança Stripe do seu próprio plano. Comissões são receitas que você ganha por indicar outros profissionais.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Detalhes sobre pagamento das comissões (payout) e emissão de NF: TBD em follow-up. Contato: contact@beorigo.app
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
