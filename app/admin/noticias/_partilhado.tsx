"use client";

/* ============================================================
   MOTOBOX ADMIN — Peças partilhadas por Artigos, Eventos e
   Clubes e movimentos: abas guardadas no endereço (?aba=…),
   barra do editor que fica presa no topo, e o acesso ao
   conteúdo editável (/api/admin/conteudo) para os campos que
   não têm coluna na base de dados.
   ============================================================ */

import { useLayoutEffect, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { comBase } from "@/lib/base";
import type { RespostaGrupo } from "@/lib/conteudo/tipos";

/* ---------------- Abas no endereço ---------------- */

/**
 * Aba activa de uma página de gestão, guardada no endereço (?aba=pagina) para
 * se poder abrir directamente e voltar a ela depois de recarregar.
 * A primeira aba (a lista) não leva nada no endereço.
 */
export function useAbaNoEndereco<K extends string>(inicial: K, primeira: K): [K, (k: K) => void] {
  const [aba, setAba] = useState<K>(inicial);
  const mudar = (k: K) => {
    setAba(k);
    const url = new URL(window.location.href);
    if (k === primeira) url.searchParams.delete("aba");
    else url.searchParams.set("aba", k);
    window.history.replaceState(null, "", url);
  };
  return [aba, mudar];
}

/* ---------------- Barra do editor ---------------- */

/** Barra presa no topo do editor: voltar à lista, título, etiquetas de estado e acções. */
export function BarraEditor({
  aoVoltar, voltar, titulo, etiquetas, accoes,
}: {
  aoVoltar: () => void;
  /** Texto do botão de voltar, ex.: "Artigos". */
  voltar: string;
  titulo: string;
  etiquetas?: ReactNode;
  accoes: ReactNode;
}) {
  // O editor abre (e fecha) no topo da página, mesmo que se tenha escolhido o item lá em baixo na lista.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0 });
    return () => window.scrollTo({ top: 0 });
  }, []);
  return (
    <div className="painel painel-escuro sticky top-[4.5rem] z-20 flex flex-wrap items-center justify-between gap-2 !bg-[#2c2c33]/90 px-3 py-2.5 shadow-lg backdrop-blur-xl md:gap-3 md:px-4 md:py-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button" onClick={aoVoltar}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--raio)] bg-white/[0.07] px-3 text-[13px] text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {voltar}
        </button>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight md:text-lg">{titulo}</p>
          {etiquetas && <div className="mt-1 flex flex-wrap items-center gap-1.5">{etiquetas}</div>}
        </div>
      </div>
      {/* No telemóvel os botões encolhem, para a barra presa no topo não tapar o formulário. */}
      <div className="flex flex-wrap gap-1.5 max-md:[&_a]:h-8 max-md:[&_a]:px-2.5 max-md:[&_a]:text-[13px] max-md:[&_button]:h-8 max-md:[&_button]:px-2.5 max-md:[&_button]:text-[13px] md:gap-2">
        {accoes}
      </div>
    </div>
  );
}

/* ---------------- Conteúdo editável (grupos) ---------------- */

async function resposta(r: Response, falha: string) {
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro ?? falha);
  return j;
}

/** Os itens de um grupo do conteúdo editável (ex.: "eventos-extra", "clubes-perfis"). */
export async function lerGrupoConteudo<T>(grupo: string): Promise<RespostaGrupo<T>> {
  const r = await fetch(comBase(`/api/admin/conteudo?grupo=${encodeURIComponent(grupo)}`), { cache: "no-store" });
  return resposta(r, "Falha ao ler.");
}

/** Grava um item de um grupo; com `chaveAnterior`, muda-lhe a chave (o endereço da página mudou). */
export async function gravarItemConteudo(
  grupo: string, chave: string, dados: unknown, titulo?: string, chaveAnterior?: string,
): Promise<void> {
  const r = await fetch(comBase("/api/admin/conteudo"), {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grupo, chave, dados, titulo, chaveAnterior }),
  });
  await resposta(r, "Falha ao gravar.");
}

/** Tira um item do site (ou, com `repor`, volta ao conteúdo de origem). */
export async function apagarItemConteudo(grupo: string, chave: string, repor = false): Promise<void> {
  const q = `grupo=${encodeURIComponent(grupo)}&chave=${encodeURIComponent(chave)}${repor ? "&repor=1" : ""}`;
  const r = await fetch(comBase(`/api/admin/conteudo?${q}`), { method: "DELETE" });
  await resposta(r, "Falha ao apagar.");
}

/* ---------------- Pequenas ajudas ---------------- */

/** Data de hoje em Luanda (AAAA-MM-DD). */
export const hoje = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

/** "3 de Outubro de 2026" a partir de AAAA-MM-DD. */
export function dataLonga(iso?: string): string {
  if (!iso) return "";
  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return iso;
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

/** Igualdade de dois valores simples (objectos e listas comparados pelo conteúdo). */
export const iguais = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
