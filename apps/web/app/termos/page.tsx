import { LegalLayout } from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — beOrigo",
  description: "Termos de Uso do App beOrigo",
};

export default function TermosPage() {
  return (
    <LegalLayout version="terms_app_v2_2026-09-13" title="Termos de Uso — App beOrigo">
      <div className="space-y-8">
        <section>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Versão:</strong> <code className="text-sm bg-[#f5f5f0] px-2 py-0.5 rounded">terms_app_v2_2026-09-13</code>
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Prestador:</strong> GCP INOVACOES TECNOLOGIA LTDA, CNPJ 54.639.529/0001-89, São Paulo/SP.
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Foro:</strong> Comarca de São Paulo/SP.
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Contato:</strong> contact@beorigo.app
          </p>
          <p className="text-base text-[var(--color-ink-700)]">
            <strong>Idade mínima:</strong> 18 anos. Menores somente com responsável legal.
          </p>
          <p className="text-base text-[var(--color-ink-700)] mt-4">
            <strong>Teto de responsabilidade:</strong> Limitado a 12 meses de valores pagos pelo profissional.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">1. Aceite</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Ao usar o <strong>beOrigo</strong>, você aceita estes Termos de Uso e nossa <a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a>. O aceite é versionado e registrado no sistema (LegalAcceptance). Se não concordar, não use o serviço.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">2. O que é o beOrigo</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            O <strong>beOrigo</strong> é uma ferramenta de prescrição de HEP (home exercise program), acompanhamento de adesão e registro clínico <strong>leve</strong> na relação profissional ↔ aluno (<strong>1:1</strong>).
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>NÃO somos:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Sistema de diagnóstico ou telemedicina</li>
            <li>Prontuário eletrônico completo (EHR)</li>
            <li>Marketplace de profissionais</li>
            <li>Plataforma que cobra o aluno final</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            O serviço é SaaS pago pelo <strong>PROFESSIONAL</strong>. O <strong>STUDENT</strong> não paga para usar o app como aluno vinculado.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">3. Planos e pagamento (PROFESSIONAL)</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Os detalhes comerciais (valores, formas de pagamento, trial) são fornecidos diretamente ao profissional durante a contratação. Informações públicas de marketing podem estar indisponíveis até autorização legal final.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Pagamentos processados via <strong>Stripe</strong>. Cancelamento e reembolso seguem política específica comunicada no momento da contratação.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">4. Cadastro e segurança da conta</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Você deve:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Fornecer informações verdadeiras e atualizadas</li>
            <li>Manter suas credenciais (e-mail e senha) seguras e confidenciais</li>
            <li>Ter pelo menos 18 anos de idade</li>
            <li>Notificar-nos imediatamente sobre qualquer uso não autorizado da sua conta</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            Você é responsável por todas as atividades realizadas com sua conta.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">5. Uso permitido e proibido</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Uso permitido:</strong> Prescrição de HEP, acompanhamento de adesão e registro clínico leve na relação 1:1.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Uso vedado:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Qualquer atividade ilícita ou que viole direitos de terceiros</li>
            <li>Scraping, mineração de dados ou engenharia reversa ilegal</li>
            <li>Upload de conteúdo ilegal, ofensivo ou que viole direitos autorais</li>
            <li>Impersonação de outros usuários ou profissionais</li>
            <li>Tentativa de burlar medidas de segurança</li>
            <li>Uso comercial não autorizado ou revenda do acesso</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">6. Responsabilidade profissional (COFFITO e conselhos)</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            A <strong>responsabilidade clínica</strong> é do profissional que prescreve e acompanha o HEP. O beOrigo é apenas a ferramenta de gestão e comunicação.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Importante para Personal Trainers:</strong> O registro leve do beOrigo <strong>não</strong> deve ser rotulado como "prontuário fisioterapêutico" (COFFITO 414), pois não atende aos requisitos completos dessa norma. Use conforme sua categoria profissional.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Profissionais devem seguir as normas de seus conselhos de classe (CREFITO, CREF, etc.) quanto a guarda de documentação, sigilo e conduta ética.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">7. Privacidade e dados de saúde</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            O tratamento de dados pessoais segue nossa <a href="/privacidade" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Privacidade</a> (versão V2). Dados de saúde (dor VAS, notas clínicas) requerem <strong>consentimento específico e destacado</strong> do titular.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Você pode revogar consentimentos, mas isso pode limitar funcionalidades do app. Obrigações legais de guarda do profissional permanecem mesmo após revogação.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">8. Pagamentos e foro (PROFESSIONAL)</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Detalhes de cobrança são fornecidos no momento da contratação (informação gated até autorização legal para ofertas públicas). Pagamentos via Stripe.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Foro exclusivo:</strong> Comarca de São Paulo/SP, Brasil.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">9. Propriedade intelectual</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Todos os direitos de propriedade intelectual sobre o <strong>beOrigo</strong> (código, design, marca, conteúdo) pertencem a nós ou a nossos licenciadores.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Seu conteúdo</strong> (HEP, notas clínicas, observações) permanece seu. Você nos concede uma licença operacional limitada para processar e exibir esse conteúdo dentro do serviço, conforme necessário para o funcionamento do app.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">10. Disponibilidade do serviço</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            O serviço é fornecido <strong>"como disponível"</strong>, sem garantias de uptime ou SLA formal na versão V2. Faremos esforços comercialmente razoáveis para manter o serviço disponível, mas não garantimos operação ininterrupta.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">11. Limitação de responsabilidade</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Na máxima extensão permitida pela lei brasileira:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Não nos responsabilizamos por danos indiretos, lucros cessantes ou danos morais</li>
            <li>Nossa responsabilidade total está limitada ao valor pago pelo profissional nos <strong>12 meses anteriores</strong> ao evento</li>
            <li>Não somos responsáveis por condutas clínicas ou decisões profissionais tomadas com base no uso do app</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            Esta limitação não se aplica a casos de dolo, culpa grave ou violações não limitáveis por lei.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">12. Suspensão e encerramento</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Podemos suspender ou encerrar sua conta, com ou sem aviso prévio, nas seguintes situações:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Violação destes Termos de Uso</li>
            <li>Uso fraudulento ou que coloque em risco a segurança do serviço</li>
            <li>Inadimplência no pagamento (para contas PROFESSIONAL)</li>
            <li>Ordem judicial ou de autoridade competente</li>
            <li>Encerramento voluntário pelo usuário</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-3">
            Após cancelamento, você terá 30 dias em modo somente-leitura para exportar seus dados antes da suspensão final.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">13. Alterações nos Termos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Podemos atualizar estes Termos periodicamente. Alterações materiais exigirão novo aceite versionado (LegalAcceptance) para continuar usando o serviço. Comunicaremos mudanças significativas com antecedência razoável.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">14. Lei aplicável e foro</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Estes Termos são regidos pelas leis da República Federativa do Brasil.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Foro exclusivo:</strong> Comarca de <strong>São Paulo/SP</strong>, com exclusão de qualquer outro, por mais privilegiado que seja.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">15. Contato</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Para dúvidas, suporte ou solicitações relacionadas a estes Termos:
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
