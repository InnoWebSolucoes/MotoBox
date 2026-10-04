"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";
import { Icon } from "@/components/ui";

/** Partilhar uma prova: WhatsApp, Facebook, ou a folha nativa do telemóvel (sem ela, copia a ligação). */
export function Partilhar({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);

  function abrir(rede: "whatsapp" | "facebook") {
    const url = window.location.href;
    const destino =
      rede === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`
        : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(destino, "_blank", "noopener,noreferrer");
  }

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

  const botao =
    "inline-flex h-11 items-center gap-2 rounded-[var(--raio)] bg-white/8 px-4 text-sm text-white transition-colors hover:bg-mb-red";

  return (
    <div className="flex flex-wrap gap-[var(--intervalo)]">
      <button type="button" onClick={() => abrir("whatsapp")} className={botao}>
        <Icon name="whatsapp" className="size-4" />
        WhatsApp
      </button>
      <button type="button" onClick={() => abrir("facebook")} className={botao}>
        <Icon name="facebook" className="size-4" />
        Facebook
      </button>
      <button type="button" onClick={partilhar} className={botao}>
        {copiado ? <Link2 className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
        <span aria-live="polite">{copiado ? "Ligação copiada" : "Partilhar"}</span>
      </button>
    </div>
  );
}
