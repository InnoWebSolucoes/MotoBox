/* ============================================================
   MOTOBOX — Peças do Campeonato, no desenho do painel
   Etiquetas, número de posição, fichas de dados, títulos de
   secção e avisos, partilhados pelo calendário, resultados,
   classificação, pilotos, equipas e bilhetes. Sem hooks nem
   "use client": servem a componentes de servidor e de cliente.
   ============================================================ */

import Link from "next/link";
import type { ReactNode } from "react";
import { Seta } from "@/components/painel/kit";
import { TABELA_RESULTADOS_PADRAO } from "@/lib/conteudo/grupos/geral";

type Tom = "neutro" | "vermelho" | "contorno" | "vidro" | "directo";

const TONS: Record<Tom, string> = {
  neutro: "bg-white/10 text-white/85",
  vermelho: "bg-mb-red text-white",
  contorno: "text-white/80 ring-1 ring-inset ring-white/25",
  vidro: "bg-black/65 text-white",
  directo: "bg-mb-red text-white",
};

/** Etiqueta pequena (estado, disciplina, ronda), com os cantos do painel. */
export function Etiqueta({
  children,
  tom = "neutro",
  className = "",
}: {
  children: ReactNode;
  tom?: Tom;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] px-2 text-xs leading-none ${TONS[tom]} ${className}`}
    >
      {tom === "directo" && <span aria-hidden className="live-dot size-1.5 rounded-full bg-white" />}
      {children}
    </span>
  );
}

/**
 * Posição numa corrida ou na tabela: quadrado com o número. O líder fica a
 * vermelho, o pódio mais claro, o resto discreto. Zero é "não classificado".
 */
export function Posicao({
  posicao, className = "size-8 text-sm", naoClassificado = TABELA_RESULTADOS_PADRAO.naoClassificado,
}: { posicao: number; className?: string; naoClassificado?: string }) {
  if (!posicao || posicao <= 0) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-[4px] bg-white/5 text-[0.7rem] text-white/50 ${className}`}>
        <span aria-hidden>NC</span>
        <span className="sr-only">{naoClassificado}</span>
      </span>
    );
  }
  const cor = posicao === 1 ? "bg-mb-red text-white" : posicao <= 3 ? "bg-white/15 text-white" : "bg-white/5 text-white/80";
  return (
    <span className={`grid shrink-0 place-items-center rounded-[4px] font-semibold tabular-nums ${cor} ${className}`}>
      <span className="sr-only">Posição </span>
      {posicao}
    </span>
  );
}

/** "MV": melhor volta da corrida. */
export function MelhorVolta({ rotulo = TABELA_RESULTADOS_PADRAO.melhorVolta }: { rotulo?: string }) {
  return (
    <span title={rotulo} className="shrink-0 rounded-[3px] bg-mb-red/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-mb-red-light">
      <span aria-hidden>MV</span>
      <span className="sr-only">{rotulo}</span>
    </span>
  );
}

/** Ficha escura com título e linhas "chave · valor" (circuito, carreira, equipa...). */
export function Ficha({
  titulo,
  icone,
  linhas,
  children,
  className = "",
}: {
  titulo: ReactNode;
  icone?: ReactNode;
  linhas?: [string, ReactNode][];
  children?: ReactNode;
  className?: string;
}) {
  const visiveis = (linhas ?? []).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return (
    <div className={`painel painel-escuro p-6 ${className}`}>
      <h3 className="flex items-center gap-2.5 text-lg font-semibold">
        {icone && <span aria-hidden className="text-mb-red-light [&_svg]:size-5">{icone}</span>}
        {titulo}
      </h3>
      {visiveis.length > 0 && (
        <dl className="mt-4 divide-y divide-white/8">
          {visiveis.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <dt className="shrink-0 text-sm text-white/55">{k}</dt>
              <dd className="min-w-0 text-right text-sm text-white">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </div>
  );
}

/** Título de secção com uma nota ou uma ligação à direita. */
export function TituloSeccao({
  titulo,
  nota,
  accao,
  className = "",
}: {
  titulo: ReactNode;
  nota?: ReactNode;
  accao?: { href: string; texto: string };
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${className}`}>
      <h2 className="titulo-3 text-balance">{titulo}</h2>
      {nota && <p className="text-sm text-white/60">{nota}</p>}
      {accao && <LigacaoSeta href={accao.href}>{accao.texto}</LigacaoSeta>}
    </div>
  );
}

/** Ligação sublinhada com a seta que salta. */
export function LigacaoSeta({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2 text-sm text-white ${className}`}>
      <span className="sublinhado">{children}</span>
      <Seta className="size-3" />
    </Link>
  );
}

/** Painel de aviso, quando uma lista fica vazia ou uma venda está fechada. */
export function Aviso({
  titulo,
  children,
  icone,
  className = "",
}: {
  titulo: ReactNode;
  children?: ReactNode;
  icone?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`painel painel-escuro flex flex-col items-start gap-4 p-8 md:p-10 ${className}`}>
      {icone && (
        <span aria-hidden className="grid size-10 place-items-center rounded-[4px] bg-white/8 text-white/80 [&_svg]:size-5">
          {icone}
        </span>
      )}
      <div>
        <p className="text-lg font-semibold">{titulo}</p>
        {children && <div className="mt-2 max-w-[60ch] text-sm leading-relaxed text-white/65">{children}</div>}
      </div>
    </div>
  );
}

/** Legenda das abreviaturas das tabelas de resultados (editável em Provas › Páginas do campeonato › Resultados). */
export function LegendaResultados({
  className = "", itens = TABELA_RESULTADOS_PADRAO.legenda,
}: { className?: string; itens?: string[] }) {
  const visiveis = itens.filter((i) => i.trim());
  if (visiveis.length === 0) return null;
  return (
    <p className={`flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-white/50 ${className}`}>
      {visiveis.map((i, n) => <span key={n}>{i}</span>)}
    </p>
  );
}

/** Iniciais de um nome, para os retratos sem fotografia. */
export function iniciais(nome: string): string {
  return nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

/** Emblema redondo de uma equipa: as letras do logótipo na cor da equipa. */
export function EmblemaEquipa({
  logo,
  cor,
  className = "size-10 text-xs",
}: {
  logo: string;
  cor: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-[4px] font-semibold tracking-wide text-white ${className}`}
      style={{ background: cor }}
    >
      {logo}
    </span>
  );
}

/**
 * Fotografia de uma equipa: a própria, se houver; senão, a da província onde
 * tem base (as equipas ainda não têm arquivo fotográfico).
 */
const FOTO_PROVINCIA: Record<string, string> = {
  Luanda: "kilamba",
  Benguela: "benguela",
  "Huíla": "lubango",
  Namibe: "namibe",
  Huambo: "huambo",
  Cabinda: "geral",
};

export function fotoEquipa(e: { slug: string; provincia: string; tipo: string }, capa?: string): string[] {
  // A fotografia de capa gravada no painel (Equipas) vem primeiro.
  const base = [e.slug, FOTO_PROVINCIA[e.provincia] ?? (e.tipo === "Clube" ? "passeios" : "competicao")];
  return capa ? [capa, ...base] : base;
}
