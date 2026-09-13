import { LegalLayout } from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DPA / Lista de Subprocessadores — beOrigo",
  description: "Data Processing Agreement e Lista de Subprocessadores do beOrigo",
};

export default function DPAPage() {
  return (
    <LegalLayout version="dpa_subprocessors_v2_2026-09-13" title="DPA / Lista de Subprocessadores — beOrigo">
      <div className="space-y-8">
        <section>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Versão:</strong> <code className="text-sm bg-[#f5f5f0] px-2 py-0.5 rounded">dpa_subprocessors_v2_2026-09-13</code>
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Natureza:</strong> Anexo operacional. Não substitui DPA bilateral específico quando aplicável.
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Foro:</strong> Comarca de São Paulo/SP.
          </p>
          <p className="text-base text-[var(--color-ink-700)]">
            <strong>Contatos:</strong> DPO: privacy@beorigo.com · Geral: contact@beorigo.app
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">1. Introdução</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Este documento lista os subprocessadores (fornecedores de infraestrutura e serviços) que utilizamos para operar o <strong>beOrigo</strong>. Ele complementa nossa <a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a> e serve como anexo operacional para fins de transparência LGPD.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Se você é um cliente empresarial que requer um DPA (Data Processing Agreement) bilateral formal, entre em contato conosco em <a href="mailto:privacy@beorigo.com" className="text-[var(--brand-primary)] underline hover:no-underline">privacy@beorigo.com</a>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">2. Papéis no tratamento de dados</h2>
          <div className="bg-[#f5f5f0] border border-[#d1e5d9] rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Controlador</h3>
            <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
              <strong>GCP INOVACOES TECNOLOGIA LTDA</strong> (CNPJ 54.639.529/0001-89) é o controlador dos dados pessoais tratados no beOrigo.
            </p>
          </div>

          <div className="bg-[#f5f5f0] border border-[#d1e5d9] rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Profissional: possível co-responsável</h3>
            <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
              O <strong>profissional</strong> (fisioterapeuta, personal trainer) que utiliza o beOrigo pode atuar como <strong>co-responsável</strong> ou <strong>controlador independente</strong> dos dados clínicos de seus alunos, dependendo do nível de autonomia e das decisões sobre o tratamento desses dados. A responsabilidade clínica e obrigações de guarda pertencem ao profissional.
            </p>
          </div>

          <div className="bg-[#f5f5f0] border border-[#d1e5d9] rounded-lg p-6">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Stripe: pagamento não clínico</h3>
            <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
              <strong>Stripe</strong> processa exclusivamente dados de <strong>pagamento do profissional</strong> (cobrança SaaS). Não processa dados clínicos do aluno (VAS, ClinicalNote, HEP).
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">3. Lista de subprocessadores</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-4">
            Os subprocessadores abaixo podem ter acesso a dados pessoais (incluindo dados de saúde, quando aplicável) no contexto da operação do beOrigo:
          </p>

          <div className="space-y-6">
            <div className="border border-[#d1e5d9] rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-2">Stripe</h3>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Finalidade:</strong> Processamento de pagamentos (billing do profissional)
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Localização:</strong> Estados Unidos (com salvaguardas LGPD)
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Dados processados:</strong> Dados de pagamento do PROFESSIONAL (cartão, e-mail de cobrança, histórico de transações). <strong>Não</strong> processa dados clínicos do aluno (VAS, ClinicalNote, HEP).
              </p>
              <p className="text-sm text-[var(--color-ink-600)]">
                <strong>Política:</strong>{" "}
                <a
                  href="https://stripe.com/legal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-primary)] underline hover:no-underline"
                >
                  stripe.com/legal
                </a>
              </p>
            </div>

            <div className="border border-[#d1e5d9] rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-2">Vercel</h3>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Finalidade:</strong> Hospedagem do site de apresentação (beorigo.com) e possível web app
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Localização:</strong> Estados Unidos (edge global, com salvaguardas LGPD)
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Dados processados:</strong> Logs de acesso, cookies essenciais do site de apresentação. Não processa dados clínicos diretamente.
              </p>
              <p className="text-sm text-[var(--color-ink-600)]">
                <strong>Política:</strong>{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-primary)] underline hover:no-underline"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </div>

            <div className="border border-[#d1e5d9] rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-2">Fly.io</h3>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Finalidade:</strong> Hospedagem da API backend (processamento de HEP, notas clínicas, adesão)
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Localização:</strong> Preferência por região GRU (Guarulhos/Brasil). Pode usar região US em configurações específicas (com salvaguardas LGPD).
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Dados processados:</strong> Dados completos do app (HEP, notas clínicas, VAS, vínculos profissional-aluno).
              </p>
              <p className="text-sm text-[var(--color-ink-600)]">
                <strong>Política:</strong>{" "}
                <a
                  href="https://fly.io/legal/privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-primary)] underline hover:no-underline"
                >
                  fly.io/legal/privacy-policy
                </a>
              </p>
            </div>

            <div className="border border-[#d1e5d9] rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-2">Neon (Postgres)</h3>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Finalidade:</strong> Banco de dados (armazenamento persistente de HEP, notas, vínculos)
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Localização:</strong> Estados Unidos (com salvaguardas LGPD)
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Dados processados:</strong> Dados completos do app (HEP, notas clínicas, VAS, vínculos profissional-aluno).
              </p>
              <p className="text-sm text-[var(--color-ink-600)]">
                <strong>Política:</strong>{" "}
                <a
                  href="https://neon.tech/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-primary)] underline hover:no-underline"
                >
                  neon.tech/privacy-policy
                </a>
              </p>
            </div>

            <div className="border border-[#d1e5d9] rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-2">Resend</h3>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Finalidade:</strong> Envio de e-mails transacionais (confirmações, notificações, reset de senha)
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Localização:</strong> Estados Unidos (com salvaguardas LGPD)
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Dados processados:</strong> Endereços de e-mail, nomes de usuários, conteúdo de notificações. Não processa dados clínicos sensíveis nos e-mails.
              </p>
              <p className="text-sm text-[var(--color-ink-600)]">
                <strong>Política:</strong>{" "}
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-primary)] underline hover:no-underline"
                >
                  resend.com/legal/privacy-policy
                </a>
              </p>
            </div>

            <div className="border border-[#d1e5d9] rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-2">Auth (self-hosted)</h3>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Finalidade:</strong> Autenticação e gerenciamento de sessões
              </p>
              <p className="text-sm text-[var(--color-ink-600)] mb-3">
                <strong>Localização:</strong> Mesma infraestrutura do backend (Fly.io)
              </p>
              <p className="text-sm text-[var(--color-ink-600)]">
                <strong>Dados processados:</strong> Credenciais de login (e-mail, senha hash), tokens de sessão.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">4. Subprocessadores não utilizados no MVP1</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Os seguintes serviços <strong>não estão</strong> em uso na versão MVP atual, mas podem ser adicionados no futuro:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-600)]">
            <li>Ferramentas de analytics (Google Analytics, Mixpanel, etc.)</li>
            <li>CMP (Consent Management Platform) / cookie banners</li>
            <li>CDN adicional (além do Vercel/Fly)</li>
            <li>Monitoramento de erros (Sentry, etc.)</li>
            <li>Suporte ao cliente (Intercom, Zendesk, etc.)</li>
          </ul>
          <p className="text-sm text-[var(--color-ink-600)] mt-4 leading-relaxed">
            Esta lista será atualizada antes da implementação de novos subprocessadores.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">5. Segregação: Stripe não acessa dados clínicos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            É importante destacar que a <strong>Stripe</strong> processa <strong>exclusivamente</strong> dados de pagamento do profissional (billing SaaS). Ela <strong>não tem acesso</strong> a:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Dados de VAS (dor)</li>
            <li>Notas clínicas (ClinicalNote)</li>
            <li>Programas HEP dos alunos</li>
            <li>Vínculos profissional-aluno</li>
          </ul>
          <p className="text-sm text-[var(--color-ink-600)] mt-4 leading-relaxed">
            A segregação é arquitetural: dados de billing ficam isolados dos dados clínicos do app.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">6. Alterações na lista de subprocessadores</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Podemos adicionar ou substituir subprocessadores conforme necessário para a operação do beOrigo. Quando houver mudanças materiais:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Atualizaremos esta página com a nova versão (dpa_subprocessors_v3_…)</li>
            <li>Notificaremos clientes corporativos com DPA bilateral</li>
            <li>Publicaremos aviso no app ou por e-mail com antecedência razoável</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">7. Salvaguardas para transferência internacional</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Quando dados pessoais são transferidos para fora do Brasil (subprocessadores nos EUA), adotamos as seguintes salvaguardas conforme LGPD:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Cláusulas contratuais padrão (Standard Contractual Clauses)</li>
            <li>Obrigação contratual de proteção equivalente à LGPD</li>
            <li>Preferência por regiões brasileiras quando tecnicamente viável (Fly.io GRU)</li>
            <li>Criptografia em trânsito (TLS) e em repouso quando aplicável</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">8. Contato e solicitação de DPA formal</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Para dúvidas sobre subprocessadores ou para solicitar um DPA bilateral formal:
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>DPO:</strong> privacy@beorigo.com<br />
            <strong>Geral:</strong> contact@beorigo.app
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
