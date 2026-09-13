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
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">1. Quem é cobrado</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Apenas o PROFESSIONAL</strong> (profissional) paga pela assinatura SaaS do beOrigo.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>O aluno (STUDENT) não paga</strong> para usar o app vinculado ao profissional. O beOrigo não cobra o aluno final em nenhuma circunstância.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">2. Processador de pagamentos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Os pagamentos do serviço SaaS beOrigo são processados através da <strong>Stripe</strong>, um processador de pagamentos seguro e certificado internacionalmente (PCI-DSS Level 1).
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            A Stripe gerencia:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)] mt-3">
            <li><strong>Checkout:</strong> Coleta segura de dados de pagamento (cartão de crédito)</li>
            <li><strong>Customer Portal:</strong> Gerenciamento de assinatura, formas de pagamento e histórico</li>
            <li><strong>Cobrança recorrente:</strong> Processamento automático de renovações mensais ou anuais</li>
            <li><strong>Chargeback e disputas:</strong> Processos de contestação e resolução</li>
            <li><strong>Armazenamento seguro:</strong> PAN (número do cartão) e CVV ficam exclusivamente na Stripe</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">3. O que armazenamos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Nós <strong>não armazenamos</strong> dados de cartão (PAN/CVV). Mantemos apenas:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Referências de assinatura (subscription IDs da Stripe)</li>
            <li>Status da assinatura (ativa, cancelada, suspensa)</li>
            <li>Histórico básico de cobrança (data, valor, plano)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">4. Planos e Preços Públicos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Os planos beOrigo estão disponíveis publicamente no site:
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
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">5. Trial de 14 dias</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            O trial permite testar o serviço por 14 dias sem custo. Durante o trial:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Não é obrigatório fornecer cartão de crédito no início</li>
            <li>Acesso completo às funcionalidades do plano</li>
            <li>Cancelamento sem custo a qualquer momento</li>
            <li>Após o trial, inicia-se a cobrança automática (se houver forma de pagamento)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">6. Moeda e Localização</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Todos os valores são cobrados em <strong>BRL (Real brasileiro)</strong>. O serviço é prestado no Brasil.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">7. Reembolso</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Não oferecemos reembolso pró-rata.</strong> Ao cancelar durante um período pago, você mantém acesso até o final do período, mas não há devolução proporcional do valor já pago.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">8. Impostos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Stripe Tax:</strong> Atualmente desabilitado. Os preços exibidos são os valores finais cobrados, sem adição de impostos no checkout.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">9. Nota Fiscal</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            A emissão automática de Nota Fiscal está <strong>fora do escopo MVP</strong> inicial. Será implementada em versão futura. 
            Se precisar de comprovante de pagamento, entre em contato através de contact@beorigo.app.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">10. Falha de Pagamento</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Em caso de falha na cobrança automática:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Período de graça de <strong>3 dias</strong> com retries automáticas</li>
            <li>Notificação por e-mail sobre a falha</li>
            <li>Após 3 dias sem pagamento bem-sucedido, a conta é suspensa</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">11. Cancelamento</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Você pode cancelar sua assinatura a qualquer momento:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Através do Stripe Customer Portal</li>
            <li>Entrando em contato com contact@beorigo.app</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            Após o cancelamento, a conta entra em modo somente-leitura por 30 dias, permitindo exportar dados antes da suspensão final.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">12. Segregação: Stripe não acessa dados clínicos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            É fundamental destacar que a <strong>Stripe processa exclusivamente dados de pagamento do profissional</strong> (cobrança SaaS). 
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            A Stripe <strong>não tem acesso</strong> a:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Dados de VAS (dor) dos alunos</li>
            <li>Notas clínicas (ClinicalNote)</li>
            <li>Programas HEP dos alunos</li>
            <li>Vínculos profissional-aluno</li>
            <li>Qualquer dado clínico ou de saúde</li>
          </ul>
          <p className="text-sm text-[var(--color-ink-600)] mt-4 leading-relaxed">
            A segregação é arquitetural: dados de billing ficam completamente isolados dos dados clínicos do app.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">13. Programa de Indicação e Comissões</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Profissionais podem participar do programa de indicação do beOrigo. As comissões seguem as regras definidas nos <a href="/termos-saas" className="text-[var(--brand-primary)] underline hover:no-underline">Termos SaaS</a>:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>15% recorrente</strong> sobre o valor cobrado do indicado após o mês grátis</li>
            <li><strong>0% durante o período free</strong> (trial ou cupom de indicação)</li>
            <li>Comissão continua enquanto o indicado mantiver assinatura paga ativa</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-4 mb-3">
            <strong>Importante:</strong> Comissões de indicação são <strong>diferentes</strong> da cobrança Stripe do seu próprio plano. Comissões são receitas que você ganha por indicar outros profissionais.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Detalhes sobre pagamento das comissões (payout) e emissão de Nota Fiscal serão definidos em follow-up. Entre em contato com contact@beorigo.app para dúvidas.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">14. Privacidade e Subprocessadores</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Para mais informações sobre como tratamos seus dados de pagamento e a lista completa de subprocessadores, consulte:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)] mt-3">
            <li><a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a></li>
            <li><a href="/dpa" className="text-[var(--brand-primary)] underline hover:no-underline">Lista de Subprocessadores (DPA)</a></li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">15. Foro e Contato</h2>
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
