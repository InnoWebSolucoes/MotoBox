/* ============================================================
   MOTOBOX — Eventos: ligações
   Todos os eventos vivem em /eventos, sejam passeios, encontros
   ou provas. A função fica para o painel, os emails e a conta
   usarem a mesma regra.
   ============================================================ */

/** Página de um evento. */
export function hrefEvento(e: { slug: string }): string {
  return `/eventos/${e.slug}`;
}
