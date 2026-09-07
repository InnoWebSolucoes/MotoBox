"use client";

/* ============================================================
   Banner de consentimento de cookies
   Guarda a escolha em localStorage. As categorias analítica e
   de marketing ficam desligadas até haver consentimento
   expresso, conforme a Política de Cookies.
   ============================================================ */

import Link from "next/link";
import { useEffect, useState } from "react";

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
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-90 border-t border-ink-700 bg-ink-900/98 backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-display text-sm uppercase tracking-wider text-white">
              Cookies nesta plataforma
            </p>
            <p className="mt-1.5 text-sm text-ink-300">
              Usamos cookies essenciais para o funcionamento do site. Com o seu consentimento,
              usamos também cookies analíticos para perceber como a plataforma é utilizada.{" "}
              <Link href="/cookies" className="text-mb-red underline underline-offset-2 hover:text-mb-red-light">
                Política de Cookies
              </Link>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDetalhe((d) => !d)}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-ink-200 transition-colors hover:border-ink-400 hover:text-white"
            >
              Personalizar
            </button>
            <button
              type="button"
              onClick={() => guardar(false, false)}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800"
            >
              Só essenciais
            </button>
            <button
              type="button"
              onClick={() => guardar(true, true)}
              className="h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark"
            >
              Aceitar tudo
            </button>
          </div>
        </div>

        {detalhe && (
          <div className="mt-4 grid gap-2 border-t border-ink-800 pt-4 sm:grid-cols-3">
            <div className="border border-ink-700 bg-ink-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-white">Essenciais</p>
                <span className="text-[10px] uppercase tracking-widest text-ok">Sempre activo</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">Sessão, carrinho de bilhetes e preferências.</p>
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-2 border border-ink-700 bg-ink-950 p-3">
              <span>
                <span className="block text-sm text-white">Analíticos</span>
                <span className="mt-1 block text-xs text-ink-500">Estatísticas agregadas de utilização.</span>
              </span>
              <input type="checkbox" checked={analiticos} onChange={(e) => setAnaliticos(e.target.checked)} />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-2 border border-ink-700 bg-ink-950 p-3">
              <span>
                <span className="block text-sm text-white">Marketing</span>
                <span className="mt-1 block text-xs text-ink-500">Campanhas e conteúdo personalizado.</span>
              </span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            </label>

            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={() => guardar(analiticos, marketing)}
                className="h-10 w-full border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red sm:w-auto"
              >
                Guardar preferências
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
