"use client";

import { Fragment, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { EmptyState } from "@/components/ui";
import { useIdioma } from "@/lib/i18n/contexto";
import { interfaceEn } from "@/lib/i18n/interface-en";

/* ============================================================
   MOTOBOX — Lista de discussões do fórum
   Os filtros correm no navegador, sobre a lista que a página já
   trouxe. Cada linha vem desenhada do servidor (`linha`): aqui
   só se ordena e filtra, com os números que a acompanham.
   Uma categoria escolhida em cima (#slug no endereço) mostra só
   as discussões dela.
   ============================================================ */

export interface ItemDiscussao {
  id: string;
  /** Slug da categoria, para o filtro do #slug. */
  categoria: string;
  fixado: boolean;
  respostas: number;
  visualizacoes: number;
  /** Última actividade (abertura ou última resposta), em milissegundos. */
  actividade: number;
  linha: ReactNode;
}

const FILTROS = ["Recentes", "Populares", "Sem resposta"] as const;
type Filtro = (typeof FILTROS)[number];

const porActividade = (a: ItemDiscussao, b: ItemDiscussao) => b.actividade - a.actividade;

/** O hash do endereço, sem o "#"; vazio no servidor. */
const subscreverHash = (f: () => void) => {
  window.addEventListener("hashchange", f);
  return () => window.removeEventListener("hashchange", f);
};
const lerHash = () => decodeURIComponent(window.location.hash.slice(1));

export function Discussoes({ itens, categorias }: {
  itens: ItemDiscussao[];
  categorias: { slug: string; nome: string }[];
}) {
  const { idioma } = useIdioma();
  const [filtro, setFiltro] = useState<Filtro>("Recentes");
  const hash = useSyncExternalStore(subscreverHash, lerHash, () => "");
  const categoria = categorias.find((c) => c.slug === hash) ?? null;

  // Escolher uma categoria lá em cima traz a lista à vista.
  useEffect(() => {
    if (categoria) document.getElementById("forum-discussoes")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [categoria]);

  // Atributos não passam pelo TraduzirPagina (só texto): traduz-se aqui.
  const tr = (pt: string) => (idioma === "en" && interfaceEn[pt]) || pt;

  const lista = useMemo(() => {
    const base = categoria ? itens.filter((t) => t.categoria === categoria.slug) : itens;
    // `sort` é estável: no empate fica a ordem do servidor (os mais recentes primeiro).
    if (filtro === "Populares") {
      return [...base].sort((a, b) => b.respostas - a.respostas || b.visualizacoes - a.visualizacoes);
    }
    if (filtro === "Sem resposta") return base.filter((t) => t.respostas === 0).sort(porActividade);
    // Recentes: as fixadas primeiro, como sempre, e depois a actividade mais recente.
    return [...base].sort((a, b) => Number(b.fixado) - Number(a.fixado) || porActividade(a, b));
  }, [itens, filtro, categoria]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="forum-discussoes" className="scroll-mt-24 font-display text-2xl uppercase text-white">
            Discussões
          </h2>
          {categoria && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-400">
              <span>{categoria.nome}</span>
              {/* Um hash que não é categoria volta a mostrar tudo, sem saltar para o topo. */}
              <a href="#todas" className="text-white underline hover:text-mb-red">Ver todas</a>
            </p>
          )}
        </div>
        <div role="group" aria-label={tr("Ordenar discussões")} className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTROS.map((f) => (
            <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)}
              className="chip h-8 px-3.5 text-sm">
              {f}
            </button>
          ))}
        </div>
      </div>

      {lista.length > 0 && (
        <ul className="mt-6 border-t border-white/6">
          {lista.map((t) => <Fragment key={t.id}>{t.linha}</Fragment>)}
        </ul>
      )}
      {lista.length === 0 && (
        <div className="mt-6">
          {categoria && filtro !== "Sem resposta" ? (
            <EmptyState
              titulo="Ainda sem discussões nesta categoria"
              descricao="Seja o primeiro: abra um tópico com o botão Novo tópico."
            />
          ) : filtro === "Sem resposta" && itens.length > 0 ? (
            <EmptyState
              titulo="Todas as discussões têm resposta"
              descricao="Quando um tópico ficar à espera de resposta, aparece aqui."
            />
          ) : (
            <EmptyState
              titulo="Sem discussões recentes"
              descricao="As conversas mais recentes da comunidade aparecem aqui."
            />
          )}
        </div>
      )}
    </>
  );
}
