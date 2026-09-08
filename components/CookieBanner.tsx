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
      className="fixed inset-x-0 bottom-0 z-90 border-t border-ink-700 bg-ink-900/98 backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-display text-sm uppercase tracking-wider text-white">
              {t("cookies.titulo")}
            </p>
            <p className="mt-1.5 text-sm text-ink-300">
              {t("cookies.texto")}{" "}
              <Link href="/cookies" className="text-mb-red underline underline-offset-2 hover:text-mb-red-light">
                {t("cookies.politica")}
              </Link>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDetalhe((d) => !d)}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-ink-200 transition-colors hover:border-ink-400 hover:text-white"
            >
              {t("cookies.personalizar")}
            </button>
            <button
              type="button"
              onClick={() => guardar(false, false)}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800"
            >
              {t("cookies.soEssenciais")}
            </button>
            <button
              type="button"
              onClick={() => guardar(true, true)}
              className="h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark"
            >
              {t("cookies.aceitarTudo")}
            </button>
          </div>
        </div>

        {detalhe && (
          <div className="mt-4 grid gap-2 border-t border-ink-800 pt-4 sm:grid-cols-3">
            <div className="border border-ink-700 bg-ink-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-white">{t("cookies.essenciais")}</p>
                <span className="text-[10px] uppercase tracking-widest text-ok">{t("cookies.sempreActivo")}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">{t("cookies.essenciaisDesc")}</p>
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-2 border border-ink-700 bg-ink-950 p-3">
              <span>
                <span className="block text-sm text-white">{t("cookies.analiticos")}</span>
                <span className="mt-1 block text-xs text-ink-500">{t("cookies.analiticosDesc")}</span>
              </span>
              <input type="checkbox" checked={analiticos} onChange={(e) => setAnaliticos(e.target.checked)} />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-2 border border-ink-700 bg-ink-950 p-3">
              <span>
                <span className="block text-sm text-white">{t("cookies.marketing")}</span>
                <span className="mt-1 block text-xs text-ink-500">{t("cookies.marketingDesc")}</span>
              </span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            </label>

            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={() => guardar(analiticos, marketing)}
                className="h-10 w-full border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red sm:w-auto"
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
