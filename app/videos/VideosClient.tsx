"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Placeholder } from "@/components/Brand";
import { EmptyState, Icon, PageHero, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import type { Video } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";
import { CartaoVideo, Vistas } from "./CartaoVideo";

const CATEGORIAS = ["Todos", "Highlights", "Onboard", "Entrevista", "Documentário", "Resumo"];

/*
 * A página inicial e a faixa de /noticias ligam para /videos#slug: esse
 * vídeo abre no leitor. No servidor não há endereço, por isso começa vazio.
 */
const subscreverHash = (aviso: () => void) => {
  window.addEventListener("hashchange", aviso);
  return () => window.removeEventListener("hashchange", aviso);
};
const lerHash = () => window.location.hash.slice(1);
const semHash = () => "";

export function VideosClient({ videos: originais }: { videos: Video[] }) {
  const videos = useConteudo(originais, ["titulo", "descricao"]);
  const { t } = useIdioma();
  const [categoria, setCategoria] = useState("Todos");
  const pedido = useSyncExternalStore(subscreverHash, lerHash, semHash);
  // Guarda-se o slug e não o vídeo, para o leitor acompanhar a tradução.
  const [escolhido, setEscolhido] = useState<string | undefined>();
  const [aReproduzir, setAReproduzir] = useState(false);

  // O vídeo escolhido na página; antes disso, o pedido no endereço; senão o
  // mais recente. Sem vídeos publicados não há leitor: fica indefinido.
  const activo: Video | undefined =
    videos.find((v) => v.slug === (escolhido ?? pedido)) ?? videos[0];

  // Trocar de vídeo volta à miniatura — não queremos o leitor a saltar sozinho
  // para o vídeo seguinte.
  const setActivo = (v: Video) => {
    setEscolhido(v.slug);
    setAReproduzir(false);
  };

  const filtrados = useMemo(
    () => videos.filter((v) => categoria === "Todos" || v.categoria === categoria),
    [videos, categoria],
  );

  // Só os números que dizem alguma coisa: nada de "0 vídeos" nem "0k
  // visualizações". As visualizações são as indicadas no painel; um vídeo
  // sem número conta como zero.
  const totalVistas = videos.reduce((s, v) => s + Math.max(v.visualizacoes || 0, 0), 0);
  const nCategorias = new Set(videos.map((v) => v.categoria)).size;
  const numeros: { v: number | string; l: string }[] = [];
  if (videos.length > 0) numeros.push({ v: videos.length, l: videos.length === 1 ? "Vídeo" : "Vídeos" });
  if (totalVistas > 0) {
    numeros.push({ v: totalVistas < 1000 ? totalVistas : `${Math.round(totalVistas / 1000)}k`, l: "Visualizações" });
  }
  if (nCategorias > 1) numeros.push({ v: nCategorias, l: "Categorias" });

  const seguintes = activo ? videos.filter((v) => v.slug !== activo.slug).slice(0, 6) : [];

  return (
    <>
      <PageHero
        imagem="videos"
        eyebrow={t("paginas.motoboxTv")}
        titulo={t("paginas.videosTitulo")}
        descricao={t("paginas.videosSub")}
      >
        {numeros.length > 0 && (
          <div className="flex flex-wrap gap-8">
            {numeros.map((s) => (
              <div key={s.l}>
                <p className="font-display text-3xl text-white">{s.v}</p>
                <p className="eyebrow mt-1 text-ink-500">{s.l}</p>
              </div>
            ))}
          </div>
        )}
      </PageHero>

      {/* Leitor em destaque */}
      {activo && (
        <section className="bg-ink-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
            <div className={`grid gap-6 ${seguintes.length > 0 ? "lg:grid-cols-[1.8fr_1fr]" : "max-w-4xl"}`}>
              <div>
                <div className="media relative aspect-video bg-ink-950">
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
                      {activo.duracao && activo.duracao !== "0:00" && (
                        <span className="absolute bottom-3 right-3 rounded-full bg-ink-950/80 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-sm">
                          {activo.duracao}
                        </span>
                      )}
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
                    {activo.visualizacoes > 0 && (
                      <>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="eye" className="size-3.5" />
                          <Vistas n={activo.visualizacoes} />
                        </span>
                        <span className="size-1 rounded-full bg-ink-700" />
                      </>
                    )}
                    <span>{formatData(activo.data)}</span>
                  </p>
                </div>
              </div>

              {/* Lista lateral (só quando há mais vídeos além do que está no leitor) */}
              {seguintes.length > 0 && (
                <div>
                  <p className="eyebrow text-ink-500 mb-3">A seguir</p>
                  <div className="lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">
                    {seguintes.map((v) => (
                      <button
                        key={v.slug}
                        onClick={() => setActivo(v)}
                        className="group flex w-full items-center gap-4 border-b border-white/6 py-3 text-left last:border-0"
                      >
                        <div className="media relative w-32 shrink-0 aspect-video">
                          <Placeholder
                            nome={[v.slug, v.thumbnail]}
                            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                            tamanhos="128px"
                          />
                          {v.duracao && v.duracao !== "0:00" && (
                            <span className="absolute bottom-1.5 right-1.5 font-mono text-[10px] text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.8)]">
                              {v.duracao}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="eyebrow text-mb-red">{v.categoria}</p>
                          <p className="mt-1 font-display text-sm uppercase leading-snug text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                            {v.titulo}
                          </p>
                          <p className="mt-1 text-[11px] text-ink-600">
                            {v.visualizacoes > 0
                              ? <Vistas n={v.visualizacoes} curto />
                              : formatData(v.data, { day: "2-digit", month: "short" })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Filtros e grelha */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {videos.length === 0 ? (
          // Ainda sem vídeos: não há filtros a mostrar, nem se presume um canal.
          <EmptyState
            titulo="Sem vídeos publicados"
            descricao="Os vídeos das provas e eventos aparecem aqui à medida que forem publicados."
          />
        ) : (
          <>
            <div className="mb-9 flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  aria-pressed={categoria === c}
                  className="chip"
                >
                  {c}
                </button>
              ))}
            </div>

            {filtrados.length === 0 ? (
              <EmptyState titulo="Sem vídeos nesta categoria" descricao="Experimente outra categoria." />
            ) : (
              <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtrados.map((v) => (
                  <CartaoVideo
                    key={v.slug}
                    v={v}
                    id={v.slug}
                    tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                    aoEscolher={() => {
                      setActivo(v);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
