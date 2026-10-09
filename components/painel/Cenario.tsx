"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { caminhoDaPagina } from "@/lib/base";
import { Fundo, type FundoVideo } from "./Fundo";
import { BarraAccao } from "./BarraAccao";

/**
 * Cenário comum às páginas públicas: o vídeo de fundo por trás e o
 * botão de acção por baixo da moldura. O painel de gestão tem a sua
 * própria estrutura e fica de fora. `fundo` vem do layout (conteúdo
 * editável "site.entrada").
 */
export function Cenario({ children, fundo }: { children: ReactNode; fundo?: FundoVideo }) {
  const caminho = caminhoDaPagina(usePathname());
  if (caminho === "/admin" || caminho.startsWith("/admin/")) return <>{children}</>;

  return (
    <>
      <Fundo video={fundo?.video} poster={fundo?.poster} />
      <div className="relative z-[1] flex min-h-dvh flex-col pb-24 lg:pb-0">
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <BarraAccao />
      </div>
    </>
  );
}
