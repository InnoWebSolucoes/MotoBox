"use client";

import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Seccao } from "@/components/painel/blocos";
import { TEMPORADA } from "@/lib/data";
import type { Piloto } from "@/lib/types";
import { useConteudo } from "@/lib/i18n/useConteudo";
import { PILOTOS_PADRAO, contar, preencher, type TextosPilotos } from "@/lib/conteudo/grupos/geral";
import { categoriasComPilotos } from "@/lib/desporto";
import { Aviso } from "@/app/calendario/pecas";
import { CartaoPiloto } from "./CartaoPiloto";

export function PilotosClient({
  pilotos: originais,
  cores,
  ordemCategorias,
  textos: t = PILOTOS_PADRAO(),
  ano = TEMPORADA,
}: {
  pilotos: (Piloto & { posicao: number })[];
  /** Cor de cada equipa, por slug. */
  cores: Record<string, string>;
  /** Ordem das categorias (Modalidades › Página Desporto); por omissão, a do código. */
  ordemCategorias?: string[];
  /** Textos fixos (Provas › Páginas do campeonato › Pilotos). */
  textos?: TextosPilotos;
  /** Temporada em curso (Definições). */
  ano?: number;
}) {
  const pilotos = useConteudo(originais, ["bio"]);
  const [categoria, setCategoria] = useState("Todas");
  const [provincia, setProvincia] = useState("Todas");
  const [busca, setBusca] = useState("");

  // Só as categorias com pilotos, pela ordem de sempre (MX1, MX2, Rally / Enduro, Velocidade, Moto 4, Karting).
  const categorias = useMemo(() => categoriasComPilotos(pilotos, ordemCategorias), [pilotos, ordemCategorias]);

  const provincias = useMemo(
    () =>
      ["Todas", ...new Set(pilotos.map((p) => p.provincia))].sort((a, b) =>
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
    <PaginaInterior icone={<UserRound />}>
      <Abertura compacta foto={t.foto} sobretitulo={preencher(t.sobretitulo, { ano })} titulo={t.titulo} texto={t.texto} />

      <Seccao>
        {/* Filtros: categoria, província e pesquisa */}
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label={t.filtros.rotuloCategoria} className="no-scrollbar -mx-1 flex max-w-full gap-2 overflow-x-auto px-1">
            {categorias.map((c) => (
              <button key={c} type="button" onClick={() => setCategoria(c)} aria-pressed={categoria === c} className="pilula">
                {c === "Todas" ? t.filtros.todas : c}
              </button>
            ))}
          </div>

          <select
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            aria-label={t.filtros.rotuloProvincia}
            className="campo !h-9 w-auto min-w-[10rem] text-sm"
          >
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p === "Todas" ? t.filtros.todasProvincias : p}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:ml-auto sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/45" aria-hidden />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={t.filtros.procurar}
              aria-label={t.filtros.procurar.replace(/[….]+$/, "")}
              className="campo !h-9 pl-10 text-sm"
            />
          </div>
        </div>

        <p className="mt-6 text-sm text-white/60" aria-live="polite">
          {contar(filtrados.length, t.contadorUm, t.contadorVarios)}
        </p>

        {filtrados.length > 0 ? (
          <div className="mt-4 grid gap-[var(--intervalo)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map((p) => (
              <CartaoPiloto key={p.slug} piloto={p} posicao={p.posicao} cor={cores[p.equipaSlug]} textos={t.cartao} />
            ))}
          </div>
        ) : (
          <Aviso className="mt-4" titulo={t.vazioTitulo} icone={<Search />}>
            {t.vazioTexto}
          </Aviso>
        )}
      </Seccao>
    </PaginaInterior>
  );
}
