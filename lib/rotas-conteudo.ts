import "server-only";

/* ============================================================
   MOTOBOX — Rotas: leitura para as páginas públicas
   As rotas e os textos de /rotas vêm do conteúdo editável (o
   painel de gestão edita-os em /admin/rotas). Sem nada gravado,
   valem os do código (lib/rotas.ts), por isso o site nunca fica
   vazio e, sem edições, fica exactamente como estava.
   ============================================================ */

import { lerDoc, lerGrupo } from "@/lib/conteudo";
import { paginaRotasPadrao } from "@/lib/rotas";
import { fundir, type ConteudoPaginaRotas } from "@/lib/rotas-pagina";
import { normalizarRota, type Rota } from "@/lib/rotas-tipos";

/** Todas as rotas, pela ordem do site, com a forma garantida. */
export async function lerRotas(): Promise<Rota[]> {
  const itens = await lerGrupo<unknown>("rotas");
  return itens.map((d) => {
    const r = normalizarRota(d.dados);
    // A chave do conteúdo é o endereço: manda sobre o slug escrito nos dados.
    return r.slug === d.chave ? r : { ...r, slug: d.chave };
  });
}

/** Uma rota pelo endereço, ou undefined. */
export async function lerRotaPorSlug(slug: string): Promise<Rota | undefined> {
  return (await lerRotas()).find((r) => r.slug === slug);
}

/** Os textos de /rotas, os da página de cada rota e o que é comum a todas. */
export async function lerPaginaRotas(): Promise<ConteudoPaginaRotas> {
  const padrao = paginaRotasPadrao();
  const gravado = await lerDoc<unknown>("paginas.rotas");
  const p = fundir(padrao, gravado);
  // As tabelas de clima precisam das doze linhas e de números; o resto vem já com a forma certa.
  const clima = Array.isArray(p.CLIMA) ? p.CLIMA.filter((c) => c && typeof c.chave === "string") : [];
  return { ...p, CLIMA: clima.length ? clima : padrao.CLIMA };
}
