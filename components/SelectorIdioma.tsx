"use client";

/* ============================================================
   MOTOBOX — Selector de idioma
   Alterna entre português e inglês. A escolha fica guardada no
   navegador e aplica-se a todo o site, incluindo o painel.
   ============================================================ */

import { useIdioma } from "@/lib/i18n/contexto";
import { IDIOMAS, CODIGO_IDIOMA, NOME_IDIOMA } from "@/lib/i18n/idiomas";

export function SelectorIdioma({ compacto = false }: { compacto?: boolean }) {
  const { idioma, definirIdioma, t } = useIdioma();

  return (
    <div
      role="group"
      aria-label={t("nav.mudarIdioma")}
      className={`inline-flex border border-ink-700 ${compacto ? "" : "h-9"}`}
    >
      {IDIOMAS.map((i) => {
        const activo = i === idioma;
        return (
          <button
            key={i}
            type="button"
            onClick={() => definirIdioma(i)}
            aria-pressed={activo}
            title={NOME_IDIOMA[i]}
            className={`px-2.5 font-display text-[11px] uppercase tracking-widest transition-colors ${
              compacto ? "py-1" : ""
            } ${
              activo
                ? "bg-mb-red text-white"
                : "text-ink-400 hover:bg-ink-800 hover:text-white"
            }`}
          >
            {CODIGO_IDIOMA[i]}
          </button>
        );
      })}
    </div>
  );
}
