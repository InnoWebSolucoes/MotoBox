/* ============================================================
   MOTOBOX — Textos editáveis com valores no meio
   Como `preencher`, mas os valores podem ser elementos (um
   número em algarismos tabulares, um nome a negrito…):

     comValores("Faltam {n} pontos", { n: <span className="tabular-nums">12</span> })

   Sem hooks: serve a componentes de servidor e de cliente.
   ============================================================ */

import { Fragment, type ReactNode } from "react";

export function comValores(texto: string, valores: Record<string, ReactNode>): ReactNode {
  const partes = String(texto ?? "").split(/(\{\w+\})/g);
  return partes.map((p, i) => {
    const m = /^\{(\w+)\}$/.exec(p);
    if (m && m[1] in valores) return <Fragment key={i}>{valores[m[1]]}</Fragment>;
    return p ? <Fragment key={i}>{p}</Fragment> : null;
  });
}
