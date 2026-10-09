"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";

/**
 * Partilhar o artigo: a folha nativa do telemóvel ou, sem ela, copiar a ligação.
 * Os textos editam-se no painel (Artigos → Página Artigos).
 */
export function Partilhar({
  titulo, rotulo = "Partilhar", botao = "Partilhar artigo", copiadoTexto = "Ligação copiada",
}: {
  titulo: string;
  rotulo?: string;
  botao?: string;
  copiadoTexto?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function partilhar() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        /* cancelado: cai para copiar */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* sem permissão para a área de transferência */
    }
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{rotulo}</p>
      <button
        type="button"
        onClick={partilhar}
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-[var(--raio)] bg-white/8 px-4 text-sm text-white transition-colors hover:bg-white/15"
      >
        {copiado ? <Link2 className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
        <span aria-live="polite">{copiado ? copiadoTexto : botao}</span>
      </button>
    </div>
  );
}
