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
            Todos os planos incluem um período de trial de <strong>14 dias</strong>. Durante o trial, você tem acesso completo às funcionalidades do plano e pode cancelar sem custo a qualquer momento.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">3. Cobrança e Renovação</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            A cobrança é processada via <strong>Stripe</strong>. Os valores são cobrados em <strong>BRL (Real brasileiro)</strong>. A assinatura renova automaticamente até que seja cancelada.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Não armazenamos PAN (número do cartão) ou CVV — esses dados ficam exclusivamente na Stripe.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">4. Cancelamento</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Você pode cancelar sua assinatura a qualquer momento através do Customer Portal ou entrando em contato com contact@beorigo.app.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Sem reembolso pró-rata:</strong> Não oferecemos reembolso proporcional ao cancelar durante um período pago. Você mantém acesso até o final do período já pago.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">5. Limitação de Responsabilidade</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Nossa responsabilidade total está limitada ao valor pago por você nos <strong>12 meses anteriores</strong> ao evento que originou a reclamação.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">§15. Programa de Indicação</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Profissionais com conta ativa podem participar do programa de indicação do beOrigo:
          </p>
          
          <div className="bg-[#e5f0e8] border border-[#c7dbcc] rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Para o Indicado (novo profissional)</h3>
            <p className="text-base text-[var(--color-ink-700)]">
              Ao usar um código de cupom de indicação, o novo profissional recebe <strong>1 mês grátis</strong> de qualquer plano.
            </p>
          </div>

          <div className="bg-[#e5f0e8] border border-[#c7dbcc] rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)] mb-3">Para o Indicador (quem compartilhou)</h3>
            <p className="text-base text-[var(--color-ink-700)] mb-3">
              O profissional que indicou recebe <strong>15% recorrente</strong> sobre o valor cobrado do indicado:
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
          </ul>

          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-4">
            Pagamento das comissões (payout) e emissão de NF: TBD em follow-up. Dúvidas: contact@beorigo.app
          </p>
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
