"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Mostra o conteúdo em todo o site excepto no painel de gestão.
 * O rodapé público não tem lugar no painel: lá a navegação é a barra
 * lateral e o rodapé só empurrava o conteúdo.
 */
export function ForaDoPainel({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  if (caminho === "/admin" || caminho.startsWith("/admin/")) return null;
  return <>{children}</>;
}
