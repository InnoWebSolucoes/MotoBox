"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { Icon, PageHero, SectionHead, Tag } from "@/components/ui";
import { CartaoVideo } from "@/app/videos/CartaoVideo";
import { formatData } from "@/lib/data";
import type { Noticia, Video } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";

/** Também usadas pelo arquivo (/noticias/arquivo). */
export const CATEGORIAS = ["Todas", "Angola", "Internacional", "Entrevista", "Comunidade", "Solidária"];

const CAMPOS_VIDEO: (keyof Video)[] = ["titulo"];

/**
 * Lê "?cat=" (as ligações "Internacional" do menu e do rodapé) e aplica-o.
 * Fica à parte e dentro de <Suspense> para a página continuar a ser gerada
 * em estático: só este pedaço espera pelo endereço no navegador.
 */
export function CategoriaDoEndereco({ aoLer }: { aoLer: (c: string) => void }) {
  const params = useSearchParams();
  const pedida = params.get("cat");
  useEffect(() => {
    if (pedida && CATEGORIAS.includes(pedida)) aoLer(pedida);
  }, [pedida, aoLer]);
  return null;
}

export function NoticiasClient({ noticias: originais, videos: videosOriginais }: {
  noticias: Noticia[];
  /** Os vídeos mais recentes, para a faixa de vídeos. */
  videos: Video[];
}) {
  const { t } = useIdioma();
  // Traduz o conteúdo uma vez; todos os cartões abaixo já o recebem traduzido.
  const noticias = useConteudo(originais, ["titulo", "resumo"]);
  const videos = useConteudo(videosOriginais, CAMPOS_VIDEO);
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
      <Suspense fallback={null}>
        <CategoriaDoEndereco aoLer={setCategoria} />
      </Suspense>
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

        {/* Vídeos: os mais recentes, com ligação para a secção completa.
            Sem vídeos publicados, a faixa não aparece. */}
        {categoria === "Todas" && videos.length > 0 && (
          <section className="mt-20">
            <SectionHead
              eyebrow="Vídeos"
              titulo="Provas e eventos em vídeo"
              acao={{ href: "/videos", texto: "Todos os vídeos" }}
            />
            {/* No telemóvel desliza na horizontal; a partir do tablet é grelha. */}
            <div className="mt-8 -mx-4 overflow-x-auto no-scrollbar sm:mx-0 sm:overflow-visible">
              <div className="flex gap-4 px-4 pb-2 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-9 sm:px-0 sm:pb-0 lg:grid-cols-4">
                {videos.map((v) => (
                  <div key={v.slug} className="w-[260px] shrink-0 sm:w-auto">
                    <CartaoVideo
                      v={v}
                      href={`/videos#${v.slug}`}
                      tamanhos="(max-width: 640px) 260px, (max-width: 1024px) 50vw, 300px"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Faixa internacional: notícias de fora escolhidas e editadas pela
            redacção, sempre com a fonte. Não há recolha automática. */}
        {categoria === "Todas" && internacionais.length > 0 && (
          <section className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-mb-red">Internacional</p>
                <h2 className="title-xl mt-2 text-3xl sm:text-4xl">
                  Do mundo das motas
                </h2>
                <p className="mt-3 max-w-lg text-sm text-ink-400 leading-relaxed">
                  MotoGP, MXGP, Dakar e outras provas lá de fora, escolhidas e editadas pela
                  redacção da Motobox. Cada notícia indica a fonte original.
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
                        {n.fonte && <>via {n.fonte} · </>}
                        {formatData(n.data, { day: "2-digit", month: "short" })}
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

        {/* Arquivo: tudo o que foi publicado, incluindo material antigo com a data original */}
        {noticias.length > 0 && (
          <Link
            href="/noticias/arquivo"
            className="group mt-20 flex items-center gap-4 rounded-card bg-ink-900 p-5 sm:p-6"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-300 transition-colors group-hover:bg-mb-red group-hover:text-white">
              <Icon name="calendar" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg uppercase text-white group-hover:text-mb-red transition-colors">
                Arquivo de notícias
              </span>
              <span className="mt-0.5 block text-sm text-ink-500">
                Tudo o que já publicámos, por ano e mês.
              </span>
            </span>
            <Icon
              name="arrow"
              className="size-5 shrink-0 text-ink-600 transition-all group-hover:translate-x-1 group-hover:text-white"
            />
          </Link>
        )}
      </div>
    </>
  );
}
