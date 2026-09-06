"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Retrato } from "@/components/Brand";
import { Icon, PageHero, PosicaoBadge, Tag } from "@/components/ui";
import { TEMPORADA } from "@/lib/data";
import type { Equipa, Piloto } from "@/lib/types";

type PilotoClass = Piloto & { posicao: number };
type EquipaClass = Equipa & { posicao: number };

const CATEGORIAS = ["Todas", "MX1", "MX2", "Rally / Enduro"];

function iniciais(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export function ClassificacaoClient({
  pilotos,
  equipas,
}: {
  pilotos: PilotoClass[];
  equipas: EquipaClass[];
}) {
  const [aba, setAba] = useState<"pilotos" | "equipas">("pilotos");
  const [categoria, setCategoria] = useState("Todas");

  const lista = useMemo(() => {
    const filtrados =
      categoria === "Todas" ? pilotos : pilotos.filter((p) => p.categoria === categoria);
    return filtrados.map((p, i) => ({ ...p, posicao: i + 1 }));
  }, [pilotos, categoria]);

  const lider = lista[0];
  const maxPontos = lista[0]?.estatisticas.pontos ?? 1;

  return (
    <>
      <PageHero
        eyebrow={`Campeonato Nacional ${TEMPORADA}`}
        titulo="Classificação"
        descricao="Pontuação do campeonato nacional de motociclismo, actualizada após cada prova. Pontuação a dobrar na ronda final."
      />

      {/* Abas */}
      <div className="sticky top-16 z-30 border-b border-ink-800 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6 overflow-x-auto no-scrollbar">
          {(["pilotos", "equipas"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              aria-pressed={aba === a}
              className={`relative h-13 shrink-0 px-4 font-display text-sm uppercase tracking-wide transition-colors ${
                aba === a ? "text-white" : "text-ink-500 hover:text-ink-200"
              }`}
            >
              {a === "pilotos" ? "Pilotos" : "Equipas e clubes"}
              {aba === a && <span className="absolute inset-x-2 bottom-0 h-[3px] bg-mb-red" aria-hidden />}
            </button>
          ))}

          {aba === "pilotos" && (
            <div className="ml-auto flex shrink-0 gap-1.5 py-2.5">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  aria-pressed={categoria === c}
                  className={`h-8 px-3 font-display text-[11px] uppercase tracking-wider transition-colors ${
                    categoria === c
                      ? "bg-mb-red text-white"
                      : "border border-ink-700 text-ink-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {aba === "pilotos" ? (
          <>
            {/* Pódio */}
            {lista.length >= 3 && (
              <div className="mb-10 grid gap-4 sm:grid-cols-3">
                {[lista[1], lista[0], lista[2]].map((p, i) => {
                  const real = i === 1 ? 0 : i === 0 ? 1 : 2;
                  const alturas = ["sm:mt-8", "", "sm:mt-12"];
                  return (
                    <Link
                      key={p.slug}
                      href={`/pilotos/${p.slug}`}
                      className={`group card card-hover overflow-hidden ${alturas[i]} ${
                        real === 0 ? "border-gold/40" : ""
                      }`}
                    >
                      <div className="relative aspect-[4/3]">
                        <Retrato
                          nome={p.slug}
                          iniciais={iniciais(p.nome)}
                          className="absolute inset-0 [container-type:size]"
                        />
                        <div className="absolute left-4 top-4">
                          <PosicaoBadge posicao={p.posicao} />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="font-display text-3xl leading-none text-white/25">
                            {String(p.numero).padStart(2, "0")}
                          </p>
                          <p className="mt-1 font-display text-xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                            {p.nome}
                          </p>
                          <p className="text-xs text-ink-400">{p.equipa}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-ink-800 p-4">
                        <div>
                          <p className="font-display text-2xl text-white tabular-nums">
                            {p.estatisticas.pontos}
                          </p>
                          <p className="eyebrow text-ink-600">Pontos</p>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div>
                            <p className="font-display text-lg text-white tabular-nums">
                              {p.estatisticas.vitorias}
                            </p>
                            <p className="eyebrow text-ink-600">Vit</p>
                          </div>
                          <div>
                            <p className="font-display text-lg text-white tabular-nums">
                              {p.estatisticas.podios}
                            </p>
                            <p className="eyebrow text-ink-600">Pód</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Tabela */}
            <div className="card overflow-hidden">
              <div className="hidden md:grid grid-cols-[3.5rem_1fr_10rem_4rem_4rem_4rem_5rem] items-center gap-4 border-b border-ink-800 bg-ink-950 px-5 py-3">
                {["Pos", "Piloto", "Equipa", "Vit", "Pód", "Pole", "Pontos"].map((h) => (
                  <span key={h} className="eyebrow text-ink-600">
                    {h}
                  </span>
                ))}
              </div>

              {lista.map((p) => (
                <Link
                  key={p.slug}
                  href={`/pilotos/${p.slug}`}
                  className="group grid grid-cols-[3.5rem_1fr_5rem] md:grid-cols-[3.5rem_1fr_10rem_4rem_4rem_4rem_5rem] items-center gap-4 border-b border-ink-800 px-5 py-3.5 last:border-0 hover:bg-ink-850 transition-colors"
                >
                  <PosicaoBadge posicao={p.posicao} size="sm" />

                  <div className="flex min-w-0 items-center gap-3">
                    <Retrato
                      nome={p.slug}
                      iniciais={iniciais(p.nome)}
                      className="size-10 shrink-0 rounded-full [container-type:size]"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-display text-base uppercase text-white group-hover:text-mb-red transition-colors">
                        <span className="mr-2 text-ink-600 tabular-nums">{p.numero}</span>
                        {p.nome}
                      </p>
                      <p className="truncate text-xs text-ink-600 md:hidden">{p.equipa}</p>
                      {/* Barra de progresso relativa ao líder */}
                      <div className="mt-1.5 hidden md:block h-1 w-full max-w-[14rem] bg-ink-800">
                        <div
                          className="h-full bg-mb-red"
                          style={{ width: `${(p.estatisticas.pontos / maxPontos) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="hidden md:block truncate text-sm text-ink-400">{p.equipa}</p>
                  <p className="hidden md:block font-display text-sm text-ink-200 tabular-nums">
                    {p.estatisticas.vitorias}
                  </p>
                  <p className="hidden md:block font-display text-sm text-ink-200 tabular-nums">
                    {p.estatisticas.podios}
                  </p>
                  <p className="hidden md:block font-display text-sm text-ink-200 tabular-nums">
                    {p.estatisticas.poles}
                  </p>

                  <div className="text-right">
                    <p className="font-display text-lg text-white tabular-nums">
                      {p.estatisticas.pontos}
                    </p>
                    {lider && p.posicao > 1 && (
                      <p className="text-[11px] text-ink-600 tabular-nums">
                        −{lider.estatisticas.pontos - p.estatisticas.pontos}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          /* ---- Equipas ---- */
          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-[3.5rem_1fr_8rem_4rem_4rem_4rem_5rem] items-center gap-4 border-b border-ink-800 bg-ink-950 px-5 py-3">
              {["Pos", "Equipa", "Base", "Vit", "Pód", "Tít", "Pontos"].map((h) => (
                <span key={h} className="eyebrow text-ink-600">
                  {h}
                </span>
              ))}
            </div>

            {equipas.map((e) => (
              <Link
                key={e.slug}
                href={`/equipas/${e.slug}`}
                className="group grid grid-cols-[3.5rem_1fr_5rem] md:grid-cols-[3.5rem_1fr_8rem_4rem_4rem_4rem_5rem] items-center gap-4 border-b border-ink-800 px-5 py-4 last:border-0 hover:bg-ink-850 transition-colors"
              >
                <PosicaoBadge posicao={e.posicao} size="sm" />

                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center font-display text-xs text-white"
                    style={{ background: e.cor }}
                  >
                    {e.logo}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base uppercase text-white group-hover:text-mb-red transition-colors">
                      {e.nome}
                    </p>
                    <p className="truncate text-xs text-ink-600">
                      <span className="md:hidden">{e.base} · </span>
                      {e.pilotos.length} {e.pilotos.length === 1 ? "piloto" : "pilotos"}
                    </p>
                  </div>
                </div>

                <p className="hidden md:block truncate text-sm text-ink-400">{e.provincia}</p>
                <p className="hidden md:block font-display text-sm text-ink-200 tabular-nums">
                  {e.estatisticas.vitorias}
                </p>
                <p className="hidden md:block font-display text-sm text-ink-200 tabular-nums">
                  {e.estatisticas.podios}
                </p>
                <p className="hidden md:block font-display text-sm text-ink-200 tabular-nums">
                  {e.estatisticas.titulos}
                </p>
                <p className="text-right font-display text-lg text-white tabular-nums">
                  {e.estatisticas.pontos}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Legenda */}
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-600">
          <span className="inline-flex items-center gap-2">
            <Tag tone="gold" className="!px-1.5 !py-0.5 !text-[9px]">1</Tag> Líder do campeonato
          </span>
          <span>Vit — vitórias</span>
          <span>Pód — pódios</span>
          <span>Pole — melhores qualificações</span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" className="size-3.5" />
            Actualizado após cada prova
          </span>
        </div>
      </div>
    </>
  );
}
