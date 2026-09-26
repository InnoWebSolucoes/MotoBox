"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { Icon, PageHero, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import type { Noticia } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";

const CATEGORIAS = ["Todas", "Angola", "Internacional", "Entrevista", "Comunidade", "Solidária"];

export function NoticiasClient({ noticias: originais }: { noticias: Noticia[] }) {
  const { t } = useIdioma();
  // Traduz o conteúdo uma vez; todos os cartões abaixo já o recebem traduzido.
  const noticias = useConteudo(originais, ["titulo", "resumo"]);
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
        imagem="noticias"
        eyebrow={t("paginas.motobox")}
        titulo={t("paginas.noticiasTitulo")}
        descricao={t("paginas.noticiasSub")}
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

          <div className="relative ml-auto w-full sm:w-auto">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Procurar…"
              aria-label="Procurar notícias"
              className="h-9 w-full sm:w-56 rounded-full bg-ink-900 pl-10 pr-4 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 outline-none focus:ring-2 focus:ring-mb-red"
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
            {/* Destaque: título sobre a fotografia, como a manchete da F1 */}
            {principal && (
              <Link
                href={`/noticias/${principal.slug}`}
                className="group relative isolate mb-12 flex min-h-[420px] flex-col justify-end overflow-hidden rounded-card lg:min-h-[500px]"
              >
                <Placeholder
                  nome={principal.imagem}
                  className="absolute inset-0 -z-10 transition-transform duration-700 group-hover:scale-105"
                  tamanhos="(max-width: 1280px) 100vw, 1232px"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
                <div className="max-w-3xl p-6 sm:p-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <Tag tone="red">{principal.categoria}</Tag>
                    <p className="eyebrow text-white/80">Em destaque</p>
                  </div>
                  <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl uppercase leading-[0.95] text-white">
                    {principal.titulo}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm sm:text-base text-ink-300 leading-relaxed line-clamp-3">
                    {principal.resumo}
                  </p>
                  <p className="mt-5 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                    <span>{principal.autor}</span>
                    <span className="size-1 rounded-full bg-ink-500" />
                    <span>{formatData(principal.data)}</span>
                    <span className="size-1 rounded-full bg-ink-500" />
                    <span>{principal.leitura} min</span>
                  </p>
                </div>
              </Link>
            )}

            {/* Grelha: fotografia arredondada e texto por baixo, sem moldura */}
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {resto.map((n) => (
                <Link key={n.slug} href={`/noticias/${n.slug}`} className="group flex flex-col">
                  <div className="media relative aspect-[16/10]">
                    <Placeholder
                      nome={[n.slug, n.imagem]}
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    />
                    {n.fonte && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-[10px] leading-none text-ink-300 backdrop-blur-sm">
                        via {n.fonte}
                      </span>
                    )}
                  </div>
                  <p className={`eyebrow mt-4 ${n.categoria === "Internacional" ? "text-ink-400" : "text-mb-red"}`}>
                    {n.categoria}
                  </p>
                  <h2 className="mt-2 font-display text-xl uppercase leading-tight text-white line-clamp-3 group-hover:text-mb-red transition-colors">
                    {n.titulo}
                  </h2>
                  <p className="mt-2 text-sm text-ink-500 leading-relaxed line-clamp-2">
                    {n.resumo}
                  </p>
                  <p className="mt-3 flex items-center gap-2.5 text-xs text-ink-500">
                    <span>{formatData(n.data, { day: "2-digit", month: "short" })}</span>
                    <span className="size-1 rounded-full bg-ink-600" />
                    <span>{n.leitura} min</span>
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Faixa de agregação internacional */}
        {categoria === "Todas" && internacionais.length > 0 && (
          <section className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-mb-red">Agregação automática</p>
                <h2 className="title-xl mt-2 text-3xl sm:text-4xl">
                  Do mundo das motas
                </h2>
                <p className="mt-3 max-w-lg text-sm text-ink-400 leading-relaxed">
                  Recolhemos automaticamente notícias das principais fontes internacionais de
                  motociclismo, actualizadas várias vezes ao dia.
                </p>
              </div>
              <button
                onClick={() => setCategoria("Internacional")}
                className="group inline-flex items-center gap-3 font-ui text-base text-white transition-colors hover:text-ink-200"
              >
                Ver tudo
                <span
                  aria-hidden
                  className="grid size-9 place-items-center rounded-full bg-ink-800 transition-colors group-hover:bg-mb-red"
                >
                  <Icon name="arrow" className="size-4" />
                </span>
              </button>
            </div>

            <ul className="mt-7">
              {internacionais.map((n) => (
                <li key={n.slug} className="border-b border-white/6 last:border-0">
                  <Link href={`/noticias/${n.slug}`} className="group flex items-center gap-4 py-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-400 transition-colors group-hover:bg-mb-red/12 group-hover:text-mb-red">
                      <Icon name="trending" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base uppercase text-white group-hover:text-mb-red transition-colors">
                        {n.titulo}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {n.fonte} · {formatData(n.data, { day: "2-digit", month: "short" })}
                      </span>
                    </span>
                    <Icon
                      name="arrow"
                      className="size-5 shrink-0 text-ink-600 transition-all group-hover:translate-x-1 group-hover:text-white"
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
