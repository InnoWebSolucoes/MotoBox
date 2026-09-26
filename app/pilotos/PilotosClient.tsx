"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Retrato } from "@/components/Brand";
import { Icon, PageHero, Tag } from "@/components/ui";
import { TEMPORADA } from "@/lib/data";
import type { Piloto } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";

const CATEGORIAS = ["Todas", "MX1", "MX2", "Rally / Enduro"];

function iniciais(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export function PilotosClient({ pilotos: originais }: { pilotos: (Piloto & { posicao: number })[] }) {
  const pilotos = useConteudo(originais, ["bio"]);
  const { t } = useIdioma();
  const [categoria, setCategoria] = useState("Todas");
  const [provincia, setProvincia] = useState("Todas");
  const [busca, setBusca] = useState("");

  const provincias = useMemo(
    () => ["Todas", ...new Set(pilotos.map((p) => p.provincia))].sort((a, b) =>
      a === "Todas" ? -1 : b === "Todas" ? 1 : a.localeCompare(b),
    ),
    [pilotos],
  );

  const filtrados = useMemo(
    () =>
      pilotos.filter(
        (p) =>
          (categoria === "Todas" || p.categoria === categoria) &&
          (provincia === "Todas" || p.provincia === provincia) &&
          (busca === "" ||
            p.nome.toLowerCase().includes(busca.toLowerCase()) ||
            p.equipa.toLowerCase().includes(busca.toLowerCase())),
      ),
    [pilotos, categoria, provincia, busca],
  );

  return (
    <>
      <PageHero
        imagem="pilotos"
        eyebrow={`Temporada ${TEMPORADA}`}
        titulo={t("paginas.pilotosTitulo")}
        descricao={t("paginas.pilotosSub")}
      />

      {/* Filtros */}
      <div className="sticky top-16 z-30 border-b border-white/6 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
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

          <select
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            aria-label="Filtrar por província"
            className="h-8 rounded-full bg-ink-800 px-3.5 font-ui text-sm text-ink-300 outline-none transition-colors hover:bg-ink-700 hover:text-white focus:ring-2 focus:ring-mb-red"
          >
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p === "Todas" ? "Província" : p}
              </option>
            ))}
          </select>

          <div className="relative ml-auto">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Procurar piloto…"
              aria-label="Procurar piloto"
              className="h-9 w-full sm:w-56 rounded-full bg-ink-900 pl-10 pr-4 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-500 outline-none focus:ring-2 focus:ring-mb-red"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="mb-6 text-xs text-ink-600">
          {filtrados.length} {filtrados.length === 1 ? "piloto" : "pilotos"}
        </p>

        {/* Cartões de piloto: fotografia arredondada sem moldura, texto por cima do véu (como o pódio) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((p) => (
            <Link
              key={p.slug}
              href={`/pilotos/${p.slug}`}
              className="group relative isolate flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-card p-5"
            >
              <Retrato
                nome={p.slug}
                iniciais={iniciais(p.nome)}
                className="absolute inset-0 -z-20 [container-type:size] transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 -z-10"
                style={{
                  // Véu escuro a subir de baixo para o nome e os números; sombra leve no topo para a posição.
                  background:
                    "linear-gradient(to top, rgb(10 10 12 / 0.95) 0%, rgb(10 10 12 / 0.6) 32%, transparent 62%), linear-gradient(to bottom, rgb(0 0 0 / 0.45), transparent 30%)",
                }}
                aria-hidden
              />

              {/* Posição e número: só tipografia, como o ordinal dos cartões de pódio da F1 */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col items-start gap-2">
                  <p className="font-display text-4xl leading-none text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.45)]">
                    {p.posicao}
                    <span className="align-super text-base">.º</span>
                  </p>
                  {p.campeonatos > 0 && (
                    <Tag tone="gold">
                      <Icon name="trophy" className="size-3" />
                      {p.campeonatos}×
                    </Tag>
                  )}
                </div>
                <span className="font-display text-5xl leading-none text-white/20">
                  {p.numero}
                </span>
              </div>

              <div>
                <p className="eyebrow text-mb-red">{p.categoria}</p>
                <h2 className="mt-1 font-display text-2xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                  {p.nome}
                </h2>
                <p className="text-sm text-white/75 truncate">{p.equipa}</p>

                <dl className="mt-4 flex gap-6">
                  {[
                    ["Pts", p.estatisticas.pontos],
                    ["Vit", p.estatisticas.vitorias],
                    ["Pód", p.estatisticas.podios],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <dd className="font-display text-xl leading-none text-white tabular-nums">{v}</dd>
                      <dt className="eyebrow mt-1 text-white/55">{k}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            </Link>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div className="card p-14 text-center">
            <p className="font-display text-lg uppercase text-ink-300">Nenhum piloto encontrado</p>
            <p className="mt-2 text-sm text-ink-500">Experimente outros filtros ou outra pesquisa.</p>
          </div>
        )}
      </div>
    </>
  );
}
