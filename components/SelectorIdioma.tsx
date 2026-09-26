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
      className={`inline-flex items-center rounded-full bg-white/8 p-0.5 ${compacto ? "h-8" : "h-9"}`}
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
            className={`h-full rounded-full px-2.5 font-ui text-[13px] uppercase transition-colors ${
              activo ? "bg-white text-ink-950" : "text-ink-400 hover:text-white"
            }`}
          >
            {CODIGO_IDIOMA[i]}
          </button>
        );
      })}
    </div>
  );
}
