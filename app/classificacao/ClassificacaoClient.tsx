"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, ListOrdered } from "lucide-react";
import { Retrato } from "@/components/Brand";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Seccao } from "@/components/painel/blocos";
import { TEMPORADA } from "@/lib/data";
import type { Equipa, Piloto } from "@/lib/types";
import { CLASSIFICACAO_PADRAO, contar, preencher, type TextosClassificacao } from "@/lib/conteudo/grupos/geral";
import { useIdioma } from "@/lib/i18n/contexto";
import { CATEGORIAS_CAMPEONATO, CATEGORIAS_PILOTO, categoriasComPilotos, doCampeonatoDe, retratoDe } from "@/lib/desporto";
import { Aviso, EmblemaEquipa, Posicao, iniciais } from "@/app/calendario/pecas";

type PilotoClass = Piloto & { posicao: number };
type EquipaClass = Equipa & { posicao: number };

/** "1.º" em português, "1st" em inglês. */
function ordinal(n: number, idioma: string) {
  if (idioma !== "en") return { n, sufixo: ".º" };
  const s = n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th";
  return { n, sufixo: s };
}

/** Colunas das duas tabelas a partir de md; no telemóvel os números descem para baixo do nome. */
const COL_PILOTOS = "md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,11rem)_3.5rem_3.5rem_3.5rem_5rem]";
const COL_EQUIPAS = "md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,9rem)_3.5rem_3.5rem_3.5rem_5rem]";

/** As definições do campeonato editadas no painel (Modalidades › Página Desporto). */
const CAMPEONATO_PADRAO = {
  nome: "Campeonato Nacional",
  categorias: [...CATEGORIAS_CAMPEONATO],
  categoriasPiloto: [...CATEGORIAS_PILOTO] as string[],
};

