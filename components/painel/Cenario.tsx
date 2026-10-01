"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Fundo } from "./Fundo";
import { BarraAccao } from "./BarraAccao";

/**
 * Cenário comum às páginas públicas: o vídeo de fundo por trás e o
 * botão de acção por baixo da moldura. O painel de gestão tem a sua
 * própria estrutura e fica de fora.
 */
export function Cenario({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  if (caminho === "/admin" || caminho.startsWith("/admin/")) return <>{children}</>;

  return (
    <>
      <Fundo />
      <div className="relative z-[1] flex min-h-dvh flex-col pb-24 lg:pb-0">
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <BarraAccao />
      </div>
    </>
  );
}
