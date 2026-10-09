"use client";

/* ============================================================
   MOTOBOX — Textos gerais do site (contexto)
   O layout lê no servidor o documento "site.geral" (Gestão ›
   Entrada e painel › Geral) e entrega-o aqui. O rodapé das
   páginas interiores, o botão de acção, o aviso de cookies, a
   página de manutenção e as páginas de sistema (404, sem
   acesso, newsletter) lêem daqui os seus textos. Fora do
   provider (ou sem nada gravado), valem os de partida.
   ============================================================ */

import { createContext, useContext, type ReactNode } from "react";
import { GERAL_PADRAO, type TextosGerais } from "@/lib/conteudo/grupos/geral";

const Ctx = createContext<TextosGerais>(GERAL_PADRAO());

export function TextosGeraisProvider({ textos, children }: { textos: TextosGerais; children: ReactNode }) {
  return <Ctx.Provider value={textos}>{children}</Ctx.Provider>;
}

export const useTextosGerais = () => useContext(Ctx);

/** Endereço fora do site (abre noutro separador). */
export const eExterno = (href: string) => /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
