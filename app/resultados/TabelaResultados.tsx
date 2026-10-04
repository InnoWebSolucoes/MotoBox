/* Classificação de uma corrida, em linhas do painel: posição, piloto (com a
   melhor volta), equipa, voltas, tempo ou diferença para o vencedor e pontos.
   No telemóvel, a equipa e as voltas descem para baixo do nome e o tempo
   fica por cima dos pontos: nada se perde e a página não rola de lado.
   Sem hooks: serve a páginas de servidor. */

import Link from "next/link";
import type { ResultadoCorrida } from "@/lib/types";
import { MelhorVolta, Posicao } from "@/app/calendario/pecas";

const COLUNAS = "md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,11rem)_4rem_7rem_3.5rem]";

export function TabelaResultados({
  resultados,
  className = "",
}: {
  resultados: ResultadoCorrida[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div aria-hidden className={`hidden items-end gap-x-4 px-4 pb-3 text-xs text-white/50 md:grid ${COLUNAS}`}>
        <span>Pos</span>
        <span>Piloto</span>
        <span>Equipa</span>
        <span className="text-right">Voltas</span>
        <span className="text-right">Tempo</span>
        <span className="text-right">Pts</span>
      </div>
      <ol className="grid gap-[var(--intervalo)]">
        {resultados.map((r) => (
          <li key={r.pilotoSlug}>
            <Link
              href={`/pilotos/${r.pilotoSlug}`}
              className={`painel painel-escuro group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-3 transition-colors hover:bg-white/5 md:gap-x-4 md:px-4 ${COLUNAS} ${
                r.estado ? "opacity-60" : ""
              }`}
            >
              <Posicao posicao={r.posicao} />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium transition-colors group-hover:text-mb-red-light">{r.piloto}</span>
                  {r.melhorVolta && <MelhorVolta />}
                </span>
                <span className="mt-0.5 block truncate text-xs text-white/55 md:hidden">
                  {r.equipa} · <span className="tabular-nums">{r.voltas}</span> {r.voltas === 1 ? "volta" : "voltas"}
                </span>
              </span>
              <span className="hidden truncate text-sm text-white/70 md:block">{r.equipa}</span>
              <span className="hidden text-right text-sm tabular-nums text-white/70 md:block">
                <span className="sr-only">Voltas: </span>
                {r.voltas}
              </span>
              {/* No telemóvel, tempo e pontos empilhados; a partir de md, cada um na sua coluna */}
              <span className="flex flex-col items-end gap-0.5 md:contents">
                <span className="text-right text-sm tabular-nums text-white/85">
                  <span className="sr-only">Tempo: </span>
                  {r.estado ?? r.tempo}
                </span>
                <span className="text-right text-xs tabular-nums text-white/60 md:text-[15px] md:font-semibold md:text-white">
                  {r.pontos}
                  <span className="md:sr-only"> pts</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
