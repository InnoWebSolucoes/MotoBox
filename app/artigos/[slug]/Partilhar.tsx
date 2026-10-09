"use client";

import { Partilhar as MenuPartilhar } from "@/components/Partilhar";

/**
 * Partilhar o artigo: abre o menu de partilha do site (WhatsApp, Facebook,
 * Instagram, X, Telegram, email, copiar a ligação e a folha do telemóvel).
 * Os textos editam-se no painel (Artigos → Página Artigos).
 */
export function Partilhar({
  titulo, rotulo = "Partilhar", botao = "Partilhar artigo",
}: {
  titulo: string;
  rotulo?: string;
  botao?: string;
  /** Mantido por compatibilidade: o menu tem o seu próprio "Copiado". */
  copiadoTexto?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{rotulo}</p>
      <MenuPartilhar
        titulo={titulo}
        rotulo={botao}
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-[var(--raio)] bg-white/8 px-4 text-sm text-white transition-colors hover:bg-white/15"
      />
    </div>
  );
}
