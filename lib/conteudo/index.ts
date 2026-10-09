import "server-only";

/* ============================================================
   MOTOBOX — Conteúdo editável: leitura nas páginas públicas
   As páginas (componentes de servidor) lêem daqui o conteúdo
   que o painel de gestão edita. Sem nada gravado, vem o
   conteúdo de partida (o do código), por isso o site nunca
   fica vazio. Para passar o conteúdo a um componente de
   cliente, leia-o na página e passe-o por props.

     const entrada = await lerDoc<ConteudoEntrada>("site.entrada");
     const rotas = await lerGrupo<Rota>("rotas");          // [{ chave, titulo, dados, … }]
     const rota = await lerItem<Rota>("rotas", "tundavala");
   ============================================================ */

import { lerLinhasPublicas } from "./servidor";
import { resolverDoc, resolverGrupo } from "./resolver";
import type { Documento } from "./tipos";

export type { Documento } from "./tipos";

/** Um documento solto (ex.: "site.entrada", "paginas.sobre"), já junto com o de partida. */
export async function lerDoc<T>(chave: string): Promise<T> {
  return resolverDoc(chave, await lerLinhasPublicas()).dados as T;
}

/** Todos os itens de um grupo (ex.: "rotas"), pela ordem do site. */
export async function lerGrupo<T>(grupo: string): Promise<Documento<T>[]> {
  return resolverGrupo(grupo, await lerLinhasPublicas()).itens as Documento<T>[];
}

/** Só os dados dos itens de um grupo, pela ordem do site. */
export async function lerListaDados<T>(grupo: string): Promise<T[]> {
  return (await lerGrupo<T>(grupo)).map((d) => d.dados);
}

/** Um item de um grupo, ou undefined se não existir. */
export async function lerItem<T>(grupo: string, chave: string): Promise<T | undefined> {
  return (await lerGrupo<T>(grupo)).find((d) => d.chave === chave)?.dados;
}
