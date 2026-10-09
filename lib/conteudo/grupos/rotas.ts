/* ============================================================
   Conteúdo editável — Rotas: cada rota é um documento com o
   guia inteiro (paragens, troços, horário, combustível, comer,
   dormir, perigos, clima, fotografias, fontes), o estado da
   estrada e o traçado do GPX. O ponto de partida são as rotas do
   código (lib/rotas.ts).

   "paginas.rotas" guarda os textos de /rotas, os textos fixos da
   página de cada rota, os do guia em PDF de cada rota (o botão e
   o documento, em "guia", ver TEXTOS_GUIA em lib/rotas-pagina.ts)
   e o que é comum a todas as rotas (emergência, documentos, rede,
   combustível, o que levar, quando ir, planear, regras da estrada
   e as tabelas de clima).

   As páginas lêem tudo com lib/rotas-conteudo.ts; o painel edita
   em /admin/rotas.
   ============================================================ */

import { ROTAS, paginaRotasPadrao } from "@/lib/rotas";
import type { DefDoc, DefGrupo } from "../registo-tipos";

export const GRUPOS: DefGrupo[] = [
  {
    grupo: "rotas",
    titulo: "Rotas",
    pagina: (chave) => `/rotas/${chave}`,
    // Cada rota já leva o estado da estrada (`estrada`) e o traçado (`tracado`).
    padrao: () => ROTAS.map((r) => ({ chave: r.slug, titulo: r.nome, dados: r })),
  },
];

/** Entrada da secção /rotas, os textos fixos das rotas e do guia em PDF e o que é comum a todas (emergência, documentos, regras…). */
export const DOCS: DefDoc[] = [
  { chave: "paginas.rotas", titulo: "Rotas (página da secção)", pagina: "/rotas", padrao: () => paginaRotasPadrao() },
];
