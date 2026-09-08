"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { ButtonLink, Icon, PageHero, Tag } from "@/components/ui";
import { formatData, formatKz } from "@/lib/data";
import type { AnuncioMarketplace } from "@/lib/types";

const CATEGORIAS = ["Todas", "Motas", "Peças", "Equipamento", "Acessórios"] as const;
const ORDENS = [
  { id: "recentes", label: "Mais recentes" },
  { id: "preco-asc", label: "Preço: menor primeiro" },
  { id: "preco-desc", label: "Preço: maior primeiro" },
  { id: "vistos", label: "Mais vistos" },
] as const;

export function MarketplaceClient({ anuncios }: { anuncios: AnuncioMarketplace[] }) {
  const [categoria, setCategoria] = useState<string>("Todas");
  const [provincia, setProvincia] = useState("Todas");
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
  }, [anuncios, categoria, provincia, ordem, busca, precoMax]);

  return (
    <>
      <PageHero
        imagem="marketplace"
        eyebrow="Comunidade verificada"
        titulo="Marketplace"
        descricao="Motas, peças e equipamento à venda por membros verificados da comunidade motard angolana. Sem intermediários e sem anúncios falsos."
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/conta#anuncios" size="lg">
            <Icon name="plus" className="size-4" />
            Publicar anúncio
          </ButtonLink>
          <p className="flex items-center gap-2 text-xs text-ink-500">
            <Icon name="verified" className="size-4 text-ok" />
            Todos os vendedores são verificados pela Motobox
          </p>
        </div>
      </PageHero>

      {/* Filtros */}
      <div className="sticky top-16 z-30 border-b border-ink-800 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
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

            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              aria-label="Ordenar"
              className="h-8 border border-ink-700 bg-ink-950 px-3 font-display text-[11px] uppercase tracking-wider text-ink-300 outline-none focus:border-mb-red"
            >
              {ORDENS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="relative ml-auto">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-600" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Procurar…"
                aria-label="Procurar no marketplace"
                className="h-8 w-full sm:w-48 border border-ink-700 bg-ink-950 pl-9 pr-3 text-xs text-white placeholder:text-ink-600 outline-none focus:border-mb-red"
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
            <span className="shrink-0 font-display text-xs text-white tabular-nums">
              {formatKz(precoMax)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="mb-6 text-xs text-ink-600">
          {filtrados.length} {filtrados.length === 1 ? "anúncio" : "anúncios"}
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((a) => (
            <Link
              key={a.id}
              href={`/marketplace/${a.id}`}
              className="group card card-hover flex flex-col overflow-hidden"
            >
              <div className="relative aspect-[4/3]">
                <Placeholder
                  nome={a.imagens[0]}
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  <Tag tone="neutral">{a.categoria}</Tag>
                  {a.vendedor.verificado && (
                    <Tag tone="ok">
                      <Icon name="verified" className="size-3" />
                      Verificado
                    </Tag>
                  )}
                </div>
                <span className="absolute bottom-3 right-3 bg-ink-950/90 px-2 py-1 text-[10px] text-ink-300">
                  {a.estado}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-display text-base uppercase leading-snug text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                  {a.titulo}
                </h2>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-600">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="pin" className="size-3" />
                    {a.provincia}
                  </span>
                  {a.ano && <span>{a.ano}</span>}
                  {a.quilometragem !== undefined && (
                    <span>{a.quilometragem.toLocaleString("pt-PT")} km</span>
                  )}
                </p>

                <div className="mt-auto pt-4">
                  <p className="font-display text-xl text-white">{formatKz(a.preco)}</p>
                  <p className="mt-0.5 text-[11px] text-ink-600">
                    {a.negociavel ? "Negociável" : "Preço fixo"} ·{" "}
                    {formatData(a.publicado, { day: "2-digit", month: "short" })}
                  </p>
                </div>
              </div>
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
        <section className="mt-16 card p-6 sm:p-8">
          <p className="eyebrow text-mb-red">Segurança</p>
          <h2 className="mt-2 title-xl text-2xl sm:text-3xl">Como funciona a verificação</h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-3">
            {[
              {
                icone: "verified",
                t: "Vendedor verificado",
                d: "Confirmamos a identidade e o contacto de cada vendedor antes de publicar o primeiro anúncio.",
              },
              {
                icone: "star",
                t: "Histórico e avaliações",
                d: "Cada vendedor tem um histórico público de anúncios e avaliações de quem já lhe comprou.",
              },
              {
                icone: "shield",
                t: "Sem pagamentos na plataforma",
                d: "A Motobox não intermedeia pagamentos. Combine sempre um encontro em local público.",
              },
            ].map((c) => (
              <div key={c.t}>
                <span className="grid size-10 place-items-center bg-mb-red/10 text-mb-red">
                  <Icon name={c.icone} className="size-5" />
                </span>
                <h3 className="mt-3 font-display text-base uppercase text-white">{c.t}</h3>
                <p className="mt-2 text-sm text-ink-500 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
