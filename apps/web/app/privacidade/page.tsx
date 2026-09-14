import { LegalLayout } from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — beOrigo",
  description: "Política de Privacidade do App beOrigo — Como tratamos seus dados pessoais",
};

export default function PrivacidadePage() {
  return (
    <LegalLayout version="privacy_v2_2026-09-13" title="Política de Privacidade — App beOrigo">
      <div className="space-y-8">
        <section>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Versão:</strong> <code className="text-sm bg-[#f5f5f0] px-2 py-0.5 rounded">privacy_v2_2026-09-13</code>
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Produto:</strong> beOrigo · <strong>Idioma:</strong> pt-BR
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Marca:</strong> beOrigo · beorigo.app · beorigo.com · Cookies do site: somente essenciais.
          </p>
          <p className="text-base text-[var(--color-ink-700)] mb-4">
            <strong>Controlador:</strong> GCP INOVACOES TECNOLOGIA LTDA, CNPJ 54.639.529/0001-89, R ALM ALEXANDRINO 25 SALA 2 ANEXO 31 — VILA INVERNADA — SÃO PAULO/SP — CEP 03.350-010.
          </p>
          <p className="text-base text-[var(--color-ink-700)]">
            <strong>Encarregado (DPO):</strong> privacy@beorigo.com · <strong>Contato geral/suporte:</strong> contact@beorigo.app
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">1. Quem somos</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-4">
            O <strong>beOrigo</strong> é um aplicativo (beorigo.app; iOS/Android e, quando disponível, web) de prescrição de HEP (home exercise program), adesão e registro clínico <strong>leve</strong> na relação profissional ↔ aluno (<strong>1:1</strong>). Site de apresentação: beorigo.com.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Canais:</strong> app iOS/Android; site de apresentação; possível web app de autenticação. <strong>Não</strong> misturar com outros produtos.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">2. Escopo desta política</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Aplica-se ao tratamento de dados pessoais no <strong>App beOrigo</strong> e fluxos de conta vinculados. O <strong>site</strong> de apresentação pode ter avisos/cookies próprios (ver <a href="/cookies" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Cookies</a>). Pagamentos do profissional via <strong>Stripe</strong> estão descritos aqui na parte de subprocessadores de <strong>pagamento</strong> (não de dado clínico).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">3. Papéis no produto</h2>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>STUDENT (aluno):</strong> pessoa que executa o programa HEP prescrito.</li>
            <li><strong>PROFESSIONAL (profissional):</strong> quem paga o SaaS beOrigo, prescreve HEP e registra notas leves.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">4. Quais dados tratamos</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-[#d1e5d9] text-sm">
              <thead>
                <tr className="bg-[#e5f0e8]">
                  <th className="border border-[#d1e5d9] px-4 py-3 text-left font-semibold text-[var(--color-ink-900)]">Categoria</th>
                  <th className="border border-[#d1e5d9] px-4 py-3 text-left font-semibold text-[var(--color-ink-900)]">Exemplos</th>
                  <th className="border border-[#d1e5d9] px-4 py-3 text-left font-semibold text-[var(--color-ink-900)]">Sensível?</th>
                  <th className="border border-[#d1e5d9] px-4 py-3 text-left font-semibold text-[var(--color-ink-900)]">Quem fornece</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#d1e5d9] px-4 py-3">Conta/identidade</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">nome, e-mail, senha hash, papel</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Não</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Titular</td>
                </tr>
                <tr className="bg-[#f5f5f0]">
                  <td className="border border-[#d1e5d9] px-4 py-3">Vínculo 1:1</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Relação profissional-aluno</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Não</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Profissional/sistema</td>
                </tr>
                <tr>
                  <td className="border border-[#d1e5d9] px-4 py-3">Programa HEP</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Exercícios, sessões, observações</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Em geral não</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Profissional/aluno</td>
                </tr>
                <tr className="bg-[#f5f5f0]">
                  <td className="border border-[#d1e5d9] px-4 py-3">Dor VAS</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Escala visual analógica</td>
                  <td className="border border-[#d1e5d9] px-4 py-3"><strong>Sim</strong></td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Aluno</td>
                </tr>
                <tr>
                  <td className="border border-[#d1e5d9] px-4 py-3">ClinicalNote</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Registro clínico leve</td>
                  <td className="border border-[#d1e5d9] px-4 py-3"><strong>Sim</strong></td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Profissional</td>
                </tr>
                <tr className="bg-[#f5f5f0]">
                  <td className="border border-[#d1e5d9] px-4 py-3">LegalAcceptance</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Aceite de termos/políticas</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Não</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Titular</td>
                </tr>
                <tr>
                  <td className="border border-[#d1e5d9] px-4 py-3">Billing refs PROFESSIONAL</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Referências de pagamento</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Não</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Stripe + nós</td>
                </tr>
                <tr className="bg-[#f5f5f0]">
                  <td className="border border-[#d1e5d9] px-4 py-3">Logs técnicos</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Logs de sistema</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Não</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Sistema</td>
                </tr>
                <tr>
                  <td className="border border-[#d1e5d9] px-4 py-3">Indicação (só PROFESSIONAL)</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Código/cupom, vínculo, status</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Não</td>
                  <td className="border border-[#d1e5d9] px-4 py-3">Indicador/Sistema</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[var(--color-ink-600)] mt-4 leading-relaxed">
            Não armazenamos PAN/CVV — fica na Stripe. Nota clínica = leve, não prontuário COFFITO 414 completo. Personal trainer não deve rotular como prontuário fisioterapêutico.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">5. Finalidades e bases legais</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-4">
            Tratamos seus dados para as seguintes finalidades, com as bases legais correspondentes (Lei 13.709/2018 — LGPD):
          </p>
          <ul className="space-y-3 text-base text-[var(--color-ink-700)]">
            <li><strong>Conta/autenticação:</strong> Art. 7º I (consentimento) / V (contrato)</li>
            <li><strong>Vínculo HEP:</strong> Art. 7º V (execução de contrato) / I (consentimento)</li>
            <li><strong>Dor/nota clínica:</strong> Art. 11 I (consentimento específico); Art. 11 II f (tutela da saúde com cautela)</li>
            <li><strong>Guarda CREFITO:</strong> Art. 11 II a quando aplicável (cumprimento de obrigação legal)</li>
            <li><strong>Cobrança SaaS:</strong> Art. 7º V (execução de contrato) / I (consentimento)</li>
            <li><strong>Programa de indicação:</strong> Art. 7º V (execução de contrato) / I (consentimento)</li>
            <li><strong>Export/exclusão:</strong> Art. 18 (direitos dos titulares)</li>
            <li><strong>Segurança:</strong> Art. 7º VI / IX (legítimo interesse proporcional)</li>
          </ul>
          <p className="text-sm text-[var(--color-ink-600)] mt-4 leading-relaxed">
            Consentimento de saúde é específico e destacado. Revogar pode limitar o app; não apaga obrigações de guarda do profissional.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">6. Compartilhamento</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Compartilhamos dados pessoais apenas nas seguintes situações:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li>Com o <strong>profissional vinculado</strong> ao aluno (relação 1:1 do produto)</li>
            <li>Com <strong>subprocessadores:</strong> Vercel, Fly.io, Neon, Resend, Stripe (pagamento), auth self-hosted</li>
            <li>Com <strong>autoridades</strong> competentes, quando houver obrigação legal</li>
          </ul>
          <p className="text-sm text-[var(--color-ink-600)] mt-4 leading-relaxed">
            <strong>Não vendemos</strong> dados de saúde. Stripe processa pagamento SaaS do profissional, não dados clínicos do aluno.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">7. Transferência internacional</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Alguns subprocessadores podem armazenar dados fora do Brasil (Fly.io prefere GRU/BR, mas pode usar US; Neon/Vercel/Resend/Stripe com salvaguardas LGPD). Adotamos medidas de segurança e cláusulas contratuais adequadas.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">8. Retenção</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Mantemos seus dados pelo tempo necessário:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>Durante a relação ativa:</strong> enquanto o contrato estiver vigente</li>
            <li><strong>Pós-cancelamento:</strong> 30 dias em modo somente-leitura → suspensão; possibilidade de export</li>
            <li><strong>Alunos:</strong> retidos até exclusão do titular ou exclusão da conta do profissional após lock</li>
            <li><strong>Notas com dever de guarda:</strong> responsabilidade do profissional conforme normas do conselho de classe</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">9. Direitos LGPD (Art. 18 e seguintes)</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Você tem os seguintes direitos sobre seus dados pessoais:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>Confirmação</strong> do tratamento</li>
            <li><strong>Acesso</strong> aos dados</li>
            <li><strong>Correção</strong> de dados incompletos ou desatualizados</li>
            <li><strong>Eliminação</strong> cabível (respeitando obrigações legais de guarda)</li>
            <li><strong>Portabilidade</strong> dos dados a outro fornecedor</li>
            <li><strong>Informação</strong> sobre compartilhamentos</li>
            <li><strong>Revogação</strong> de consentimento</li>
            <li><strong>Oposição</strong> ao tratamento</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] mt-4 leading-relaxed">
            <strong>Canais:</strong> contact@beorigo.app · DPO: privacy@beorigo.com
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">10. Segurança</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Adotamos medidas técnicas e organizacionais para proteger seus dados: TLS em trânsito, RBAC (controle de acesso baseado em papéis), logs mínimos, separação entre dados de cobrança e dados clínicos. Não armazenamos PAN/CVV (cartões ficam na Stripe).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">11. Menores de idade</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            O serviço é destinado a maiores de 18 anos. Menores de idade somente com autorização e acompanhamento do responsável legal.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">12. Cookies no app</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Minimizamos o uso de cookies. O tracking de cupons de indicação utiliza cookies first-party essenciais para vincular o indicador ao indicado.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Não utilizamos</strong> pixels de afiliado de terceiros (3P) no MVP. Veja a <a href="/cookies" className="text-[var(--brand-primary)] underline hover:no-underline">Política de Cookies</a> do site para detalhes.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">12A. Programa de Indicação</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            Profissionais com conta ativa podem participar do programa de indicação do beOrigo. Tratamos os seguintes dados:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-[var(--color-ink-700)]">
            <li><strong>Dados do indicador:</strong> E-mail, nome, código de cupom gerado, histórico de indicações</li>
            <li><strong>Dados do indicado:</strong> E-mail, nome, cupom usado, vínculo ao indicador, status da assinatura</li>
            <li><strong>Finalidade:</strong> Executar o programa de indicação (14 dias grátis + comissão de 15% recorrente)</li>
            <li><strong>Base legal:</strong> Art. 7º V (execução de contrato) e/ou I (consentimento)</li>
          </ul>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mt-4 mb-3">
            <strong>Importante:</strong> Dados de indicação <strong>não incluem</strong> dados clínicos dos alunos (VAS, notas clínicas, HEP). Tratamos apenas dados de conta do profissional indicado.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Anti-spam:</strong> O programa proíbe spam ou práticas abusivas de indicação. Violações resultam em suspensão do programa e possível encerramento da conta.
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Para detalhes sobre o programa, consulte os <a href="/termos-saas" className="text-[var(--brand-primary)] underline hover:no-underline">Termos SaaS §15</a>. Dúvidas: privacy@beorigo.com ou contact@beorigo.app.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">13. Alterações</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            Podemos atualizar esta política. Nova versão (privacy_v2_…) exigirá novo aceite (LegalAcceptance) para continuar usando o serviço. Comunicaremos alterações materiais com antecedência.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-4">14. Contato e Foro</h2>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Contatos:</strong><br />
            Geral/suporte: contact@beorigo.app<br />
            DPO: privacy@beorigo.com
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed mb-3">
            <strong>Controlador:</strong><br />
            GCP INOVACOES TECNOLOGIA LTDA<br />
            CNPJ 54.639.529/0001-89<br />
            R ALM ALEXANDRINO 25 SALA 2 ANEXO 31 — VILA INVERNADA<br />
            SÃO PAULO/SP — CEP 03.350-010
          </p>
          <p className="text-base text-[var(--color-ink-700)] leading-relaxed">
            <strong>Foro:</strong> Comarca de São Paulo/SP.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
