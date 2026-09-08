"use client";

import { useEffect, useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { Icon, PageHero, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import type { Video } from "@/lib/types";

const CATEGORIAS = ["Todos", "Highlights", "Onboard", "Entrevista", "Documentário", "Resumo"];

export function VideosClient({ videos }: { videos: Video[] }) {
  const [categoria, setCategoria] = useState("Todos");
  const [activo, setActivoBruto] = useState<Video>(videos[0]);
  const [aReproduzir, setAReproduzir] = useState(false);

  // Trocar de vídeo volta à miniatura — não queremos o leitor a saltar sozinho
  // para o vídeo seguinte.
  const setActivo = (v: Video) => {
    setActivoBruto(v);
    setAReproduzir(false);
  };

  // A página inicial liga para /videos#slug — abrir esse vídeo no leitor.
  useEffect(() => {
    const slug = window.location.hash.slice(1);
    if (!slug) return;
    const v = videos.find((x) => x.slug === slug);
    if (v) setActivoBruto(v);
  }, []);

  const filtrados = useMemo(
    () => videos.filter((v) => categoria === "Todos" || v.categoria === categoria),
    [videos, categoria],
  );

  const totalVistas = videos.reduce((s, v) => s + v.visualizacoes, 0);

  return (
    <>
      <PageHero
        imagem="videos"
        eyebrow="Motobox TV"
        titulo="Vídeos"
        descricao="Os melhores momentos das provas nacionais, câmaras de bordo, entrevistas e documentários sobre quem faz o motociclismo angolano."
      >
        <div className="flex flex-wrap gap-8">
          {[
            { v: videos.length, l: "Vídeos" },
            { v: `${Math.round(totalVistas / 1000)}k`, l: "Visualizações" },
            { v: new Set(videos.map((v) => v.categoria)).size, l: "Categorias" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-display text-3xl text-white">{s.v}</p>
              <p className="eyebrow mt-1 text-ink-500">{s.l}</p>
            </div>
          ))}
        </div>
      </PageHero>

      {/* Leitor em destaque */}
      <section className="border-b border-ink-800 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            <div>
              <div className="relative aspect-video overflow-hidden border border-ink-700">
                {aReproduzir && activo.videoId ? (
                  <iframe
                    key={activo.videoId}
                    src={`https://www.youtube-nocookie.com/embed/${activo.videoId}?autoplay=1&rel=0`}
                    title={activo.titulo}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 size-full"
                  />
                ) : (
                  <>
                    <Placeholder nome={[activo.slug, activo.thumbnail]} className="absolute inset-0" />
                    <div className="absolute inset-0 grid place-items-center bg-ink-950/30">
                      <button
                        onClick={() => setAReproduzir(true)}
                        disabled={!activo.videoId}
                        className="grid size-20 place-items-center rounded-full bg-mb-red text-white transition-transform hover:scale-110 disabled:opacity-60 disabled:hover:scale-100"
                        aria-label={`Reproduzir ${activo.titulo}`}
                      >
                        <Icon name="play" className="size-8 translate-x-1" />
                      </button>
                    </div>
                    <span className="absolute bottom-3 right-3 bg-ink-950/90 px-2.5 py-1 font-mono text-xs text-white">
                      {activo.duracao}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap gap-2">
                  <Tag tone="red">{activo.categoria}</Tag>
                  {activo.evento && <Tag tone="outline">{activo.evento}</Tag>}
                </div>
                <h2 className="mt-3 font-display text-2xl sm:text-3xl uppercase leading-tight text-white">
                  {activo.titulo}
                </h2>
                <p className="mt-3 text-sm text-ink-400 leading-relaxed">{activo.descricao}</p>
                <p className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="eye" className="size-3.5" />
                    {activo.visualizacoes.toLocaleString("pt-PT")} visualizações
                  </span>
                  <span className="size-1 rounded-full bg-ink-700" />
                  <span>{formatData(activo.data)}</span>
                </p>
              </div>
            </div>

            {/* Lista lateral */}
            <div>
              <p className="eyebrow text-ink-500 mb-3">A seguir</p>
              <div className="space-y-2 lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">
                {videos
                  .filter((v) => v.slug !== activo.slug)
                  .slice(0, 6)
                  .map((v) => (
                    <button
                      key={v.slug}
                      onClick={() => setActivo(v)}
                      className="group flex w-full gap-3 border border-ink-800 text-left transition-colors hover:border-mb-red/60 hover:bg-ink-850"
                    >
                      <div className="relative w-32 shrink-0 aspect-video">
                        <Placeholder nome={[v.slug, v.thumbnail]} className="absolute inset-0" />
                        <span className="absolute bottom-1 right-1 bg-ink-950/90 px-1 font-mono text-[10px] text-white">
                          {v.duracao}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 py-2 pr-2">
                        <p className="eyebrow text-mb-red">{v.categoria}</p>
                        <p className="mt-1 text-xs text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                          {v.titulo}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-600">
                          {(v.visualizacoes / 1000).toFixed(1)}k visualizações
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros e grelha */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="mb-8 flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              aria-pressed={categoria === c}
              className={`h-9 shrink-0 px-4 font-display text-xs uppercase tracking-wider transition-colors ${
                categoria === c
                  ? "bg-mb-red text-white"
                  : "border border-ink-700 text-ink-400 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((v) => (
            <button
              key={v.slug}
              id={v.slug}
              onClick={() => {
                setActivo(v);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group card card-hover overflow-hidden text-left"
            >
              <div className="relative aspect-video">
                <Placeholder
                  nome={[v.slug, v.thumbnail]}
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="grid size-14 place-items-center rounded-full bg-mb-red text-white">
                    <Icon name="play" className="size-5 translate-x-0.5" />
                  </span>
                </div>
                <span className="absolute bottom-2 right-2 bg-ink-950/90 px-2 py-0.5 font-mono text-[11px] text-white">
                  {v.duracao}
                </span>
                <div className="absolute left-2 top-2">
                  <Tag tone="neutral" className="!text-[9px]">{v.categoria}</Tag>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm uppercase leading-snug text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                  {v.titulo}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-[11px] text-ink-600">
                  <span>{v.visualizacoes.toLocaleString("pt-PT")} visualizações</span>
                  <span className="size-1 rounded-full bg-ink-700" />
                  <span>{formatData(v.data, { day: "2-digit", month: "short" })}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
