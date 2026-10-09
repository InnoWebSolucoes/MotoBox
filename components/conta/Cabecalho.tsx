"use client";

/* ============================================================
   MOTOBOX — Área de membro: cabeçalho pessoal
   A fotografia da mota (ou do clube) por trás, o avatar, o nome,
   desde quando é membro, a província, o selo de verificado, o
   nível com a barra até ao próximo, e as acções rápidas.
   ============================================================ */

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CalendarDays, ChevronRight, MapPin, MessageSquarePlus, Plus, Settings2, Trophy } from "lucide-react";
import { SeloVerificado } from "@/components/SeloVerificado";
import { Icon } from "@/components/ui";
import { FotoFundo, Seta } from "@/components/painel/kit";
import { ACCOES_PONTOS, type AccaoPontos } from "@/lib/conteudo/grupos/contas";
import type { Nivel, Contagens } from "./nivel";
import { valorDe } from "./nivel";
import { AvatarConta, Janela, f, mesAno, useAgora, useTextosConta } from "./partes";

function Saudacao() {
  const t = useTextosConta().cabecalho;
  const agora = useAgora();
  if (!agora) return <span>&nbsp;</span>;
  // Hora de Luanda (UTC+1, sem hora de Verão).
  const hora = new Date(agora * 1000 + 3_600_000).getUTCHours();
  return <span>{hora < 5 || hora >= 19 ? t.boaNoite : hora < 12 ? t.bomDia : t.boaTarde}</span>;
}

function Meta({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-[4px] bg-black/45 px-2.5 py-1.5 text-sm text-white backdrop-blur-sm [&_svg]:size-4 [&_svg]:shrink-0">
      {icone}
      {children}
    </li>
  );
}

