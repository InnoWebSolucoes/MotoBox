import Link from "next/link";
import { Retrato } from "@/components/Brand";
import { Seccao } from "@/components/painel/blocos";
import { Monograma, Seta } from "@/components/painel/kit";
import { TEMPORADA, classificacaoEquipas, classificacaoPilotos } from "@/lib/data";
import { doCampeonato, instante } from "@/lib/desporto";
import type { Corrida, Equipa, Evento, Piloto } from "@/lib/types";
import { LinhaEvento } from "@/app/calendario/ListaEventos";
import { FilaPilotos, Posicao, ProximaProva, TituloBloco, UltimosResultados, Vazio, iniciais } from "./Partes";

/* ============================================================
   MOTOBOX — O Campeonato Nacional, em blocos do painel
   Próxima prova, classificação, últimos resultados, calendário,
   pilotos e equipas: o que o site mostrava nas antigas secções
   Calendário, Resultados e Pilotos. Usado na página Desporto
   (todas as provas) e no Motocross (só as dele). Vem sempre
   depois de outra secção, por isso nenhuma tem margem de cima.
   ============================================================ */

/** Margem das âncoras: o logótipo e a faixa de Desporto flutuam no topo. */
const ANCORA = "!scroll-mt-28";

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
  const classificacao = classificacaoPilotos(pilotos.filter(doCampeonato));
  const topPilotos = classificacao.slice(0, 5);
  const topEquipas = classificacaoEquipas(equipas.filter((e) => e.tipo === "Equipa")).slice(0, 6);
  const cores = new Map(equipas.map((e) => [e.slug, e.cor]));
  // Mais recentes primeiro: a lista vem por data crescente.
  const ultimas = [...corridas].reverse().slice(0, 2);

  return (
    <>
      {proxima && (
        <Seccao className="!pt-0">
          <ProximaProva e={proxima} bilheteiraAberta={bilheteiraAberta} />
        </Seccao>
      )}

      {/* ============ CLASSIFICAÇÃO + RESULTADOS ============ */}
      <Seccao id="campeonato" className={`!pt-0 ${ANCORA}`}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-x-16">
          <div>
            <TituloBloco
              sobretitulo={`Campeonato Nacional ${TEMPORADA}`}
              titulo="Classificação"
              accao={{ href: "/classificacao", texto: "Tabela completa" }}
            />
            <div className="mt-8">
              {topPilotos.length === 0 ? (
                <Vazio
                  titulo="Classificação por publicar"
                  texto="A tabela aparece depois da primeira prova pontuável da temporada."
                />
              ) : (
                <ol className="grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)]">
                  {topPilotos.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/pilotos/${p.slug}`}
                        className="painel painel-escuro group flex items-center gap-3 p-2.5 pr-4 sm:gap-4 sm:p-3 sm:pr-5"
                      >
                        <Posicao n={p.posicao} />
                        <span
                          className="h-10 w-1 shrink-0 rounded-full bg-white/15"
                          style={{ background: cores.get(p.equipaSlug) }}
                          aria-hidden
                        />
                        <Retrato
                          nome={p.slug}
                          iniciais={iniciais(p.nome)}
                          cor={cores.get(p.equipaSlug)}
                          className="size-11 shrink-0 rounded-[4px]"
                          tamanhos="44px"
                          largura={120}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold transition-colors group-hover:text-mb-red-light sm:text-base">
                            {p.nome}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {p.equipa} · {p.categoria}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="text-xl font-semibold tabular-nums">{p.estatisticas.pontos}</span>
                          <span className="ml-1 text-xs text-white/50">pts</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div>
            <TituloBloco sobretitulo="Arquivo" titulo="Últimos resultados" accao={{ href: "/resultados", texto: "Arquivo" }} />
            <div className="mt-8">
              {ultimas.length === 0 ? (
                <Vazio
                  titulo="Sem resultados publicados"
                  texto="Os resultados aparecem aqui assim que a primeira corrida da temporada terminar."
                />
              ) : (
                <UltimosResultados corridas={ultimas} />
              )}
            </div>
          </div>
        </div>
      </Seccao>

      {/* ============ CALENDÁRIO ============ */}
      <Seccao id="calendario" className={`!pt-0 ${ANCORA}`}>
        <TituloBloco
          sobretitulo={`Temporada ${TEMPORADA}`}
          titulo="Calendário"
          accao={{ href: "/calendario", texto: "Todas as provas" }}
        />
        <div className="mt-8">
          {provas.length === 0 ? (
            <Vazio titulo="Sem provas agendadas" texto="As próximas provas aparecem aqui assim que forem anunciadas." />
          ) : (
            // As linhas são do calendário (app/calendario/ListaEventos.tsx) e trazem o seu intervalo.
            <ol>
              {provas.map((e) => (
                <LinhaEvento key={e.slug} e={e} agora={agora} bilheteiraAberta={bilheteiraAberta} />
              ))}
            </ol>
          )}
        </div>
      </Seccao>

      {/* ============ PILOTOS ============ */}
      {classificacao.length > 0 && (
        <Seccao id="pilotos" className={`!pt-0 ${ANCORA}`}>
          <TituloBloco sobretitulo="Grelha" titulo="Pilotos" accao={{ href: "/pilotos", texto: "Todos os pilotos" }} />
          <div className="mt-8">
            <FilaPilotos pilotos={classificacao.slice(0, 8)} cores={cores} />
          </div>
        </Seccao>
      )}

      {/* ============ EQUIPAS ============ */}
      {topEquipas.length > 0 && (
        <Seccao id="equipas" className={`!pt-0 ${ANCORA}`}>
          <TituloBloco sobretitulo="Estruturas" titulo="Equipas" accao={{ href: "/equipas", texto: "Todas as equipas" }} />
          <ol className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-3">
            {topEquipas.map((e) => (
              <li key={e.slug}>
                <Link href={`/equipas/${e.slug}`} className="painel painel-escuro group flex h-full items-center gap-4 p-4 pr-5">
                  <span className="w-5 shrink-0 text-center text-sm font-semibold text-white/50 tabular-nums">{e.posicao}</span>
                  <Monograma nome={e.nome} cor={e.cor} className="size-11 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold transition-colors group-hover:text-mb-red-light">
                      {e.nome}
                    </span>
                    <span className="block truncate text-xs text-white/55">
                      {e.base}, {e.provincia}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="text-lg font-semibold tabular-nums">{e.estatisticas.pontos}</span>
                    <span className="ml-1 text-xs text-white/50">pts</span>
                  </span>
                  <Seta className="size-3 text-white/60" />
                </Link>
              </li>
            ))}
          </ol>
        </Seccao>
      )}
    </>
  );
}
