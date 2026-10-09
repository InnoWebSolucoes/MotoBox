"use client";

import { Partilhar as MenuPartilhar } from "@/components/Partilhar";

/**
 * Partilhar uma prova: o menu de partilha do site (WhatsApp, Facebook,
 * Instagram, X, Telegram, email, copiar a ligação e a folha do telemóvel).
 */
export function Partilhar({
  titulo, rotulo = "Partilhar",
}: {
  titulo: string;
  rotulo?: string;
  /** Mantido por compatibilidade: o menu tem o seu próprio "Copiado". */
  copiadoTexto?: string;
}) {
  return (
    <MenuPartilhar
      titulo={titulo}
      rotulo={rotulo}
      className="inline-flex h-11 items-center gap-2 rounded-[var(--raio)] bg-white/8 px-4 text-sm text-white transition-colors hover:bg-mb-red"
    />
  );
}
