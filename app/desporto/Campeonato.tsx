import Link from "next/link";
import { Retrato } from "@/components/Brand";
import { EmptyState, PosicaoBadge, SectionHead } from "@/components/ui";
import { TEMPORADA, classificacaoEquipas, classificacaoPilotos } from "@/lib/data";
import { instante } from "@/lib/desporto";
import type { Corrida, Equipa, Evento, Piloto } from "@/lib/types";
import { LinhaEvento } from "@/app/calendario/ListaEventos";
import { FilaPilotos, ProximaProva, UltimosResultados, iniciais } from "./Partes";

/* ============================================================
   MOTOBOX — O Campeonato Nacional, em blocos
   Próxima prova, classificação, últimos resultados, calendário,
   pilotos e equipas: o que o site mostrava nas antigas secções
   Calendário, Resultados e Pilotos. Usado na página Desporto
   (todas as provas) e no Motocross (só as dele).
   ============================================================ */

export function Campeonato({
  provas, corridas, pilotos, equipas, bilheteiraAberta,
}: {
  /** Provas a mostrar no calendário, por data. */
  provas: Evento[];
  corridas: Corrida[];
  pilotos: Piloto[];
  equipas: Equipa[];
  /** Interruptor "Bilheteira aberta" das Definições. */
  bilheteiraAberta: boolean;
}) {
  const agora = instante();
  const proxima = provas.find((e) => new Date(e.dataInicio).getTime() > agora);
  const classificacao = classificacaoPilotos(pilotos);
  const topPilotos = classificacao.slice(0, 5);
  const topEquipas = classificacaoEquipas(equipas.filter((e) => e.tipo === "Equipa")).slice(0, 6);
  const cores = new Map(equipas.map((e) => [e.slug, e.cor]));
  // Mais recentes primeiro: a lista vem por data crescente.
  const ultimas = [...corridas].reverse().slice(0, 2);

  return (
    <>
      {proxima && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-4">
          <ProximaProva e={proxima} bilheteiraAberta={bilheteiraAberta} />
        </section>
      )}

      {/* ============ CLASSIFICAÇÃO + RESULTADOS ============ */}
      <section id="campeonato" className="mx-auto max-w-7xl scroll-mt-28 px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 gap-x-14 gap-y-14 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <SectionHead
              eyebrow={`Campeonato Nacional ${TEMPORADA}`}
              titulo="Classificação"
              acao={{ href: "/classificacao", texto: "Tabela completa" }}
            />
            {topPilotos.length === 0 ? (
              <div className="mt-7">
                <EmptyState
                  titulo="Classificação por publicar"
                  descricao="A tabela aparece depois da primeira prova pontuável da temporada."
                />
              </div>
            ) : (
              <ol className="mt-7">
                {topPilotos.map((p) => (
                  <li key={p.slug} className="border-b border-white/6 last:border-0">
                    <Link href={`/pilotos/${p.slug}`} className="group flex items-center gap-4 py-3.5">
                      <PosicaoBadge posicao={p.posicao} />
                      <span
                        className="h-10 w-1 shrink-0 rounded-full bg-ink-700"
                        style={{ background: cores.get(p.equipaSlug) }}
                        aria-hidden
                      />
                      <Retrato nome={p.slug} iniciais={iniciais(p.nome)} className="size-11 shrink-0 rounded-full" tamanhos="44px" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg uppercase leading-tight text-white truncate transition-colors group-hover:text-mb-red">
                          {p.nome}
                        </p>
                        <p className="text-xs text-ink-500 truncate">{p.equipa} · {p.categoria}</p>
                      </div>
                      <p className="shrink-0 font-display text-xl text-white tabular-nums">
                        {p.estatisticas.pontos}
                        <span className="ml-1 text-xs text-ink-500">PTS</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <SectionHead eyebrow="Arquivo" titulo="Últimos resultados" acao={{ href: "/resultados", texto: "Arquivo" }} />
            <div className="mt-7">
              {ultimas.length === 0 ? (
                <EmptyState
                  titulo="Sem resultados publicados"
                  descricao="Os resultados aparecem aqui assim que a primeira corrida da temporada terminar."
                />
              ) : (
                <UltimosResultados corridas={ultimas} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CALENDÁRIO ============ */}
      <section id="calendario" className="scroll-mt-28 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <SectionHead
            eyebrow={`Temporada ${TEMPORADA}`}
            titulo="Calendário"
            acao={{ href: "/calendario", texto: "Todas as provas" }}
          />
          {provas.length === 0 ? (
            <div className="mt-7">
              <EmptyState titulo="Sem provas agendadas" descricao="As próximas provas aparecem aqui assim que forem anunciadas." />
            </div>
          ) : (
            <ol className="mt-4">
              {provas.map((e) => (
                <LinhaEvento key={e.slug} e={e} agora={agora} bilheteiraAberta={bilheteiraAberta} />
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ============ PILOTOS ============ */}
      {classificacao.length > 0 && (
        <section id="pilotos" className="mx-auto max-w-7xl scroll-mt-28 px-4 sm:px-6 py-14">
          <SectionHead eyebrow="Grelha" titulo="Pilotos" acao={{ href: "/pilotos", texto: "Todos os pilotos" }} />
          <div className="mt-8">
            <FilaPilotos pilotos={classificacao.slice(0, 8)} cores={cores} />
          </div>
        </section>
      )}

      {/* ============ EQUIPAS ============ */}
      {topEquipas.length > 0 && (
        <section id="equipas" className="mx-auto max-w-7xl scroll-mt-28 px-4 sm:px-6 pb-16">
          <SectionHead eyebrow="Estruturas" titulo="Equipas" acao={{ href: "/equipas", texto: "Todas as equipas" }} />
          <div className="mt-7 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {topEquipas.map((e) => (
              <Link
                key={e.slug}
                href={`/equipas/${e.slug}`}
                className="group flex items-center gap-4 border-b border-white/6 py-4"
              >
                <span className="font-display text-xl text-ink-500 tabular-nums w-5">{e.posicao}</span>
                <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: e.cor }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                    {e.nome}
                  </span>
                  <span className="block truncate text-xs text-ink-500">{e.base}, {e.provincia}</span>
                </span>
                <span className="font-display text-lg text-white tabular-nums">
                  {e.estatisticas.pontos}
                  <span className="ml-1 text-xs text-ink-500">PTS</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