function Accao({ children, icone, onClick, href, principal = false }: {
  children: ReactNode; icone: ReactNode; onClick?: () => void; href?: string; principal?: boolean;
}) {
  const classes = `group flex min-h-16 items-center gap-3 rounded-[var(--raio)] px-4 py-3 text-left text-[15px] leading-tight text-white transition-colors ${
    principal ? "bg-mb-red hover:bg-mb-red-dark" : "bg-black/45 backdrop-blur-md hover:bg-black/65"
  }`;
  const corpo = (
    <>
      <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-[4px] [&_svg]:size-[18px] ${principal ? "bg-white/20" : "bg-mb-red"}`}>
        {icone}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      <Seta para="direita" className="size-3.5" />
    </>
  );
  return href ? <Link href={href} className={classes}>{corpo}</Link> : <button type="button" onClick={onClick} className={classes}>{corpo}</button>;
}

export function Cabecalho({
  nome, email, avatar, verificado, provincia, desde, foto, nivel, contagens,
  marketplaceAberto, aSair, aoEditarPerfil, aoPublicar, aoSair,
}: {
  nome: string; email: string; avatar: { url: string | null; cor: string };
  verificado: boolean; provincia: string | null; desde: string | null;
  foto: (string | undefined)[]; nivel: Nivel; contagens: Contagens;
  marketplaceAberto: boolean; aSair: boolean;
  aoEditarPerfil: () => void; aoPublicar: () => void; aoSair: () => void;
}) {
  const t = useTextosConta();
  const c = t.cabecalho;
  const [regras, setRegras] = useState(false);
  const membroDesde = mesAno(desde);

  return (
    <header className="painel isolate">
      <FotoFundo nome={foto} veu="nenhum" tamanhos="100vw" prioridade />
      {/* Véu forte: o texto lê-se sobre qualquer fotografia. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[rgb(30_30_36/0.94)] via-[rgb(30_30_36/0.78)] to-[rgb(30_30_36/0.45)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(30_30_36/0.9)] to-transparent" />

      <div className="flex justify-end px-4 pt-4 md:px-6">
        <button type="button" onClick={aoSair} disabled={aSair}
          className="inline-flex h-9 items-center gap-2 rounded-[var(--raio)] bg-black/45 px-3.5 text-sm text-white backdrop-blur-md transition-colors hover:bg-black/65 disabled:opacity-60">
          <Icon name="logout" className="size-4" />
          {aSair ? c.aSair : c.sair}
        </button>
      </div>

      <div className="grid gap-6 px-5 pb-6 pt-2 md:px-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end lg:gap-10 lg:px-10 lg:pb-8">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
          <button type="button" onClick={aoEditarPerfil} aria-label={c.alterarFoto} title={c.alterarFoto}
            className="group relative w-fit shrink-0 rounded-full">
            <AvatarConta url={avatar.url} cor={avatar.cor} nome={nome} className="size-24 text-3xl ring-4 ring-white/15 md:size-28 md:text-4xl" />
            <span aria-hidden
              className="absolute bottom-0.5 right-0.5 grid size-8 place-items-center rounded-full bg-white text-ink-950 shadow-lg transition-colors group-hover:bg-mb-red group-hover:text-white">
              <Settings2 className="size-4" />
            </span>
          </button>
          <div className="min-w-0">
            <p className="sobretitulo text-white/85"><Saudacao /></p>
            <h1 className="titulo-2 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 break-words text-white [text-shadow:0_1px_14px_rgb(0_0_0/0.4)]">
              <span className="min-w-0 break-words">{nome}</span>
              {verificado && <SeloVerificado tamanho={30} rotulo={c.verificado} />}
            </h1>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {membroDesde && <Meta icone={<CalendarDays aria-hidden />}>{f(c.membroDesde, { data: membroDesde })}</Meta>}
              <Meta icone={<MapPin aria-hidden />}>{provincia || c.semProvincia}</Meta>
              {verificado && <Meta icone={<Icon name="verified" />}>{c.verificado}</Meta>}
            </ul>
            <p className="sr-only">{email}</p>
          </div>
        </div>

        {/* Nível */}
        <div className="rounded-[var(--raio)] bg-black/50 p-5 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-white/80">{c.nivel} {nivel.indice + 1}</p>
              <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-white">{nivel.actual.nome}</p>
            </div>
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-[4px] bg-gold text-black">
              <Trophy className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-sm tabular-nums text-white">{f(c.pontos, { pontos: nivel.pontos })}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(nivel.progresso * 100)}
            aria-label={nivel.proximo ? f(c.proximoNivel, { faltam: nivel.proximo.pontos - nivel.pontos, nivel: nivel.proximo.nome }) : c.nivelMaximo}>
            <div className="h-full rounded-full bg-gradient-to-r from-mb-red to-gold motion-safe:transition-[width] motion-safe:duration-700"
              style={{ width: `${Math.max(4, nivel.progresso * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-white/85">
            {nivel.proximo ? f(c.proximoNivel, { faltam: nivel.proximo.pontos - nivel.pontos, nivel: nivel.proximo.nome }) : c.nivelMaximo}
          </p>
          <button type="button" onClick={() => setRegras(true)}
            className="mt-3 inline-flex items-center gap-1 text-sm text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
            {c.comoGanhar}
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Acções rápidas */}
      <nav aria-label="Acções rápidas" className="grid grid-cols-1 gap-[var(--intervalo)] p-[var(--intervalo)] min-[420px]:grid-cols-2 lg:grid-cols-4">
        {marketplaceAberto && <Accao principal icone={<Plus />} onClick={aoPublicar}>{t.accoes.publicar}</Accao>}
        <Accao icone={<MessageSquarePlus />} href={t.accoes.topicoLigacao || "/forum/novo"}>{t.accoes.topico}</Accao>
        <Accao icone={<CalendarDays />} href={t.accoes.eventosLigacao || "/eventos"}>{t.accoes.eventos}</Accao>
        <Accao icone={<Settings2 />} onClick={aoEditarPerfil}>{t.accoes.perfil}</Accao>
      </nav>

      {regras && <RegrasPontos contagens={contagens} aoFechar={() => setRegras(false)} />}
    </header>
  );
}

function RegrasPontos({ contagens, aoFechar }: { contagens: Contagens; aoFechar: () => void }) {
  const t = useTextosConta();
  return (
    <Janela titulo={t.pontos.titulo} aoFechar={aoFechar}>
      <p className="text-[15px] leading-relaxed text-white/85">{t.pontos.texto}</p>
      <ul className="mt-5 divide-y divide-white/10">
        {ACCOES_PONTOS.map((a: AccaoPontos) => {
          const valor = valorDe(t, a);
          const feito = (contagens[a] ?? 0) * valor;
          return (
            <li key={a} className="flex items-center gap-3 py-3">
              <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full ${feito ? "bg-ok text-white" : "border border-white/35"}`}>
                {feito > 0 && <Icon name="check" className="size-3.5" />}
              </span>
              <span className="min-w-0 flex-1 text-[15px] text-white">{t.pontos.nomes[a]}</span>
              <span className="shrink-0 text-sm tabular-nums text-white/85">
                +{valor}{feito > 0 && <span className="ml-2 text-[#86efac]">({feito})</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </Janela>
  );
}