export function ClassificacaoClient({
  pilotos,
  equipas,
  campeonato = CAMPEONATO_PADRAO,
  textos: tx = CLASSIFICACAO_PADRAO(),
  ano = TEMPORADA,
}: {
  pilotos: PilotoClass[];
  equipas: EquipaClass[];
  campeonato?: { nome: string; categorias: string[]; categoriasPiloto: string[] };
  /** Textos fixos (Provas › Páginas do campeonato › Classificação). */
  textos?: TextosClassificacao;
  /** Temporada em curso (Definições). */
  ano?: number;
}) {
  const { idioma } = useIdioma();
  const [aba, setAba] = useState<"pilotos" | "equipas">("pilotos");
  const [categoria, setCategoria] = useState("Todas");
  // Só as categorias com pilotos, pela ordem de sempre (MX1, MX2, Rally / Enduro, Velocidade, Moto 4, Karting).
  const categorias = useMemo(() => categoriasComPilotos(pilotos, campeonato.categoriasPiloto), [pilotos, campeonato.categoriasPiloto]);

  const lista = useMemo(() => {
    // "Todas" é a geral do Campeonato Nacional: velocidade, moto 4 e karting têm a sua tabela à parte.
    const filtrados = categoria === "Todas"
      ? pilotos.filter(doCampeonatoDe(campeonato.categorias))
      : pilotos.filter((p) => p.categoria === categoria);
    return filtrados.map((p, i) => ({ ...p, posicao: i + 1 }));
  }, [pilotos, categoria, campeonato.categorias]);

  const lider = lista[0];
  const maxPontos = lista[0]?.estatisticas.pontos || 1;
  const corEquipa = useMemo(() => new Map(equipas.map((e) => [e.slug, e.cor])), [equipas]);

  return (
    <PaginaInterior icone={<ListOrdered />}>
      <Abertura
        compacta
        foto={tx.foto}
        sobretitulo={preencher(tx.sobretitulo, { campeonato: campeonato.nome, ano })}
        titulo={tx.titulo}
        texto={tx.texto}
      />

      <Seccao>
        {/* Abas e filtro de categoria */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={tx.abas.rotulo} className="flex h-11 items-center gap-1 rounded-[var(--raio)] bg-white/7 p-1">
            {(["pilotos", "equipas"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAba(a)}
                aria-pressed={aba === a}
                className={`inline-flex h-9 items-center rounded-[4px] px-4 text-[15px] transition-colors ${
                  aba === a ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {a === "pilotos" ? tx.abas.pilotos : tx.abas.equipas}
              </button>
            ))}
          </div>

          {aba === "pilotos" && (
            <div role="group" aria-label={tx.rotuloCategoria} className="no-scrollbar -mx-1 flex max-w-full gap-2 overflow-x-auto px-1">
              {categorias.map((c) => (
                <button key={c} type="button" onClick={() => setCategoria(c)} aria-pressed={categoria === c} className="pilula">
                  {c === "Todas" ? tx.geral : c}
                </button>
              ))}
            </div>
          )}
        </div>

        {aba === "pilotos" ? (
          <>
            {/* Pódio: o retrato com a cor da equipa a subir de baixo */}
            {lista.length >= 3 && (
              <ol className="mt-10 grid gap-[var(--intervalo)] sm:grid-cols-3 sm:items-end">
                {[lista[1], lista[0], lista[2]].map((p, i) => {
                  const cor = corEquipa.get(p.equipaSlug) ?? "#3d3d47";
                  const o = ordinal(p.posicao, idioma);
                  return (
                    <li key={p.slug} className={i === 1 ? "" : "max-sm:order-1"}>
                      <Link
                        href={`/pilotos/${p.slug}`}
                        className={`painel group relative isolate flex aspect-[4/3] flex-col justify-between p-5 lg:p-6 ${
                          i === 1 ? "sm:aspect-[3/4] lg:aspect-[4/5]" : "sm:aspect-[4/5] lg:aspect-[1/1]"
                        }`}
                      >
                        <Retrato
                          nome={retratoDe(p)}
                          pessoa={p.nome}
                          iniciais={iniciais(p.nome)}
                          className="foto-painel absolute inset-0 -z-20 [container-type:size]"
                          tamanhos="(max-width: 640px) 100vw, 33vw"
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0 -z-10"
                          style={{
                            // Cor da equipa a subir de baixo; sombra leve no topo para o ordinal se ler sobre céu claro.
                            background: `linear-gradient(to top, ${cor} 0%, color-mix(in srgb, ${cor} 70%, transparent) 30%, transparent 68%), linear-gradient(to bottom, rgb(0 0 0 / 0.45), transparent 30%)`,
                          }}
                        />
                        <p className="text-5xl font-semibold leading-none tabular-nums [text-shadow:0_2px_12px_rgb(0_0_0/0.45)]">
                          {o.n}
                          <span className="align-super text-lg">{o.sufixo}</span>
                        </p>
                        <div>
                          <p className="text-2xl font-semibold leading-tight">{p.nome}</p>
                          <p className="mt-0.5 text-sm text-white/85">{p.equipa}</p>
                          <div className="mt-4 flex items-end justify-between gap-4">
                            <p className="text-3xl font-semibold leading-none tabular-nums">
                              {p.estatisticas.pontos}
                              <span className="ml-1 text-sm font-normal">{tx.pts}</span>
                            </p>
                            <p className="text-xs tabular-nums text-white/85">
                              {preencher(tx.podioLinha, { vitorias: p.estatisticas.vitorias, podios: p.estatisticas.podios })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Tabela de pilotos */}
            {lista.length === 0 ? (
              <Aviso className="mt-10" titulo={tx.vazioPilotos.titulo} icone={<ListOrdered />}>
                {tx.vazioPilotos.texto}
              </Aviso>
            ) : (
              <div className="mt-10">
                <div aria-hidden className={`hidden items-end gap-x-4 px-4 pb-3 text-xs text-white/75 md:grid ${COL_PILOTOS}`}>
                  <span>{tx.colunas.pos}</span>
                  <span>{tx.colunas.piloto}</span>
                  <span>{tx.colunas.equipa}</span>
                  <span className="text-right">{tx.colunas.vit}</span>
                  <span className="text-right">{tx.colunas.pod}</span>
                  <span className="text-right">{tx.colunas.pole}</span>
                  <span className="text-right">{tx.colunas.pontos}</span>
                </div>
                <ol className="grid gap-[var(--intervalo)]">
                  {lista.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/pilotos/${p.slug}`}
                        className={`painel painel-escuro group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-3 transition-colors hover:bg-white/5 md:gap-x-4 md:px-4 ${COL_PILOTOS}`}
                      >
                        <Posicao posicao={p.posicao} />

                        <span className="flex min-w-0 items-center gap-3">
                          <Retrato
                            nome={retratoDe(p)}
                            pessoa={p.nome}
                            iniciais={iniciais(p.nome)}
                            className="size-10 shrink-0 rounded-[4px] [container-type:size]"
                            largura={160}
                            tamanhos="40px"
                          />
                          {/* Ocupa a coluna toda: a pista da barra tem o mesmo comprimento em todas as linhas. */}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span className="text-sm tabular-nums text-white/70">{p.numero}</span>
                              <span className="truncate font-medium transition-colors group-hover:text-mb-red-light">{p.nome}</span>
                            </span>
                            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-white/75 md:hidden">
                              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: corEquipa.get(p.equipaSlug) ?? "#3d3d47" }} />
                              <span className="truncate">{p.equipa}</span>
                            </span>
                            <span className="mt-0.5 block text-xs tabular-nums text-white/70 md:hidden">
                              {preencher(tx.linhaPiloto, { vitorias: p.estatisticas.vitorias, podios: p.estatisticas.podios, poles: p.estatisticas.poles })}
                            </span>
                            {/* Barra de pontos relativa ao líder */}
                            <span aria-hidden className="mt-1.5 hidden h-1 w-full max-w-[14rem] overflow-hidden rounded-full bg-white/10 md:block">
                              <span
                                className="block h-full rounded-full bg-mb-red"
                                style={{ width: `${(p.estatisticas.pontos / maxPontos) * 100}%` }}
                              />
                            </span>
                          </span>
                        </span>

                        <span className="hidden min-w-0 items-center gap-2 text-sm text-white/75 md:flex">
                          <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: corEquipa.get(p.equipaSlug) ?? "#3d3d47" }} />
                          <span className="truncate">{p.equipa}</span>
                        </span>
                        <span className="hidden text-right text-sm tabular-nums text-white/80 md:block">
                          <span className="sr-only">Vitórias: </span>
                          {p.estatisticas.vitorias}
                        </span>
                        <span className="hidden text-right text-sm tabular-nums text-white/80 md:block">
                          <span className="sr-only">Pódios: </span>
                          {p.estatisticas.podios}
                        </span>
                        <span className="hidden text-right text-sm tabular-nums text-white/80 md:block">
                          <span className="sr-only">Poles: </span>
                          {p.estatisticas.poles}
                        </span>

                        <span className="text-right">
                          <span className="block text-lg font-semibold leading-tight tabular-nums">
                            {p.estatisticas.pontos}
                            <span className="sr-only"> pontos</span>
                          </span>
                          {lider && p.posicao > 1 && (
                            <span className="block text-[11px] tabular-nums text-white/75">
                              −{lider.estatisticas.pontos - p.estatisticas.pontos}
                              <span className="sr-only"> do líder</span>
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        ) : equipas.length === 0 ? (
          <Aviso className="mt-10" titulo={tx.vazioEquipas.titulo} icone={<ListOrdered />}>
            {tx.vazioEquipas.texto}
          </Aviso>
        ) : (
          /* ---- Equipas ---- */
          <div className="mt-10">
            <div aria-hidden className={`hidden items-end gap-x-4 px-4 pb-3 text-xs text-white/75 md:grid ${COL_EQUIPAS}`}>
              <span>{tx.colunas.pos}</span>
              <span>{tx.colunas.equipa}</span>
              <span>{tx.colunas.base}</span>
              <span className="text-right">{tx.colunas.vit}</span>
              <span className="text-right">{tx.colunas.pod}</span>
              <span className="text-right">{tx.colunas.tit}</span>
              <span className="text-right">{tx.colunas.pontos}</span>
            </div>
            <ol className="grid gap-[var(--intervalo)]">
              {equipas.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/equipas/${e.slug}`}
                    className={`painel painel-escuro group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-3 transition-colors hover:bg-white/5 md:gap-x-4 md:px-4 ${COL_EQUIPAS}`}
                  >
                    <Posicao posicao={e.posicao} />
                    <span className="flex min-w-0 items-center gap-3">
                      <EmblemaEquipa logo={e.logo} cor={e.cor} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium transition-colors group-hover:text-mb-red-light">{e.nome}</span>
                        <span className="block truncate text-xs text-white/75">
                          <span className="md:hidden">{e.base} · </span>
                          {contar(e.pilotos.length, tx.pilotoUm, tx.pilotoVarios)}
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums text-white/70 md:hidden">
                          {preencher(tx.linhaEquipa, { vitorias: e.estatisticas.vitorias, podios: e.estatisticas.podios, titulos: e.estatisticas.titulos })}
                        </span>
                      </span>
                    </span>
                    <span className="hidden truncate text-sm text-white/75 md:block">{e.provincia}</span>
                    <span className="hidden text-right text-sm tabular-nums text-white/80 md:block">
                      <span className="sr-only">Vitórias: </span>
                      {e.estatisticas.vitorias}
                    </span>
                    <span className="hidden text-right text-sm tabular-nums text-white/80 md:block">
                      <span className="sr-only">Pódios: </span>
                      {e.estatisticas.podios}
                    </span>
                    <span className="hidden text-right text-sm tabular-nums text-white/80 md:block">
                      <span className="sr-only">Títulos: </span>
                      {e.estatisticas.titulos}
                    </span>
                    <span className="text-right text-lg font-semibold tabular-nums">
                      {e.estatisticas.pontos}
                      <span className="sr-only"> pontos</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Legenda */}
        <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/75">
          {tx.legenda.vit && <span>{tx.legenda.vit}</span>}
          {tx.legenda.pod && <span>{tx.legenda.pod}</span>}
          {aba === "pilotos" ? tx.legenda.pole && <span>{tx.legenda.pole}</span> : tx.legenda.tit && <span>{tx.legenda.tit}</span>}
          {tx.legenda.actualizado && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              {tx.legenda.actualizado}
            </span>
          )}
        </p>
      </Seccao>
    </PaginaInterior>
  );
}
