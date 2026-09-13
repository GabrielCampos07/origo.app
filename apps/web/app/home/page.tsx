"use client";

import Image from "next/image";
import Link from "next/link";

const BILLING_LIVE = process.env.NEXT_PUBLIC_BILLING_LIVE === "true";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-green-50)]">
      {/* Header */}
      <header className="bg-[var(--color-green-50)] flex items-center justify-between px-20 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-6 h-6 rounded-[5px] overflow-hidden">
            <Image
              src="/assets/logo-icon.png"
              alt="beOrigo"
              width={24}
              height={24}
              className="object-cover"
            />
          </div>
          <div className="relative w-[72px] h-[22px]">
            <Image
              src="/assets/logo-wordmark.png"
              alt="beOrigo"
              width={72}
              height={22}
              className="object-cover"
            />
          </div>
        </Link>
        <nav className="flex items-center gap-7">
          <a
            href="#como-funciona"
            className="text-sm font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)] transition-colors"
          >
            Como funciona
          </a>
          <a
            href="#para-quem"
            className="text-sm font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)] transition-colors"
          >
            Para quem
          </a>
          <a
            href="mailto:contact@beorigo.app?subject=Interesse%20em%20beOrigo%20para%20profissionais"
            className="bg-[var(--brand-primary)] text-white font-medium text-base px-5 py-3.5 rounded-xl h-[52px] flex items-center justify-center tracking-[0.2px] hover:opacity-90 transition-opacity"
          >
            Para profissionais 1:1
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-20 pt-20 pb-24 gap-9 bg-gradient-to-b from-[#f5f5f0] via-[#f0f5ed] to-[#e5f0e8]">
        <div className="flex flex-col items-center gap-7 pb-2">
          <div className="relative w-[120px] h-[120px] rounded-[28px] shadow-[0px_14px_32px_0px_rgba(46,56,51,0.14)] overflow-hidden">
            <Image
              src="/assets/logo-icon.png"
              alt="beOrigo"
              width={120}
              height={120}
              className="object-cover"
            />
          </div>
          <h1 className="font-bold text-[64px] text-[#2e3833] tracking-[-1.5px] leading-normal">
            beOrigo
          </h1>
          <div className="relative w-[260px] h-[80px]">
            <Image
              src="/assets/logo-wordmark.png"
              alt="beOrigo"
              width={260}
              height={80}
              className="object-cover"
            />
          </div>
        </div>

        <div className="text-center font-semibold text-[26px] text-[#5c6660]">
          <p className="leading-[34px] mb-0">Prescrição clara. Adesão visível.</p>
          <p className="leading-[34px]">Continuidade entre consultas.</p>
        </div>

        <p className="text-center font-normal text-base text-[#5c6660] max-w-3xl">
          O profissional monta o HEP; o aluno sabe o que fazer hoje e reporta; o pro vê adesão e registra evolução mínima.
        </p>

        <div className="flex items-center gap-3">
          <a
            href="mailto:contact@beorigo.app?subject=Interesse%20em%20beOrigo%20para%20profissionais"
            className="bg-[var(--brand-primary)] text-white font-medium text-base px-5 py-3.5 rounded-xl h-[52px] flex items-center justify-center tracking-[0.2px] hover:opacity-90 transition-opacity"
          >
            Para profissionais 1:1
          </a>
          <Link
            href="/login"
            className="bg-white border border-[var(--border-default)] text-[var(--fg-primary)] font-medium text-base px-5 py-3.5 rounded-xl h-[52px] flex items-center justify-center tracking-[0.2px] hover:bg-gray-50 transition-colors"
          >
            Sou aluno
          </Link>
        </div>

        <div className="bg-white border border-[#d1e5d9] rounded-[24px] p-10 w-full max-w-5xl shadow-[0px_16px_40px_-4px_rgba(46,56,51,0.08)]">
          <div className="relative w-full h-[360px] rounded-2xl overflow-hidden">
            <Image
              src="/assets/hero-image-1.png"
              alt="beOrigo app preview"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Pain Section - Entre consultas */}
      <section className="bg-white px-20 py-20 flex flex-col gap-5">
        <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal">
          Entre consultas, a adesão some
        </h2>
        <div className="font-normal text-lg text-[var(--color-ink-600)]">
          <p className="mb-0">• O PDF some no WhatsApp</p>
          <p className="mb-0">• Apps genéricos não mostram se o aluno fez</p>
          <p>• Planilha sem registro clínico leve</p>
        </div>
      </section>

      {/* Solution Section - Continuidade */}
      <section className="bg-gradient-to-b from-[#e5f0e8] to-[#f5f5f0] px-20 py-20 flex flex-col gap-6">
        <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal">
          Continuidade humana e precisa
        </h2>
        <div className="grid grid-cols-3 gap-5 w-full">
          <div className="bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-7 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-3 h-[168px]">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)]">
              HEP do aluno
            </h3>
            <p className="font-normal text-sm text-[var(--color-ink-600)]">
              Programa, sessão, dor e progresso — claro o que fazer hoje.
            </p>
          </div>
          <div className="bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-7 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-3 h-[168px]">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)]">
              Adesão visível
            </h3>
            <p className="font-normal text-sm text-[var(--color-ink-600)]">
              Aluno reporta sessão feita (dor, observações) — você vê.
            </p>
          </div>
          <div className="bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-7 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-3 h-[168px]">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-lg text-[var(--color-ink-900)]">
              Evolução registrada
            </h3>
            <p className="font-normal text-sm text-[var(--color-ink-600)]">
              Registro clínico mínimo sem planilha — sessão e progresso salvos.
            </p>
          </div>
        </div>
      </section>

      {/* Para Quem Section */}
      <section id="para-quem" className="bg-[var(--color-green-50)] px-20 py-20 flex flex-col gap-6">
        <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal">
          Para quem
        </h2>
        <div className="grid grid-cols-2 gap-5 w-full">
          <div className="bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-7 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-3">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-xl text-[var(--color-ink-900)]">
              Fisioterapeutas
            </h3>
            <p className="font-normal text-base text-[var(--color-ink-600)]">
              Prescreve HEP (sessões/exercícios), acompanha adesão do paciente entre consultas, registra evolução — tudo num só lugar.
            </p>
          </div>
          <div className="bg-white border-[1.5px] border-[#c7dbcc] rounded-2xl p-7 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)] flex flex-col gap-3">
            <div className="bg-[#598c6b] h-1 w-10 rounded" />
            <h3 className="font-semibold text-xl text-[var(--color-ink-900)]">
              Personal Trainers
            </h3>
            <p className="font-normal text-base text-[var(--color-ink-600)]">
              Monta treino semanal, aluno reporta sessão feita, você vê progresso e ajusta — vínculo 1:1 fortalecido.
            </p>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="bg-gradient-to-b from-[#f0f5ed] to-[#e5f0e8] px-20 py-20 flex flex-col gap-10">
        <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal">
          Como funciona
        </h2>
        <div className="grid grid-cols-3 gap-6 w-full">
          <div className="flex flex-col gap-4">
            <div className="bg-[var(--brand-primary)] text-white font-bold text-2xl w-14 h-14 rounded-full flex items-center justify-center">
              01
            </div>
            <h3 className="font-semibold text-xl text-[var(--color-ink-900)]">
              Prescreve
            </h3>
            <p className="font-normal text-base text-[var(--color-ink-600)]">
              Profissional cria programa (sessões + exercícios) ou treino semanal no app.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-[var(--brand-primary)] text-white font-bold text-2xl w-14 h-14 rounded-full flex items-center justify-center">
              02
            </div>
            <h3 className="font-semibold text-xl text-[var(--color-ink-900)]">
              Aluno executa
            </h3>
            <p className="font-normal text-base text-[var(--color-ink-600)]">
              Paciente/aluno acessa HEP, sabe o que fazer hoje, reporta sessão feita com dor e observações.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-[var(--brand-primary)] text-white font-bold text-2xl w-14 h-14 rounded-full flex items-center justify-center">
              03
            </div>
            <h3 className="font-semibold text-xl text-[var(--color-ink-900)]">
              Acompanha
            </h3>
            <p className="font-normal text-base text-[var(--color-ink-600)]">
              Profissional vê adesão em tempo real, registra evolução mínima — continuidade clara.
            </p>
          </div>
        </div>
      </section>

      {/* Clarity Section */}
      <section className="bg-white px-20 py-20 flex flex-col items-center gap-8">
        <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal text-center max-w-3xl">
          Clareza para profissional 1:1
        </h2>
        <div className="bg-[#f5f5f0] border border-[#d1e5d9] rounded-[24px] p-10 w-full max-w-5xl shadow-[0px_16px_40px_-4px_rgba(46,56,51,0.08)]">
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden">
            <Image
              src="/assets/hero-image-2.png"
              alt="beOrigo professional view"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gradient-to-b from-[#e5f0e8] to-[#f5f5f0] px-20 py-20 flex flex-col gap-10">
        <div className="text-center">
          <h2 className="font-semibold text-[32px] text-[var(--color-ink-900)] leading-normal mb-2">
            Clareza para profissional 1:1
          </h2>
          <p className="font-normal text-lg text-[var(--color-ink-600)]">
            Escolha o plano que se encaixa no seu atendimento
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
          {/* Start Plan */}
          <div className="bg-white border border-[#d1e5d9] rounded-2xl p-8 flex flex-col gap-6 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)]">
            <div>
              <h3 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-2">
                Start
              </h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-bold text-4xl text-[var(--color-ink-900)]">R$ 49</span>
                <span className="font-normal text-base text-[var(--color-ink-600)]">/mês</span>
              </div>
              <p className="font-normal text-sm text-[var(--color-ink-600)]">
                Para quem está começando
              </p>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-[var(--color-ink-600)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Até 10 alunos ativos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>HEP ilimitado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Relatório de adesão</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Registro clínico mínimo</span>
              </li>
            </ul>
            <button
              disabled={!BILLING_LIVE}
              className="bg-[var(--brand-primary)] text-white font-medium text-base px-5 py-3.5 rounded-xl w-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (BILLING_LIVE) {
                  window.location.href = "/checkout?plan=start";
                }
              }}
            >
              {BILLING_LIVE ? "Assinar Start" : "Em breve"}
            </button>
          </div>

          {/* Pro Plan - Featured */}
          <div className="bg-white border-2 border-[var(--brand-primary)] rounded-2xl p-8 flex flex-col gap-6 shadow-[0px_16px_40px_-4px_rgba(46,56,51,0.15)] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--brand-primary)] text-white text-xs font-semibold px-4 py-1 rounded-full">
              Mais popular
            </div>
            <div>
              <h3 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-2">
                Pro
              </h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-bold text-4xl text-[var(--color-ink-900)]">R$ 79</span>
                <span className="font-normal text-base text-[var(--color-ink-600)]">/mês</span>
              </div>
              <p className="font-normal text-sm text-[var(--color-ink-600)]">
                Para atendimento consolidado
              </p>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-[var(--color-ink-600)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Até 30 alunos ativos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>HEP ilimitado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Relatório de adesão avançado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Registro clínico completo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Suporte prioritário</span>
              </li>
            </ul>
            <button
              disabled={!BILLING_LIVE}
              className="bg-[var(--brand-primary)] text-white font-medium text-base px-5 py-3.5 rounded-xl w-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (BILLING_LIVE) {
                  window.location.href = "/checkout?plan=pro";
                }
              }}
            >
              {BILLING_LIVE ? "Assinar Pro" : "Em breve"}
            </button>
          </div>

          {/* Clinic Plan */}
          <div className="bg-white border border-[#d1e5d9] rounded-2xl p-8 flex flex-col gap-6 shadow-[0px_10px_24px_-2px_rgba(46,56,51,0.1)]">
            <div>
              <h3 className="font-semibold text-2xl text-[var(--color-ink-900)] mb-2">
                Clínica
              </h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-bold text-4xl text-[var(--color-ink-900)]">R$ 149</span>
                <span className="font-normal text-base text-[var(--color-ink-600)]">/mês</span>
              </div>
              <p className="font-normal text-sm text-[var(--color-ink-600)]">
                Para equipes e clínicas
              </p>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-[var(--color-ink-600)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Alunos ilimitados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Múltiplos profissionais</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Dashboard de gestão</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Whitelabel (em breve)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                <span>Suporte dedicado</span>
              </li>
            </ul>
            <button
              disabled={!BILLING_LIVE}
              className="bg-[var(--brand-primary)] text-white font-medium text-base px-5 py-3.5 rounded-xl w-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (BILLING_LIVE) {
                  window.location.href = "/checkout?plan=clinic";
                }
              }}
            >
              {BILLING_LIVE ? "Falar com time" : "Em breve"}
            </button>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-[#f0f5ed] border border-[#d1e5d9] rounded-xl p-6 text-center max-w-4xl mx-auto">
          <p className="text-sm text-[var(--color-ink-600)] leading-relaxed">
            <strong>Aviso:</strong> O beOrigo é uma ferramenta de gestão e comunicação para profissionais de saúde.
            Não substitui consulta, diagnóstico ou tratamento médico. Sempre consulte um profissional qualificado.
          </p>
        </div>
      </section>

      {/* Video Section */}
      <section className="bg-[#2e3833] px-20 py-24 flex flex-col items-center gap-8">
        <h2 className="font-semibold text-[32px] text-white leading-normal text-center max-w-3xl">
          Veja como funciona
        </h2>
        <div className="relative w-full max-w-4xl h-[480px] rounded-2xl overflow-hidden group cursor-pointer">
          <Image
            src="/assets/video-placeholder.png"
            alt="Veja como funciona"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <div className="relative w-20 h-20">
              <Image
                src="/assets/play-icon.svg"
                alt="Play"
                width={80}
                height={80}
                className="drop-shadow-lg"
              />
            </div>
          </div>
        </div>
        <p className="text-white/80 text-sm">Demonstração • beOrigo</p>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-b from-[#e5f0e8] to-[#f5f5f0] px-20 py-24 flex flex-col items-center gap-8">
        <h2 className="font-semibold text-[40px] text-[var(--color-ink-900)] leading-tight text-center max-w-3xl">
          Comece clara. Programe contínuo.
        </h2>
        <p className="text-center font-normal text-lg text-[var(--color-ink-600)] max-w-2xl">
          Agende uma conversa com nosso time e veja como o beOrigo pode transformar seu atendimento 1:1.
        </p>
        <a
          href="mailto:contact@beorigo.app?subject=Solicita%C3%A7%C3%A3o%20de%20consulta%201:1%20-%20beOrigo"
          className="bg-[var(--brand-primary)] text-white font-medium text-lg px-8 py-4 rounded-xl hover:opacity-90 transition-opacity inline-flex items-center justify-center"
        >
          Falar com consultor 1:1
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-[#2e3833] px-20 py-12 text-white">
        <div className="flex justify-between items-start max-w-6xl mx-auto">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-6 h-6 rounded-[5px] overflow-hidden">
                <Image
                  src="/assets/logo-icon.png"
                  alt="beOrigo"
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </div>
              <div className="relative w-[72px] h-[22px]">
                <Image
                  src="/assets/logo-wordmark.png"
                  alt="beOrigo"
                  width={72}
                  height={22}
                  className="object-cover brightness-0 invert"
                />
              </div>
            </Link>
            <p className="text-sm text-white/70 max-w-xs">
              Continuidade entre consultas. HEP 1:1 para fisioterapeutas e personal trainers.
            </p>
          </div>

          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-sm text-white mb-1">Produto</h3>
              <a href="#como-funciona" className="text-sm text-white/70 hover:text-white transition-colors">
                Como funciona
              </a>
              <a href="#para-quem" className="text-sm text-white/70 hover:text-white transition-colors">
                Para quem
              </a>
              <a href="#planos" className="text-sm text-white/70 hover:text-white transition-colors">
                Planos
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-sm text-white mb-1">Empresa</h3>
              <a href="mailto:contact@beorigo.app" className="text-sm text-white/70 hover:text-white transition-colors">
                Contato
              </a>
              <a href="/privacidade" className="text-sm text-white/70 hover:text-white transition-colors">
                Privacidade
              </a>
              <a href="/termos" className="text-sm text-white/70 hover:text-white transition-colors">
                Termos de uso
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-sm text-white mb-1">Redes sociais</h3>
              <div className="flex gap-3">
                <a href="https://instagram.com/beorigo" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                  <Image src="/assets/social-icon-1.svg" alt="Instagram" width={24} height={24} />
                </a>
                <a href="https://linkedin.com/company/beorigo" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                  <Image src="/assets/social-icon-2.svg" alt="LinkedIn" width={24} height={24} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-sm text-white/50">
            © 2024 beOrigo. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
