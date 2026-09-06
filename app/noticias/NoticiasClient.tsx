"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { Icon, PageHero, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import type { Noticia } from "@/lib/types";

const CATEGORIAS = ["Todas", "Angola", "Internacional", "Entrevista", "Comunidade", "Solidária"];

export function NoticiasClient({ noticias }: { noticias: Noticia[] }) {
  const [categoria, setCategoria] = useState("Todas");
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(
    () =>
      noticias
        .filter((n) => categoria === "Todas" || n.categoria === categoria)
        .filter(
          (n) =>
            busca === "" ||
            n.titulo.toLowerCase().includes(busca.toLowerCase()) ||
            n.tags.some((t) => t.toLowerCase().includes(busca.toLowerCase())),
        )
        .sort((a, b) => +new Date(b.data) - +new Date(a.data)),
    [noticias, categoria, busca],
  );

  const [principal, ...resto] = filtradas;
  const internacionais = noticias.filter((n) => n.categoria === "Internacional").slice(0, 4);

  return (
    <>
      <PageHero
        eyebrow="Motobox"
        titulo="Notícias"
        descricao="Cobertura das provas nacionais, entrevistas com quem faz o motociclismo angolano, e o que se passa no mundo das motas lá fora."
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

          <div className="relative ml-auto">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-600" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Procurar…"
              aria-label="Procurar notícias"
              className="h-8 w-full sm:w-52 border border-ink-700 bg-ink-950 pl-9 pr-3 text-xs text-white placeholder:text-ink-600 outline-none focus:border-mb-red"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {filtradas.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="font-display text-lg uppercase text-ink-300">Nada encontrado</p>
            <p className="mt-2 text-sm text-ink-500">Experimente outra categoria ou pesquisa.</p>
          </div>
        ) : (
          <>
            {/* Destaque */}
            {principal && (
              <Link
                href={`/noticias/${principal.slug}`}
                className="group card card-hover mb-10 grid overflow-hidden lg:grid-cols-2"
              >
                <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[380px]">
                  <Placeholder
                    nome={principal.imagem}
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-4 top-4">
                    <Tag tone="red">{principal.categoria}</Tag>
                  </div>
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <p className="eyebrow text-mb-red">Em destaque</p>
                  <h2 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                    {principal.titulo}
                  </h2>
                  <p className="mt-4 text-sm text-ink-400 leading-relaxed">{principal.resumo}</p>
                  <p className="mt-5 flex flex-wrap items-center gap-3 text-xs text-ink-600">
                    <span>{principal.autor}</span>
                    <span className="size-1 rounded-full bg-ink-700" />
                    <span>{formatData(principal.data)}</span>
                    <span className="size-1 rounded-full bg-ink-700" />
                    <span>{principal.leitura} min</span>
                  </p>
                </div>
              </Link>
            )}

            {/* Grelha */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resto.map((n) => (
                <Link
                  key={n.slug}
                  href={`/noticias/${n.slug}`}
                  className="group card card-hover flex flex-col overflow-hidden"
                >
                  <div className="relative aspect-[16/10]">
                    <Placeholder
                      nome={n.imagem}
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <Tag tone={n.categoria === "Internacional" ? "neutral" : "red"}>{n.categoria}</Tag>
                    </div>
                    {n.fonte && (
                      <span className="absolute bottom-3 right-3 bg-ink-950/90 px-2 py-0.5 text-[10px] text-ink-400">
                        via {n.fonte}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-lg uppercase leading-snug text-white line-clamp-3 group-hover:text-mb-red transition-colors">
                      {n.titulo}
                    </h2>
                    <p className="mt-2.5 flex-1 text-sm text-ink-500 leading-relaxed line-clamp-3">
                      {n.resumo}
                    </p>
                    <p className="mt-4 flex items-center gap-2.5 border-t border-ink-800 pt-3.5 text-xs text-ink-600">
                      <span>{formatData(n.data, { day: "2-digit", month: "short" })}</span>
                      <span className="size-1 rounded-full bg-ink-700" />
                      <span>{n.leitura} min</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Faixa de agregação internacional */}
        {categoria === "Todas" && internacionais.length > 0 && (
          <section className="mt-16 card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-mb-red">Agregação automática</p>
                <h2 className="mt-2 font-display text-2xl uppercase text-white">
                  Do mundo das motas
                </h2>
                <p className="mt-2 max-w-lg text-sm text-ink-500">
                  Recolhemos automaticamente notícias das principais fontes internacionais de
                  motociclismo, actualizadas várias vezes ao dia.
                </p>
              </div>
              <button
                onClick={() => setCategoria("Internacional")}
                className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-widest text-ink-300 hover:text-mb-red transition-colors"
              >
                Ver tudo <Icon name="arrow" className="size-4" />
              </button>
            </div>

            <ul className="mt-6 divide-y divide-ink-800 border-t border-ink-800">
              {internacionais.map((n) => (
                <li key={n.slug}>
                  <Link href={`/noticias/${n.slug}`} className="group flex items-center gap-4 py-4">
                    <span className="grid size-9 shrink-0 place-items-center bg-ink-800 text-ink-500">
                      <Icon name="trending" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white group-hover:text-mb-red transition-colors">
                        {n.titulo}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-600">
                        {n.fonte} · {formatData(n.data, { day: "2-digit", month: "short" })}
                      </span>
                    </span>
                    <Icon
                      name="arrow"
                      className="size-4 shrink-0 text-ink-700 transition-all group-hover:translate-x-1 group-hover:text-mb-red"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
