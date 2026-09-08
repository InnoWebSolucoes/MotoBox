"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Retrato } from "@/components/Brand";
import { Icon, PageHero, Tag } from "@/components/ui";
import { TEMPORADA } from "@/lib/data";
import type { Piloto } from "@/lib/types";

const CATEGORIAS = ["Todas", "MX1", "MX2", "Rally / Enduro"];

function iniciais(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export function PilotosClient({ pilotos }: { pilotos: (Piloto & { posicao: number })[] }) {
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
        titulo="Pilotos"
        descricao="Quem corre no motociclismo angolano. Estatísticas, histórico, equipas e onde os seguir."
      />

      {/* Filtros */}
      <div className="sticky top-16 z-30 border-b border-ink-800 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 py-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                aria-pressed={categoria === c}
                className={`h-8 shrink-0 px-3.5 font-display text-[11px] uppercase tracking-wider transition-colors ${
                  categoria === c
                    ? "bg-mb-red text-white"
                    : "border border-ink-700 text-ink-400 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <select
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            aria-label="Filtrar por província"
            className="h-8 border border-ink-700 bg-ink-950 px-3 font-display text-[11px] uppercase tracking-wider text-ink-300 outline-none focus:border-mb-red"
          >
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p === "Todas" ? "Província" : p}
              </option>
            ))}
          </select>

          <div className="relative ml-auto">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-600" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Procurar piloto…"
              aria-label="Procurar piloto"
              className="h-8 w-full sm:w-52 border border-ink-700 bg-ink-950 pl-9 pr-3 text-xs text-white placeholder:text-ink-600 outline-none focus:border-mb-red"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="mb-6 text-xs text-ink-600">
          {filtrados.length} {filtrados.length === 1 ? "piloto" : "pilotos"}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((p) => (
            <Link key={p.slug} href={`/pilotos/${p.slug}`} className="group card card-hover overflow-hidden">
              <div className="relative aspect-[4/5]">
                <Retrato
                  nome={p.slug}
                  iniciais={iniciais(p.nome)}
                  className="absolute inset-0 [container-type:size] transition-transform duration-500 group-hover:scale-105"
                />
                {/* Número grande, como nos cartões F1 */}
                <span className="absolute right-3 top-3 font-display text-5xl leading-none text-white/15">
                  {p.numero}
                </span>
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  <Tag tone={p.posicao <= 3 ? "red" : "neutral"}>{p.posicao}.º</Tag>
                  {p.campeonatos > 0 && (
                    <Tag tone="gold">
                      <Icon name="trophy" className="size-3" />
                      {p.campeonatos}×
                    </Tag>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="eyebrow text-mb-red">{p.categoria}</p>
                  <h2 className="mt-1 font-display text-xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                    {p.nome}
                  </h2>
                  <p className="text-xs text-ink-400 truncate">{p.equipa}</p>
                </div>
              </div>

              <dl className="grid grid-cols-3 divide-x divide-ink-800 border-t border-ink-800">
                {[
                  ["Pts", p.estatisticas.pontos],
                  ["Vit", p.estatisticas.vitorias],
                  ["Pód", p.estatisticas.podios],
                ].map(([k, v]) => (
                  <div key={k as string} className="p-3 text-center">
                    <dd className="font-display text-lg text-white tabular-nums">{v}</dd>
                    <dt className="eyebrow mt-0.5 text-ink-600">{k}</dt>
                  </div>
                ))}
              </dl>
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
