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
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">1. Planos e Preços</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-4">
            O beOrigo oferece os seguintes planos para profissionais:
          </p>
          
          <div className="bg-[#f5f5f0] border border-[#d1e5d9] rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Start</h3>
            <p className="text-base text-[var(--color-ink-700)] mb-2">
              <strong>R$ 49/mês</strong> ou <strong>R$ 470,40/ano</strong> (−20% desconto anual)
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--color-ink-600)]">
              <li>Até 15 alunos ativos</li>
              <li>HEP ilimitado</li>
              <li>Relatório de adesão</li>
              <li>Registro clínico mínimo</li>
            </ul>
          </div>

          <div className="bg-[#f5f5f0] border border-[#d1e5d9] rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Pro</h3>
            <p className="text-base text-[var(--color-ink-700)] mb-2">
              <strong>R$ 79/mês</strong> ou <strong>R$ 758,40/ano</strong> (−20% desconto anual)
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--color-ink-600)]">
              <li>Alunos ilimitados</li>
              <li>HEP ilimitado</li>
              <li>Relatório de adesão avançado</li>
              <li>Registro clínico leve / mínimo</li>
              <li>Suporte prioritário</li>
            </ul>
          </div>

          <div className="bg-[#f5f5f0] border border-[#d1e5d9] rounded-lg p-6">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Clinic</h3>
            <p className="text-base text-[var(--color-ink-700)] mb-2">
              <strong>R$ 149/mês</strong> ou <strong>R$ 1.430,40/ano</strong> (−20% desconto anual)
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--color-ink-600)]">
              <li>Até 3 seats (profissionais)</li>
              <li>Alunos ilimitados</li>
              <li>Dashboard de gestão</li>
              <li>Suporte dedicado</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">2. Trial de 14 dias</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Todos os planos incluem um período de trial de <strong>14 dias</strong>. Durante o trial:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Não é obrigatório fornecer cartão de crédito no início do trial</li>
            <li>Acesso completo às funcionalidades do plano escolhido</li>
            <li>Cancelamento sem custo a qualquer momento durante o período de trial</li>
            <li>Após o trial, inicia-se a cobrança automática se houver forma de pagamento cadastrada</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">3. Cobrança e Renovação</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            A cobrança é processada via <strong>Stripe</strong> (Checkout e Customer Portal). Os valores são cobrados em <strong>BRL (Real brasileiro)</strong>.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Renovação automática:</strong> A assinatura renova automaticamente ao final de cada período (mensal ou anual) até que seja cancelada.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Não armazenamos PAN (número do cartão) ou CVV — esses dados ficam exclusivamente na Stripe, conforme normas PCI-DSS.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">4. Cancelamento e Reembolso</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Você pode cancelar sua assinatura a qualquer momento através do Customer Portal ou entrando em contato com contact@beorigo.app.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Sem reembolso pró-rata:</strong> Não oferecemos reembolso proporcional ao cancelar durante um período pago. Você mantém acesso até o final do período já pago.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Período de graça e retries:</strong> Em caso de falha de pagamento, concedemos um período de graça de até 3 dias com tentativas automáticas de cobrança. Após esse período sem pagamento bem-sucedido, a conta é suspensa.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">5. Suspensão e Dados Pós-Cancelamento</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Após o término do período pago (cancelamento ou inadimplência):
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>A conta entra em modo <strong>somente-leitura por 30 dias</strong></li>
            <li>Durante esse período, você pode exportar seus dados</li>
            <li>Após 30 dias, a conta é suspensa e o acesso é bloqueado</li>
            <li>Dados podem ser retidos conforme Política de Privacidade e obrigações legais</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">6. Impostos e Nota Fiscal</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Stripe Tax:</strong> Atualmente desabilitado. Os preços exibidos são os valores finais cobrados.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Nota Fiscal:</strong> A emissão de NF está fora do escopo MVP inicial. Será implementada em versão futura. Entre em contato se precisar de comprovante.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">7. Limitação de Responsabilidade</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Nossa responsabilidade total por qualquer reclamação relacionada ao serviço SaaS está limitada ao valor pago por você nos <strong>12 meses anteriores</strong> ao evento que originou a reclamação.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Esta limitação não se aplica em casos de dolo, culpa grave ou violações não limitáveis por lei brasileira.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">8. Processamento de Pagamentos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Todos os pagamentos são processados pela <strong>Stripe</strong>. A Stripe gerencia:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Checkout (coleta de dados de pagamento)</li>
            <li>Customer Portal (gerenciamento de assinatura e formas de pagamento)</li>
            <li>Processos de chargeback e disputas</li>
            <li>Armazenamento seguro de dados de cartão (PCI-DSS)</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            Nós mantemos apenas referências de assinatura (subscription IDs) para vincular sua conta beOrigo ao pagamento, sem armazenar dados de cartão.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            Para mais detalhes, consulte o <a href="/aviso-pagamentos" className="text-[var(--brand-primary)] underline hover:no-underline">Aviso de Pagamentos</a>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">9. Alterações de Preço</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Podemos alterar os preços dos planos mediante aviso prévio de pelo menos 30 dias. Assinaturas ativas mantêm o preço contratado até o final do período corrente, com o novo preço aplicado na renovação seguinte.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">10. Upgrade e Downgrade</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Você pode alterar seu plano a qualquer momento:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>Upgrade:</strong> Efeito imediato, com cobrança proporcional do período restante</li>
            <li><strong>Downgrade:</strong> Efeito no início do próximo período de cobrança</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">11. Integração com Termos de Uso Gerais</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Estes Termos SaaS complementam os <a href="/termos" className="text-[var(--brand-primary)] underline hover:no-underline">Termos de Uso</a> gerais do beOrigo. Em caso de conflito entre este documento e os Termos gerais, prevalecem estes Termos SaaS para questões específicas de cobrança e assinatura do profissional.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">12. Privacidade e Dados de Pagamento</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            O tratamento de dados pessoais relacionados a pagamento segue nossa <a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a>.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Importante:</strong> A Stripe processa <strong>exclusivamente</strong> dados de pagamento do profissional. A Stripe <strong>não tem acesso</strong> aos dados clínicos dos seus alunos (VAS, notas clínicas, HEP). A segregação é arquitetural.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">13. Suporte</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Nível de suporte varia por plano:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>Start:</strong> Suporte via e-mail (melhor esforço)</li>
            <li><strong>Pro:</strong> Suporte prioritário via e-mail</li>
            <li><strong>Clinic:</strong> Suporte dedicado com SLA diferenciado</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            Contato: contact@beorigo.app
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">14. Moeda e Localização</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Todos os preços são em <strong>BRL (Real brasileiro)</strong>. O serviço é prestado no Brasil, com foro na Comarca de São Paulo/SP.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">15. Programa de Indicação</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Profissionais com conta ativa podem participar do programa de indicação do beOrigo:
          </p>
          
          <div className="bg-[#e5f0e8] border border-[#c7dbcc] rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Para o Indicado (novo profissional)</h3>
            <p className="text-base text-[var(--color-ink-700)]">
              Ao usar um código de cupom de indicação, o novo profissional recebe <strong>1 mês grátis</strong> de qualquer plano (Start, Pro ou Clinic).
            </p>
          </div>

          <div className="bg-[#e5f0e8] border border-[#c7dbcc] rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Para o Indicador (quem compartilhou)</h3>
            <p className="text-base text-[var(--color-ink-700)] mb-3">
              O profissional que indicou recebe <strong>15% recorrente</strong> sobre o valor cobrado do indicado, calculado da seguinte forma:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-[var(--color-ink-600)]">
              <li><strong>0% durante o mês grátis</strong> (trial ou cupom) — sem comissão no período free</li>
              <li><strong>15% do valor cobrado</strong> enquanto o indicado mantiver assinatura paga ativa</li>
              <li>Comissão continua mensalmente ou anualmente conforme o plano do indicado</li>
              <li>Se o indicado cancelar, as comissões futuras são encerradas</li>
            </ul>
          </div>

          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Regras do programa:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>Anti self-referral:</strong> Não é permitido indicar a si mesmo ou contas controladas por você</li>
            <li><strong>Anti-fraude:</strong> Indicações fraudulentas resultam em cancelamento do programa e possível suspensão da conta</li>
            <li>O programa pode ser alterado ou descontinuado mediante aviso prévio de 30 dias</li>
          </ul>

          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-4 mb-3">
            <strong>Pagamento das comissões (payout):</strong>
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Detalhes sobre como receber as comissões (payout) e emissão de Nota Fiscal serão definidos em follow-up. O indicador será notificado antes da primeira transferência.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Dúvidas sobre o programa: contact@beorigo.app
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">16. Foro e Lei Aplicável</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Estes Termos SaaS são regidos pelas leis da República Federativa do Brasil.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Foro exclusivo:</strong> Comarca de <strong>São Paulo/SP</strong>, com exclusão de qualquer outro, por mais privilegiado que seja.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">17. Contato</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Para dúvidas, suporte ou questões relacionadas a estes Termos SaaS:
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>E-mail:</strong> contact@beorigo.app
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Prestador:</strong><br />
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
