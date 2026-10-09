"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { SeloVerificado } from "@/components/SeloVerificado";
import { Foto, Seta } from "@/components/painel/kit";
import { formatKz } from "@/lib/data";
import type { AnuncioMarketplace } from "@/lib/types";
import { MARKETPLACE_PADRAO, type ConteudoMarketplace } from "@/lib/conteudo/grupos/comunidade";

const CATEGORIAS = ["Todas", "Motas", "Peças", "Equipamento", "Acessórios"] as const;

const dataCurta = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split("-");
  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${Number(d)} ${MESES[Number(m) - 1] ?? ""}`;
};

export function MarketplaceClient({
  anuncios,
  textos: t = MARKETPLACE_PADRAO.lista,
}: {
  anuncios: AnuncioMarketplace[];
  /** Textos da lista, editáveis no painel (paginas.marketplace). */
  textos?: ConteudoMarketplace["lista"];
}) {
  const ORDENS = [
    { id: "recentes", label: t.recentes },
    { id: "preco-asc", label: t.precoMenor },
    { id: "preco-desc", label: t.precoMaior },
    { id: "vistos", label: t.maisVistos },
  ];
  const [categoria, setCategoria] = useState<string>("Todas");
  const [provincia, setProvincia] = useState("Todas");
  const [ordem, setOrdem] = useState<string>("recentes");
  const [busca, setBusca] = useState("");

  const provincias = useMemo(
    () => ["Todas", ...[...new Set(anuncios.map((a) => a.provincia))].sort()],
    [anuncios],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const out = anuncios
      .filter((a) => categoria === "Todas" || a.categoria === categoria)
      .filter((a) => provincia === "Todas" || a.provincia === provincia)
      .filter(
        (a) =>
          termo === "" ||
          a.titulo.toLowerCase().includes(termo) ||
          a.marca.toLowerCase().includes(termo) ||
          (a.modelo ?? "").toLowerCase().includes(termo),
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
  }, [anuncios, categoria, provincia, ordem, busca]);

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {CATEGORIAS.map((c) => (
            <button key={c} type="button" onClick={() => setCategoria(c)} aria-pressed={categoria === c} className="pilula">
              {c === "Todas" ? t.todas : c}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.3fr] xl:w-[38rem]">
          <select value={provincia} onChange={(e) => setProvincia(e.target.value)} aria-label="Filtrar por província" className="campo h-10 text-sm">
            {provincias.map((p) => (
              <option key={p} value={p}>{p === "Todas" ? t.todasProvincias : p}</option>
            ))}
          </select>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar" className="campo h-10 text-sm">
            {ORDENS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <label className="relative block">
            <span className="sr-only">Procurar no marketplace</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/45" aria-hidden />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={t.procurar}
              className="campo h-10 pl-10 text-sm"
            />
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-white/55" aria-live="polite">
        {filtrados.length} {filtrados.length === 1 ? t.umAnuncio : t.variosAnuncios}
      </p>

      {filtrados.length ? (
        <div className="mt-4 grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtrados.map((a) => (
            <Link key={a.id} href={`/marketplace/${a.id}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
              <div className="relative">
                <Foto nome={a.imagens[0] ?? ""} className="aspect-[4/3]" largura={700} tamanhos="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" />
                <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                  {/* Com uma categoria escolhida, repeti-la em cada anúncio não diz nada. */}
                  {categoria === "Todas" && (
                    <span className="rounded-[4px] bg-black/65 px-2 py-1 text-xs text-white backdrop-blur-sm">{a.categoria}</span>
                  )}
                  {a.vendedor.verificado && <SeloVerificado tamanho={20} className="drop-shadow-[0_1px_2px_rgb(0_0_0/0.55)]" />}
                </div>
                <span className="absolute bottom-2.5 right-2.5 rounded-[4px] bg-black/65 px-2 py-1 text-xs text-white/90 backdrop-blur-sm">
                  {a.estado}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4 pt-5">
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{formatKz(a.preco)}</p>
                <p className="mt-1 text-xs text-white/55">
                  {a.negociavel ? t.negociavel : t.precoFixo} · {dataCurta(a.publicado)}
                </p>
                <h2 className="mt-3 line-clamp-2 text-[15px] font-medium leading-snug">{a.titulo}</h2>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-white/55">
                  <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" aria-hidden />
                      {a.provincia}
                    </span>
                    {a.ano && <span>{a.ano}</span>}
                    {a.quilometragem !== undefined && <span>{a.quilometragem.toLocaleString("pt-PT")} km</span>}
                  </span>
                  <Seta className="size-3.5 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="painel painel-escuro mt-4 p-10">
          <p className="text-lg font-semibold">{t.vazioTitulo}</p>
          <p className="mt-2 text-sm text-white/60">{t.vazioTexto}</p>
        </div>
      )}
    </>
  );
}
