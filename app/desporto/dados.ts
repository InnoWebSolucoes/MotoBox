import "server-only";

/* ============================================================
   MOTOBOX — Desporto: o conteúdo editável, lido no servidor
   As páginas de Desporto (e as do campeonato) lêem daqui as
   modalidades, os guias, os textos fixos e as definições do
   campeonato que o painel edita (Modalidades). Sem nada
   gravado, vem o conteúdo de partida, igual ao do código.
   ============================================================ */

import { cache } from "react";
import { lerDoc, lerGrupo } from "@/lib/conteudo";
import {
  PAGINA_DESPORTO_PADRAO, type ExtrasEquipas, type PaginaDesporto,
} from "@/lib/conteudo/grupos/desporto";
import { normalizarModalidade, principalDe, type ModalidadeCompleta } from "@/lib/desporto";

const eObjecto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * O gravado por cima do de partida, a todos os níveis dos objectos (as
 * listas gravadas substituem as de partida). Um campo novo no código nunca
 * chega vazio a um documento gravado antes dele.
 */
function fundir<T>(padrao: T, gravado: unknown): T {
  if (gravado === undefined || gravado === null) return padrao;
  if (eObjecto(padrao) && eObjecto(gravado)) {
    const saida: Record<string, unknown> = { ...padrao };
    for (const [k, v] of Object.entries(gravado)) saida[k] = k in padrao ? fundir(padrao[k], v) : v;
    return saida as T;
  }
  if (Array.isArray(padrao) !== Array.isArray(gravado)) return padrao;
  if (typeof padrao === "string" && typeof gravado !== "string") return padrao;
  return gravado as T;
}

export { preencher } from "@/lib/desporto";

/** Textos de Desporto e definições do campeonato (Modalidades › Página Desporto). */
export const lerPaginaDesporto = cache(async (): Promise<PaginaDesporto> => {
  const padrao = PAGINA_DESPORTO_PADRAO();
  const p = fundir(padrao, await lerDoc<unknown>("paginas.desporto"));
  // Federações gravadas: cada uma com todos os campos.
  p.federacoes.lista = p.federacoes.lista.map((f) => ({
    sigla: String(f?.sigla ?? ""),
    nome: String(f?.nome ?? ""),
    texto: String(f?.texto ?? ""),
    fontes: Array.isArray(f?.fontes) ? f.fontes.filter((x) => x && x.url) : [],
    modalidades: Array.isArray(f?.modalidades) ? f.modalidades : [],
  }));
  return p;
});

/** As modalidades, pela ordem do painel, cada uma com o seu guia. */
export const lerModalidades = cache(async (): Promise<ModalidadeCompleta[]> => {
  const itens = await lerGrupo<unknown>("modalidades");
  return itens.map((d) => normalizarModalidade({ ...(eObjecto(d.dados) ? d.dados : {}), slug: d.chave }));
});

/** Uma modalidade, pelo endereço. */
export async function lerModalidadeEditada(slug: string): Promise<ModalidadeCompleta | undefined> {
  return (await lerModalidades()).find((m) => m.slug === slug);
}

/** A modalidade em destaque (a casa do Campeonato Nacional). */
export async function lerPrincipal(): Promise<ModalidadeCompleta | undefined> {
  return principalDe(await lerModalidades());
}

/** Fotografias de capa das equipas gravadas no painel, por slug. */
export const lerExtrasEquipas = cache(async (): Promise<ExtrasEquipas> => {
  const d = await lerDoc<unknown>("desporto.equipas");
  return eObjecto(d) ? (d as ExtrasEquipas) : {};
});
