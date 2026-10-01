"use client";

/* ============================================================
   Banner de consentimento de cookies
   Guarda a escolha em localStorage. As categorias analítica e
   de marketing ficam desligadas até haver consentimento
   expresso, conforme a Política de Cookies.
   ============================================================ */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useIdioma } from "@/lib/i18n/contexto";

const CHAVE = "motobox-cookies-v1";

export interface Consentimento {
  essenciais: true;
  analiticos: boolean;
  marketing: boolean;
  decidido: string;
}

export function lerConsentimento(): Consentimento | null {
  try {
    const g = localStorage.getItem(CHAVE);
    return g ? (JSON.parse(g) as Consentimento) : null;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const { t } = useIdioma();
  const [visivel, setVisivel] = useState(false);
  const [detalhe, setDetalhe] = useState(false);
  const [analiticos, setAnaliticos] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!lerConsentimento()) setVisivel(true);
  }, []);

  const guardar = (a: boolean, m: boolean) => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({
        essenciais: true, analiticos: a, marketing: m,
        decidido: new Date().toISOString(),
      }));
    } catch {
      /* modo privado — a escolha vale só para esta sessão */
    }
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-label={t("cookies.preferencias")}
      className="fixed inset-x-[var(--gutter)] bottom-24 z-90 rounded-[6px] bg-near-black/95 shadow-2xl shadow-black/60 ring-1 ring-white/8 backdrop-blur-md lg:inset-x-auto lg:bottom-[var(--gutter)] lg:left-[var(--gutter)] lg:w-[26rem]"
    >
      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="max-w-2xl">
            <p className="text-[15px] font-semibold text-white">
              {t("cookies.titulo")}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
              {t("cookies.texto")}{" "}
              <Link href="/cookies" className="text-white underline underline-offset-2 hover:text-mb-red-light">
                {t("cookies.politica")}
              </Link>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDetalhe((d) => !d)}
              className="h-10 flex-auto rounded-[6px] px-3 text-sm text-white/75 transition-colors hover:bg-white/8 hover:text-white"
            >
              {t("cookies.personalizar")}
            </button>
            <button
              type="button"
              onClick={() => guardar(false, false)}
              className="h-10 flex-auto rounded-[6px] bg-white/10 px-4 text-sm text-white transition-colors hover:bg-white/20"
            >
              {t("cookies.soEssenciais")}
            </button>
            <button
              type="button"
              onClick={() => guardar(true, true)}
              className="h-10 flex-auto rounded-[6px] bg-mb-red px-4 text-sm text-white transition-colors hover:bg-mb-red-dark"
            >
              {t("cookies.aceitarTudo")}
            </button>
          </div>
        </div>

        {detalhe && (
          <div className="mt-5 grid gap-2 border-t border-white/8 pt-5">
            <div className="rounded-[6px] bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-white">{t("cookies.essenciais")}</p>
                <span className="text-[10px] uppercase tracking-widest text-ok">{t("cookies.sempreActivo")}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">{t("cookies.essenciaisDesc")}</p>
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-2 rounded-[6px] bg-white/5 p-4 transition-colors hover:bg-white/8">
              <span>
                <span className="block text-sm text-white">{t("cookies.analiticos")}</span>
                <span className="mt-1 block text-xs text-ink-500">{t("cookies.analiticosDesc")}</span>
              </span>
              <input type="checkbox" checked={analiticos} onChange={(e) => setAnaliticos(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#e10600]" />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-2 rounded-[6px] bg-white/5 p-4 transition-colors hover:bg-white/8">
              <span>
                <span className="block text-sm text-white">{t("cookies.marketing")}</span>
                <span className="mt-1 block text-xs text-ink-500">{t("cookies.marketingDesc")}</span>
              </span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#e10600]" />
            </label>

            <div>
              <button
                type="button"
                onClick={() => guardar(analiticos, marketing)}
                className="h-10 w-full rounded-[6px] bg-white px-5 text-sm text-black transition-colors hover:bg-white/85"
              >
                {t("cookies.guardarPrefs")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
