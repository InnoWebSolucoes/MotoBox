import "server-only";

/* ============================================================
   MOTOBOX — Registo do conteúdo editável
   Tudo o que o site mostra e não vem de uma tabela própria
   vive em documentos (na tabela `paginas_legais`, com o slug
   "conteudo.<chave>"; ver lib/conteudo/servidor.ts). Aqui fica
   a lista de documentos e de grupos que o painel de gestão
   conhece, com o conteúdo de partida de cada um: o que estava
   escrito no código. Enquanto um documento não for gravado no
   painel, o site mostra esse conteúdo de partida.

   Cada secção tem o seu ficheiro em ./grupos.
   ============================================================ */

import type { DefDoc, DefGrupo } from "./registo-tipos";
import * as site from "./grupos/site";
import * as paginas from "./grupos/paginas";
import * as rotas from "./grupos/rotas";
import * as clubes from "./grupos/clubes";
import * as desporto from "./grupos/desporto";
import * as eventos from "./grupos/eventos";
import * as comunidade from "./grupos/comunidade";
import * as geral from "./grupos/geral";
import * as contas from "./grupos/contas";

export type { DefDoc, DefGrupo } from "./registo-tipos";

const FICHEIROS = [site, paginas, rotas, clubes, desporto, eventos, comunidade, geral, contas];

export const DOCS = new Map<string, DefDoc>(FICHEIROS.flatMap((f) => f.DOCS).map((d) => [d.chave, d]));

export const GRUPOS = new Map<string, DefGrupo>(FICHEIROS.flatMap((f) => f.GRUPOS).map((g) => [g.grupo, g]));
