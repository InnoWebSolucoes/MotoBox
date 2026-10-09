import "server-only";

/* ============================================================
   MOTOBOX — Conteúdo editável: o que vale em cada momento
   Junta o que está gravado (base de dados) com o conteúdo de
   partida (código). Usado pelas páginas públicas e pela API do
   painel, para que os dois vejam exactamente o mesmo.

   - Documento solto: o gravado por cima do de partida (os campos
     que o gravado não tiver ficam com o valor de partida).
   - Grupo: enquanto ninguém gravar a lista ("<grupo>._lista"),
     vale a lista de partida; depois, a ordem e os itens são os
     da lista gravada. Cada item é o gravado, ou o de partida se
     ainda não foi editado.
   ============================================================ */

import { DOCS, GRUPOS } from "./registo";
import type { LinhaConteudo } from "./servidor";
import type { Documento, RespostaGrupo } from "./tipos";

const eObjecto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Campos gravados por cima dos de partida (só no primeiro nível). */
export function juntar(padrao: unknown, gravado: unknown): unknown {
  if (gravado === undefined || gravado === null) return padrao;
  if (eObjecto(padrao) && eObjecto(gravado)) return { ...padrao, ...gravado };
  return gravado;
}

export const chaveLista = (grupo: string) => `${grupo}._lista`;
export const chaveItem = (grupo: string, chave: string) => `${grupo}.${chave}`;

export function resolverDoc(chave: string, linhas: Map<string, LinhaConteudo>): Documento {
  const def = DOCS.get(chave);
  const linha = linhas.get(chave);
  const padrao = def?.padrao();
  if (linha) {
    return { chave, titulo: linha.titulo || def?.titulo || chave, dados: juntar(padrao, linha.dados), origem: "base", atualizado: linha.atualizado };
  }
  return { chave, titulo: def?.titulo ?? chave, dados: padrao ?? null, origem: "codigo" };
}

/** Lista de chaves gravada para o grupo, ou null se ainda vale a de partida. */
export function listaGravada(grupo: string, linhas: Map<string, LinhaConteudo>): string[] | null {
  const dados = linhas.get(chaveLista(grupo))?.dados;
  if (eObjecto(dados) && Array.isArray(dados.chaves)) return dados.chaves.filter((c): c is string => typeof c === "string");
  return null;
}

export function resolverGrupo(grupo: string, linhas: Map<string, LinhaConteudo>): RespostaGrupo {
  const def = GRUPOS.get(grupo);
  const partida = def?.padrao() ?? [];
  const porChave = new Map(partida.map((p) => [p.chave, p]));
  const gravada = listaGravada(grupo, linhas);
  const chaves = gravada ?? partida.map((p) => p.chave);

  const itens: Documento[] = [];
  for (const chave of chaves) {
    const linha = linhas.get(chaveItem(grupo, chave));
    const p = porChave.get(chave);
    if (linha) {
      itens.push({ chave, titulo: linha.titulo || p?.titulo || chave, dados: juntar(p?.dados, linha.dados), origem: "base", atualizado: linha.atualizado });
    } else if (p) {
      itens.push({ chave, titulo: p.titulo, dados: p.dados, origem: "codigo" });
    }
  }
  return { grupo, itens, materializado: gravada !== null };
}
