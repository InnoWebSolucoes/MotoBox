"use client";

/* ============================================================
   MOTOBOX — Texto traduzido dentro de componentes de servidor

   A maioria das páginas é renderizada no servidor, e o idioma
   escolhido vive num contexto de cliente. Em vez de converter
   páginas inteiras em componentes de cliente — o que faria o
   conteúdo todo atravessar o bundle — só o texto passa por aqui.

   `<T k="paginas.pilotosTitulo" />`   chave do dicionário
   `<C>{noticia.titulo}</C>`           conteúdo vindo dos dados
   ============================================================ */

import { useIdioma } from "@/lib/i18n/contexto";
import { useTexto } from "@/lib/i18n/useConteudo";

/** Texto da interface, por chave do dicionário. */
export function T({
  k,
  vars,
}: {
  k: string;
  vars?: Record<string, string | number>;
}) {
  const { t } = useIdioma();
  return <>{t(k, vars)}</>;
}

/** Conteúdo vindo de `lib/data.ts` (títulos, resumos, biografias). */
export function C({ children }: { children: string }) {
  return <>{useTexto(children)}</>;
}

/**
 * Versão para quando o texto tem de ser uma string e não um nó —
 * `alt`, `title`, `placeholder` e afins.
 */
export function useT() {
  return useIdioma().t;
}
