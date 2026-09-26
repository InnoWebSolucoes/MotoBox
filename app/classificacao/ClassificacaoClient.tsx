"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Retrato } from "@/components/Brand";
import { Icon, PageHero, PosicaoBadge } from "@/components/ui";
import { TEMPORADA } from "@/lib/data";
import type { Equipa, Piloto } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";

type PilotoClass = Piloto & { posicao: number };
type EquipaClass = Equipa & { posicao: number };

const CATEGORIAS = ["Todas", "MX1", "MX2", "Rally / Enduro"];

function iniciais(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

/** "1.º" em português, "1st" em inglês — o "1ST" dos cartões de pódio da F1. */
function ordinal(n: number, idioma: string) {
  if (idioma !== "en") return { n, sufixo: ".º" };
  const s = n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th";
  return { n, sufixo: s };
}

/** Nome próprio normal e apelido em destaque, como "Kimi **Antonelli**". */
function NomePiloto({ nome }: { nome: string }) {
  const partes = nome.trim().split(" ");
  const apelido = partes.pop();
  return (
    <>
      {partes.length > 0 && <span className="font-ui font-semibold normal-case">{partes.join(" ")} </span>}
      <span className="font-display uppercase">{apelido}</span>
    </>
  );
}

export function ClassificacaoClient({
  pilotos,
  equipas,
}: {
  pilotos: PilotoClass[];
  equipas: EquipaClass[];
}) {
  const { t, idioma } = useIdioma();
  const [aba, setAba] = useState<"pilotos" | "equipas">("pilotos");
  const [categoria, setCategoria] = useState("Todas");

  const lista = useMemo(() => {
    const filtrados =
      categoria === "Todas" ? pilotos : pilotos.filter((p) => p.categoria === categoria);
    return filtrados.map((p, i) => ({ ...p, posicao: i + 1 }));
  }, [pilotos, categoria]);

  const lider = lista[0];
  const maxPontos = lista[0]?.estatisticas.pontos ?? 1;
  const corEquipa = useMemo(() => new Map(equipas.map((e) => [e.slug, e.cor])), [equipas]);

  return (
    <>
      <PageHero
        imagem="classificacao"
        eyebrow={`Campeonato Nacional ${TEMPORADA}`}
        titulo={t("paginas.classificacaoTitulo")}
        descricao="Pontuação do campeonato nacional de motociclismo, actualizada após cada prova. Pontuação a dobrar na ronda final."
      />

      {/* Abas */}
      <div className="sticky top-16 z-30 border-b border-white/6 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6 overflow-x-auto no-scrollbar">
          {(["pilotos", "equipas"] as const).map((a) => (
            <button key={a} onClick={() => setAba(a)} aria-pressed={aba === a} className="tab">
              {a === "pilotos" ? "Pilotos" : "Equipas e clubes"}
            </button>
          ))}

          {aba === "pilotos" && (
            <div className="ml-auto flex shrink-0 gap-2 py-2.5 pl-4">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  aria-pressed={categoria === c}
                  className="chip h-8 px-3.5 text-sm"
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
            {/* Pódio: fotografia com a cor da equipa por cima, ordinal grande, sem caixas */}
            {lista.length >= 3 && (
              <div className="mb-12 grid gap-4 sm:grid-cols-3 sm:items-end">
                {[lista[1], lista[0], lista[2]].map((p, i) => {
                  const cor = corEquipa.get(p.equipaSlug) ?? "#3d3d47";
                  const o = ordinal(p.posicao, idioma);
                  const altura = i === 1 ? "sm:aspect-[3/4]" : "sm:aspect-[4/5]";
                  return (
                    <Link
                      key={p.slug}
                      href={`/pilotos/${p.slug}`}
                      className={`group relative isolate flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-card p-5 sm:p-6 ${altura} ${
                        i === 1 ? "" : "max-sm:order-1"
                      }`}
                    >
                      <Retrato
                        nome={p.slug}
                        iniciais={iniciais(p.nome)}
                        className="absolute inset-0 -z-20 [container-type:size] transition-transform duration-700 group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0 -z-10"
                        style={{
                          // Cor da equipa a subir de baixo; sombra leve no topo para o ordinal se ler sobre céu claro.
                          background: `linear-gradient(to top, ${cor} 0%, color-mix(in srgb, ${cor} 70%, transparent) 30%, transparent 68%), linear-gradient(to bottom, rgb(0 0 0 / 0.45), transparent 30%)`,
                        }}
                        aria-hidden
                      />

                      <p className="font-display text-5xl leading-none text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.45)]">
                        {o.n}
                        <span className="align-super text-lg">{o.sufixo}</span>
                      </p>

                      <div>
                        <p className="text-2xl leading-tight text-white">
                          <NomePiloto nome={p.nome} />
                        </p>
                        <p className="mt-0.5 text-sm text-white/80">{p.equipa}</p>
                        <div className="mt-4 flex items-end justify-between gap-4">
                          <p className="font-display text-3xl leading-none text-white tabular-nums">
                            {p.estatisticas.pontos}
                            <span className="ml-1 text-sm">PTS</span>
                          </p>
                          <p className="text-xs text-white/80 tabular-nums">
                            {p.estatisticas.vitorias} Vit · {p.estatisticas.podios} Pód
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Tabela */}
            <div className="card px-3 py-2 sm:px-8 sm:py-6">
              <div className="hidden md:grid grid-cols-[3rem_1fr_10rem_4rem_4rem_4rem_5rem] items-center gap-4 border-b-2 border-ink-600 px-2 pb-3">
                {["Pos", "Piloto", "Equipa", "Vit", "Pód", "Pole", "Pontos"].map((h, i, todos) => (
                  <span key={h} className={`eyebrow text-ink-500 ${i === todos.length - 1 ? "text-right" : ""}`}>
                    {h}
                  </span>
                ))}
              </div>

              {lista.map((p) => (
                <Link
                  key={p.slug}
                  href={`/pilotos/${p.slug}`}
                  className="group grid grid-cols-[2.5rem_1fr_5rem] md:grid-cols-[3rem_1fr_10rem_4rem_4rem_4rem_5rem] items-center gap-4 border-b border-white/6 px-2 py-3.5 last:border-0"
                >
                  <PosicaoBadge posicao={p.posicao} size="sm" />

                  <div className="flex min-w-0 items-center gap-3">
                    <Retrato
                      nome={p.slug}
                      iniciais={iniciais(p.nome)}
                      className="size-10 shrink-0 rounded-full [container-type:size]"
                    />
                    {/* Ocupa a coluna toda: a pista da barra fica com o mesmo
                        comprimento em todas as linhas, seja qual for o nome. */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base uppercase text-white group-hover:text-mb-red transition-colors">
                        <span className="mr-2 text-ink-600 tabular-nums">{p.numero}</span>
                        {p.nome}
                      </p>
                      <p className="truncate text-xs text-ink-600 md:hidden">{p.equipa}</p>
                      {/* Barra de progresso relativa ao líder */}
                      <div className="mt-1.5 hidden md:block h-1 w-full max-w-[14rem] overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-mb-red"
                          style={{ width: `${(p.estatisticas.pontos / maxPontos) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="hidden md:flex min-w-0 items-center gap-2 text-sm text-ink-300">
                    <span
                      className="size-2.5 shrink-0 rounded-full bg-ink-600"
                      style={{ background: corEquipa.get(p.equipaSlug) }}
                      aria-hidden
                    />
                    <span className="truncate">{p.equipa}</span>
                  </p>
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
          <div className="card px-3 py-2 sm:px-8 sm:py-6">
            <div className="hidden md:grid grid-cols-[3rem_1fr_8rem_4rem_4rem_4rem_5rem] items-center gap-4 border-b-2 border-ink-600 px-2 pb-3">
              {["Pos", "Equipa", "Base", "Vit", "Pód", "Tít", "Pontos"].map((h, i, todos) => (
                <span key={h} className={`eyebrow text-ink-500 ${i === todos.length - 1 ? "text-right" : ""}`}>
                  {h}
                </span>
              ))}
            </div>

            {equipas.map((e) => (
              <Link
                key={e.slug}
                href={`/equipas/${e.slug}`}
                className="group grid grid-cols-[2.5rem_1fr_5rem] md:grid-cols-[3rem_1fr_8rem_4rem_4rem_4rem_5rem] items-center gap-4 border-b border-white/6 px-2 py-4 last:border-0"
              >
                <PosicaoBadge posicao={e.posicao} size="sm" />

                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full font-display text-xs text-white"
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
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-500">
          <span>Vit: vitórias</span>
          <span>Pód: pódios</span>
          <span>Pole: melhores qualificações</span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" className="size-3.5" />
            Actualizado após cada prova
          </span>
        </div>
      </div>
    </>
  );
}
