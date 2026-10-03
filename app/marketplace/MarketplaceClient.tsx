"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { SeloVerificado } from "@/components/SeloVerificado";
import { ButtonLink, Icon, PageHero, Tag } from "@/components/ui";
import { formatData, formatKz } from "@/lib/data";
import type { AnuncioMarketplace } from "@/lib/types";
import {
  AVISO_PAGAMENTO, CATEGORIAS_ANUNCIO, CONSELHO_SEGURANCA, SLUG_TERMOS_MARKETPLACE, ehNovo,
} from "@/lib/marketplace";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";

const CATEGORIAS = ["Todas", ...CATEGORIAS_ANUNCIO] as const;
const CONDICOES = [
  { id: "todas", label: "Novo ou usado" },
  { id: "novo", label: "Novo" },
  { id: "usado", label: "Usado" },
] as const;
const ORDENS = [
  { id: "recentes", label: "Mais recentes" },
  { id: "preco-asc", label: "Preço: menor primeiro" },
  { id: "preco-desc", label: "Preço: maior primeiro" },
  { id: "vistos", label: "Mais vistos" },
] as const;

export function MarketplaceClient({ anuncios: originais }: { anuncios: AnuncioMarketplace[] }) {
  const anuncios = useConteudo(originais, ["titulo", "descricao"]);
  const { t } = useIdioma();
  const [categoria, setCategoria] = useState<string>("Todas");
  const [provincia, setProvincia] = useState("Todas");
  const [condicao, setCondicao] = useState<string>("todas");
  const [ordem, setOrdem] = useState<string>("recentes");
  const [busca, setBusca] = useState("");
  const [precoMax, setPrecoMax] = useState<number>(10_000_000);

  const provincias = useMemo(
    () => ["Todas", ...[...new Set(anuncios.map((a) => a.provincia))].sort()],
    [anuncios],
  );

  const filtrados = useMemo(() => {
    const out = anuncios
      .filter((a) => categoria === "Todas" || a.categoria === categoria)
      .filter((a) => provincia === "Todas" || a.provincia === provincia)
      .filter((a) => condicao === "todas" || (condicao === "novo") === ehNovo(a.estado))
      .filter((a) => a.preco <= precoMax)
      .filter(
        (a) =>
          busca === "" ||
          a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          a.marca.toLowerCase().includes(busca.toLowerCase()),
      );

    switch (ordem) {
      case "preco-asc":
        return out.sort((a, b) => a.preco - b.preco);
      case "preco-desc":
        return out.sort((a, b) => b.preco - a.preco);
      case "vistos":
        return out.sort((a, b) => b.visualizacoes - a.visualizacoes);
      default:
        return out.sort((a, b) => +new Date(b.publicado) - +new Date(a.publicado));
    }
  }, [anuncios, categoria, provincia, condicao, ordem, busca, precoMax]);

  return (
    <>
      <PageHero
        imagem="marketplace"
        eyebrow={t("paginas.compraEVenda")}
        titulo={t("paginas.marketplaceTitulo")}
        descricao={t("paginas.marketplaceSub")}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/conta#anuncios" size="lg">
            <Icon name="plus" className="size-4" />
            Publicar anúncio
          </ButtonLink>
          <p className="flex items-center gap-2 text-xs text-ink-500">
            <SeloVerificado tamanho={16} decorativo />
            Motas revistas pela equipa Motobox antes de aparecerem
          </p>
        </div>
      </PageHero>

      {/* Filtros */}
      <div className="sticky top-16 z-30 border-b border-white/6 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
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
              className="h-8 rounded-full bg-ink-800 px-3.5 font-ui text-sm text-ink-200 outline-none transition-colors hover:bg-ink-700 focus:ring-2 focus:ring-mb-red"
            >
              {provincias.map((p) => (
                <option key={p} value={p}>
                  {p === "Todas" ? "Província" : p}
                </option>
              ))}
            </select>

            <select
              value={condicao}
              onChange={(e) => setCondicao(e.target.value)}
              aria-label="Novo ou usado"
              className="h-8 rounded-full bg-ink-800 px-3.5 font-ui text-sm text-ink-200 outline-none transition-colors hover:bg-ink-700 focus:ring-2 focus:ring-mb-red"
            >
              {CONDICOES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              aria-label="Ordenar"
              className="h-8 rounded-full bg-ink-800 px-3.5 font-ui text-sm text-ink-200 outline-none transition-colors hover:bg-ink-700 focus:ring-2 focus:ring-mb-red"
            >
              {ORDENS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="relative ml-auto w-full sm:w-auto">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Procurar…"
                aria-label="Procurar no marketplace"
                className="h-9 w-full sm:w-52 rounded-full bg-ink-900 pl-10 pr-4 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 outline-none focus:ring-2 focus:ring-mb-red"
              />
            </div>
          </div>

          {/* Filtro de preço */}
          <div className="mt-3 flex items-center gap-4">
            <label htmlFor="preco" className="eyebrow shrink-0 text-ink-600">
              Até
            </label>
            <input
              id="preco"
              type="range"
              min={50_000}
              max={10_000_000}
              step={50_000}
              value={precoMax}
              onChange={(e) => setPrecoMax(Number(e.target.value))}
              className="h-1 max-w-xs flex-1 accent-[#e10600]"
            />
            <span className="shrink-0 font-display text-sm text-white tabular-nums">
              {formatKz(precoMax)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {/* Entrada para "Importar do estrangeiro", logo a seguir aos filtros */}
        <Link
          href="/marketplace/importar"
          className="group relative isolate mb-10 flex flex-col gap-4 overflow-hidden rounded-card bg-gradient-to-r from-mb-red/18 via-ink-900 to-ink-900 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
        >
          <span className="stripes absolute inset-0 -z-10" aria-hidden />
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mb-red text-white">
            <Icon name="map" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2.5">
              <Tag tone="red">{t("importar.novo")}</Tag>
              <span className="font-display text-xl uppercase leading-tight text-white transition-colors group-hover:text-mb-red-light">
                {t("importar.titulo")}
              </span>
            </span>
            <span className="mt-1.5 block max-w-3xl text-sm text-ink-300 leading-relaxed">{t("importar.texto")}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-3 font-ui text-base text-white">
            {t("importar.cta")}
            <span aria-hidden className="grid size-9 place-items-center rounded-full bg-ink-800 transition-colors group-hover:bg-mb-red">
              <Icon name="arrow" className="size-4" />
            </span>
          </span>
        </Link>

        <p className="mb-6 text-sm text-ink-500">
          {filtrados.length} {filtrados.length === 1 ? "anúncio" : "anúncios"}
        </p>

        {/* Fotografia arredondada e texto por baixo, preço em destaque */}
        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((a) => (
            <Link key={a.id} href={`/marketplace/${a.id}`} className="group flex flex-col">
              <div className="media relative aspect-[4/3]">
                <Placeholder
                  nome={a.imagens[0]}
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                />
                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  {/* Com uma categoria escolhida, repeti-la em cada anúncio não diz nada. */}
                  {categoria === "Todas" && <Tag tone="neutral">{a.categoria}</Tag>}
                  {a.vendedor.verificado && (
                    <SeloVerificado tamanho={18} className="drop-shadow-[0_1px_2px_rgb(0_0_0/0.55)]" />
                  )}
                </div>
                {a.documentosVerificados && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-ok/90 px-2.5 py-1 text-[10px] leading-none text-white backdrop-blur-sm">
                    <Icon name="shield" className="size-3" />
                    Documentação verificada
                  </span>
                )}
                <span className="absolute bottom-3 right-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-[10px] leading-none text-ink-200 backdrop-blur-sm">
                  {a.estado}
                </span>
              </div>

              <div className="mt-3.5">
                <p className="font-display text-2xl leading-none text-white tabular-nums">{formatKz(a.preco)}</p>
                <p className="mt-1.5 text-xs text-ink-500">
                  {a.negociavel ? "Negociável" : "Preço fixo"} ·{" "}
                  {formatData(a.publicado, { day: "2-digit", month: "short" })}
                </p>
              </div>

              <h2 className="mt-3 font-display text-base uppercase leading-snug text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                {a.titulo}
              </h2>

              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Icon name="pin" className="size-3" />
                  {a.provincia}
                </span>
                {a.ano && <span>{a.ano}</span>}
                {a.quilometragem !== undefined && (
                  <span>{a.quilometragem.toLocaleString("pt-PT")} km</span>
                )}
              </p>
            </Link>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div className="card p-14 text-center">
            <p className="font-display text-lg uppercase text-ink-300">Nenhum anúncio encontrado</p>
            <p className="mt-2 text-sm text-ink-500">Alargue os filtros ou tente outra pesquisa.</p>
          </div>
        )}

        {/* Como funciona a verificação */}
        <section className="mt-20 border-t border-white/6 pt-14">
          <p className="eyebrow text-mb-red">Segurança</p>
          <h2 className="mt-2 title-xl text-3xl sm:text-4xl">Como funciona a verificação</h2>
          <div className="mt-9 grid gap-x-10 gap-y-9 sm:grid-cols-3">
            {[
              {
                icone: "shield",
                t: "Motas revistas antes de publicar",
                d: "Quem vende uma mota indica o número de quadro e os documentos que tem. A equipa Motobox revê o anúncio e pode pedir para ver os documentos antes de o publicar.",
              },
              {
                icone: "verified",
                t: "Selos com significado",
                d: "«Documentação verificada» quer dizer que a equipa viu os documentos da mota. O selo de vendedor verificado só aparece quando confirmámos a identidade de quem vende.",
              },
              {
                icone: "lock",
                t: "Pagamento entre as partes",
                d: `${AVISO_PAGAMENTO} ${CONSELHO_SEGURANCA}`,
              },
            ].map((c) => (
              <div key={c.t}>
                <span className="grid size-12 place-items-center rounded-full bg-mb-red/12 text-mb-red">
                  <Icon name={c.icone} className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-xl uppercase text-white">{c.t}</h3>
                <p className="mt-2 text-sm text-ink-400 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-9 text-sm text-ink-500">
            As regras completas estão nos{" "}
            <Link href={`/${SLUG_TERMOS_MARKETPLACE}`} className="text-white underline hover:text-mb-red">
              Termos do Marketplace
            </Link>
            . Viu um anúncio suspeito? Use «Denunciar este anúncio» na página dele.
          </p>
        </section>
      </div>
    </>
  );
}
