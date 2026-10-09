/* Cartão de piloto, no desenho do painel: retrato com os cantos do painel,
   posição e número por cima, nome e números da época por baixo. Usado na
   grelha de pilotos e no plantel de cada equipa. Sem hooks. */

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Retrato } from "@/components/Brand";
import { Seta } from "@/components/painel/kit";
import type { Piloto } from "@/lib/types";
import { Etiqueta, iniciais } from "@/app/calendario/pecas";
import { retratoDe } from "@/lib/desporto";

export function CartaoPiloto({
  piloto: p,
  posicao,
  cor,
}: {
  piloto: Piloto;
  /** Lugar na classificação geral; sem ela não se mostra. */
  posicao?: number;
  /** Cor da equipa: fundo do retrato sem fotografia e o ponto ao lado da equipa. */
  cor?: string;
}) {
  return (
    <Link
      href={`/pilotos/${p.slug}`}
      className="painel painel-escuro group grid grid-cols-[7.5rem_minmax(0,1fr)] gap-[var(--intervalo)] p-[var(--intervalo)] sm:flex sm:flex-col"
    >
      {/* No telemóvel o retrato fica ao lado do texto; a partir de sm, por cima. */}
      <div className="relative aspect-[4/5] self-start overflow-hidden rounded-[var(--raio)] sm:self-auto">
        <Retrato
          nome={retratoDe(p)}
          iniciais={iniciais(p.nome)}
          cor={cor}
          className="foto-painel absolute inset-0 [container-type:size]"
          largura={700}
          tamanhos="(max-width: 640px) 120px, (max-width: 1280px) 33vw, 25vw"
        />
        <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
        {posicao ? (
          <span
            className={`absolute left-2 top-2 grid h-7 min-w-7 place-items-center rounded-[4px] px-1.5 text-sm font-semibold tabular-nums sm:left-3 sm:top-3 sm:h-9 sm:min-w-9 sm:px-2 sm:text-base ${
              posicao === 1 ? "bg-mb-red" : "bg-black/65"
            }`}
          >
            <span className="sr-only">Posição na classificação: </span>
            {posicao}.º
          </span>
        ) : null}
        <span aria-hidden className="absolute right-2 top-1.5 hidden text-5xl font-semibold leading-none tabular-nums text-white/35 sm:right-3 sm:block">
          {p.numero}
        </span>
        {p.campeonatos > 0 && (
          <Etiqueta tom="vidro" className="absolute bottom-3 left-3 !hidden sm:!inline-flex">
            <Trophy className="size-3.5" aria-hidden />
            {p.campeonatos}× campeão nacional
          </Etiqueta>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2 pl-2.5 sm:p-4 sm:pt-5">
        <p className="text-[0.8125rem] text-mb-red-light">
          {p.categoria}
          <span aria-hidden className="text-white/45 sm:hidden"> · #{p.numero}</span>
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-snug tracking-tight sm:text-xl">
          <span className="sr-only">#{p.numero} </span>
          {p.nome}
        </h3>
        <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-white/60">
          {cor && <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: cor }} />}
          <span className="truncate">{p.equipa}</span>
        </p>
        {p.campeonatos > 0 && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/70 sm:hidden">
            <Trophy className="size-3.5" aria-hidden />
            {p.campeonatos}× campeão nacional
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-3 sm:pt-5">
          <dl className="flex gap-4 sm:gap-5">
            {(
              [
                ["Pts", p.estatisticas.pontos],
                ["Vit", p.estatisticas.vitorias],
                ["Pód", p.estatisticas.podios],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-white/50">{k}</dt>
                <dd className="text-xl font-semibold leading-none tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <Seta className="mb-1 size-3.5" />
        </div>
      </div>
    </Link>
  );
}
